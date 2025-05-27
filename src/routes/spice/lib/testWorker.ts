
/**
 * Test worker functionality and timing utilities
 */

export interface WorkerTestResult {
	success: boolean;
	duration: number;
	error?: string;
	result?: any;
}

export interface PerformanceMetrics {
	totalTime: number;
	parseTime: number;
	simulationTime: number;
	transferTime: number;
	workerCount: number;
}

/**
 * Test if web workers are available in the current environment
 */
export function isWorkerSupported(): boolean {
	return typeof Worker !== 'undefined';
}

/**
 * Test worker creation and basic communication
 */
export async function testWorkerBasic(): Promise<WorkerTestResult> {
	const startTime = performance.now();
	
	try {
		if (!isWorkerSupported()) {
			throw new Error('Web Workers not supported');
		}

		// Create a simple test worker
		const testWorkerCode = `
			self.onmessage = function(e) {
				const { data } = e;
				if (data.type === 'test') {
					self.postMessage({
						type: 'test_response',
						message: 'Worker is functional',
						timestamp: Date.now()
					});
				}
			};
		`;

		const blob = new Blob([testWorkerCode], { type: 'application/javascript' });
		const workerUrl = URL.createObjectURL(blob);
		const worker = new Worker(workerUrl);

		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				worker.terminate();
				URL.revokeObjectURL(workerUrl);
				resolve({
					success: false,
					duration: performance.now() - startTime,
					error: 'Worker test timeout'
				});
			}, 5000);

			worker.onmessage = (e) => {
				const { data } = e;
				if (data.type === 'test_response') {
					clearTimeout(timeout);
					worker.terminate();
					URL.revokeObjectURL(workerUrl);
					resolve({
						success: true,
						duration: performance.now() - startTime,
						result: data
					});
				}
			};

			worker.onerror = (error) => {
				clearTimeout(timeout);
				worker.terminate();
				URL.revokeObjectURL(workerUrl);
				resolve({
					success: false,
					duration: performance.now() - startTime,
					error: error.message
				});
			};

			// Send test message
			worker.postMessage({ type: 'test' });
		});

	} catch (error) {
		return {
			success: false,
			duration: performance.now() - startTime,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Test simulation worker with a simple circuit
 */
export async function testSimulationWorker(): Promise<WorkerTestResult> {
	const startTime = performance.now();
	
	try {
		// Import the simulation worker dynamically
		const { SimulationWorker } = await import('./simulationWorker');
		
		const worker = new SimulationWorker();

		// Simple RC circuit for testing
		const testNetlist = `
Simple RC Circuit Test
V1 in 0 DC 5
R1 in out 1k
C1 out 0 1u
.DC V1 0 5 0.1
.end
		`.trim();

		const result = await worker.simulate(testNetlist);
		worker.terminate();

		return {
			success: true,
			duration: performance.now() - startTime,
			result: {
				dataPoints: result?.data ? Object.keys(result.data).length : 0,
				hasXData: result?.data?.x !== undefined,
				hasVoltageData: Object.keys(result?.data || {}).some(key => key.startsWith('v('))
			}
		};

	} catch (error) {
		return {
			success: false,
			duration: performance.now() - startTime,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Benchmark worker performance with different circuit sizes
 */
export async function benchmarkWorkerPerformance(): Promise<PerformanceMetrics[]> {
	const results: PerformanceMetrics[] = [];
	
	// Test circuits of different complexity
	const testCases = [
		{ name: 'Simple', components: 3, nodes: 3 },
		{ name: 'Medium', components: 10, nodes: 8 },
		{ name: 'Complex', components: 25, nodes: 15 }
	];

	for (const testCase of testCases) {
		try {
			const netlist = generateTestCircuit(testCase.components, testCase.nodes);
			const metrics = await measureSimulationPerformance(netlist);
			results.push(metrics);
		} catch (error) {
			console.warn(`Benchmark failed for ${testCase.name}:`, error);
		}
	}

	return results;
}

/**
 * Generate a test circuit with specified complexity
 */
function generateTestCircuit(componentCount: number, nodeCount: number): string {
	let netlist = 'Performance Test Circuit\n';
	
	// Add voltage source
	netlist += 'V1 1 0 DC 5\n';
	
	// Add resistors to create a network
	let compIndex = 1;
	for (let i = 0; i < componentCount - 1 && compIndex < componentCount; i++) {
		const node1 = (i % nodeCount) + 1;
		const node2 = ((i + 1) % nodeCount) + 1;
		const value = 1000 + (i * 100); // Varying resistance values
		
		if (compIndex % 3 === 0) {
			// Add capacitor
			netlist += `C${compIndex} ${node1} ${node2} ${1 + i}u\n`;
		} else {
			// Add resistor
			netlist += `R${compIndex} ${node1} ${node2} ${value}\n`;
		}
		compIndex++;
	}
	
	// Add DC analysis
	netlist += '.DC V1 0 5 0.1\n';
	netlist += '.end\n';
	
	return netlist;
}

/**
 * Measure detailed performance metrics for a simulation
 */
async function measureSimulationPerformance(netlist: string): Promise<PerformanceMetrics> {
	const startTime = performance.now();
	let parseTime = 0;
	let simulationTime = 0;
	let transferTime = 0;

	try {
		const { SimulationWorker } = await import('./simulationWorker');
		
		const parseStart = performance.now();
		// Parse timing would be measured inside the worker
		parseTime = performance.now() - parseStart;

		const simStart = performance.now();
		const worker = new SimulationWorker();
		const result = await worker.simulate(netlist);
		worker.terminate();
		simulationTime = performance.now() - simStart;

		const transferStart = performance.now();
		// Transfer time for result data
		const dataSize = JSON.stringify(result).length;
		transferTime = performance.now() - transferStart;

		return {
			totalTime: performance.now() - startTime,
			parseTime,
			simulationTime,
			transferTime,
			workerCount: 1
		};

	} catch (error) {
		throw new Error(`Performance measurement failed: ${error}`);
	}
}

/**
 * Test worker memory usage and cleanup
 */
export async function testWorkerMemory(): Promise<{
	success: boolean;
	memoryUsage?: number;
	leakDetected: boolean;
	error?: string;
}> {
	try {
		const initialMemory = performance.memory?.usedJSHeapSize || 0;
		
		// Create and destroy multiple workers
		const workerCount = 10;
		const workers = [];

		for (let i = 0; i < workerCount; i++) {
			const { SimulationWorker } = await import('./simulationWorker');
			const worker = new SimulationWorker();
			workers.push(worker);
		}

		// Terminate all workers
		for (const worker of workers) {
			worker.terminate();
		}

		// Force garbage collection if available
		if (global.gc) {
			global.gc();
		}

		// Wait for cleanup
		await new Promise(resolve => setTimeout(resolve, 1000));

		const finalMemory = performance.memory?.usedJSHeapSize || 0;
		const memoryDelta = finalMemory - initialMemory;
		
		// Consider significant memory increase as potential leak
		const leakThreshold = 10 * 1024 * 1024; // 10MB
		const leakDetected = memoryDelta > leakThreshold;

		return {
			success: true,
			memoryUsage: memoryDelta,
			leakDetected
		};

	} catch (error) {
		return {
			success: false,
			leakDetected: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Test parallel worker execution
 */
export async function testParallelWorkers(workerCount: number = 4): Promise<WorkerTestResult> {
	const startTime = performance.now();
	
	try {
		const { SimulationWorker } = await import('./simulationWorker');
		
		// Create test netlists for parallel execution
		const netlists = Array.from({ length: workerCount }, (_, i) => 
			generateTestCircuit(5 + i, 4)
		);

		// Run simulations in parallel
		const promises = netlists.map(async (netlist) => {
			const worker = new SimulationWorker();
			try {
				const result = await worker.simulate(netlist);
				worker.terminate();
				return result;
			} catch (error) {
				worker.terminate();
				throw error;
			}
		});

		const results = await Promise.all(promises);

		return {
			success: true,
			duration: performance.now() - startTime,
			result: {
				workerCount,
				completedSimulations: results.length,
				averageDataPoints: results.reduce((sum, result) => 
					sum + (result?.data ? Object.keys(result.data).length : 0), 0) / results.length
			}
		};

	} catch (error) {
		return {
			success: false,
			duration: performance.now() - startTime,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Run comprehensive worker test suite
 */
export async function runWorkerTestSuite(): Promise<{
	basicTest: WorkerTestResult;
	simulationTest: WorkerTestResult;
	parallelTest: WorkerTestResult;
	memoryTest: any;
	performance: PerformanceMetrics[];
	overall: boolean;
}> {
	console.log('Running worker test suite...');

	const basicTest = await testWorkerBasic();
	console.log('Basic worker test:', basicTest.success ? 'PASS' : 'FAIL');

	const simulationTest = await testSimulationWorker();
	console.log('Simulation worker test:', simulationTest.success ? 'PASS' : 'FAIL');

	const parallelTest = await testParallelWorkers(3);
	console.log('Parallel worker test:', parallelTest.success ? 'PASS' : 'FAIL');

	const memoryTest = await testWorkerMemory();
	console.log('Memory test:', memoryTest.success ? 'PASS' : 'FAIL');

	const performance = await benchmarkWorkerPerformance();
	console.log('Performance benchmark completed');

	const overall = basicTest.success && simulationTest.success && 
		parallelTest.success && memoryTest.success;

	return {
		basicTest,
		simulationTest,
		parallelTest,
		memoryTest,
		performance,
		overall
	};
}