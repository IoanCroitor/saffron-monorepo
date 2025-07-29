/**
 * AI Circuit Inference Simulator
 * 
 * This service simulates the circuit inference API responses for development and testing.
 * It mimics the behavior of the real API server running on localhost:8002.
 */

export interface CircuitNode {
	name: string;
	type: 'source' | 'internal' | 'ground';
}

export interface CircuitComponent {
	from: string;
	to: string;
	type: 'R' | 'L' | 'C';
	value: number;
}

export interface CircuitData {
	nodes: CircuitNode[];
	components: [string, string, string, number][]; // [from, to, type, value]
	input_signal: number[];
	time_vector: number[];
	input_steps: number;
	predict_steps: number;
}

export interface PredictionResponse {
	success: boolean;
	inference_time: number;
	node_names: string[];
	predictions: number[][];
	error_message?: string;
}

export interface HealthResponse {
	status: string;
	model_loaded: boolean;
}

export interface ModelInfoResponse {
	parameters: number;
	device: string;
	config: {
		node_features: number;
		edge_features: number;
	};
}

class AISimulator {
	private baseUrl = 'http://localhost:8002';
	private isSimulationMode = false;

	constructor() {
		// Check if we should use simulation mode (when real API is not available)
		this.checkAPIAvailability();
	}

	private async checkAPIAvailability() {
		try {
			const response = await fetch(`${this.baseUrl}/health`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			this.isSimulationMode = !response.ok;
		} catch (error) {
			console.log('Real API not available, using simulation mode');
			this.isSimulationMode = true;
		}
	}

	// Signal generation functions
	public generateStepSignal(steps = 20, amplitude = 5): number[] {
		const signal = new Array(steps).fill(0);
		const startStep = Math.floor(steps * 0.25);
		const endStep = Math.floor(steps * 0.75);
		
		for (let i = startStep; i < endStep; i++) {
			signal[i] = amplitude;
		}
		
		return signal;
	}

	public generateTimeVector(steps = 20, totalTime = 0.002): number[] {
		return Array.from({length: steps}, (_, i) => {
			return (i / (steps - 1)) * totalTime;
		});
	}

	// Denormalization function
	public denormalizePredictions(predictions: number[][], inputSignal: number[]): number[][] {
		const inputMin = Math.min(...inputSignal);
		const inputMax = Math.max(...inputSignal);
		const inputRange = inputMax - inputMin;
		
		return predictions.map(nodePreds => {
			const nodeMin = Math.min(...nodePreds);
			const nodeMax = Math.max(...nodePreds);
			const nodeRange = nodeMax - nodeMin;
			
			if (nodeRange > 0) {
				return nodePreds.map(v => {
					return ((v - nodeMin) / nodeRange) * inputRange + inputMin;
				});
			} else {
				return nodePreds.map(() => inputMin);
			}
		});
	}

	// Simulate circuit behavior based on component types
	private simulateCircuitBehavior(circuitData: CircuitData): number[][] {
		const { nodes, components, input_signal, predict_steps } = circuitData;
		const nodeNames = nodes.map(n => n.name);
		const predictions: number[][] = [];

		// Initialize predictions for each node
		nodeNames.forEach(() => {
			predictions.push(new Array(predict_steps).fill(0));
		});

		// Find source node
		const sourceNode = nodes.find(n => n.type === 'source');
		if (!sourceNode) {
			throw new Error('No source node found in circuit');
		}

		const sourceIndex = nodeNames.indexOf(sourceNode.name);

		// Simulate different circuit behaviors based on components
		const hasCapacitor = components.some(c => c[2] === 'C');
		const hasInductor = components.some(c => c[2] === 'L');
		const hasResistor = components.some(c => c[2] === 'R');

		// RC Circuit behavior (exponential decay)
		if (hasCapacitor && hasResistor && !hasInductor) {
			const timeConstant = 0.0005; // RC time constant
			for (let i = 0; i < predict_steps; i++) {
				const t = i * 0.0001; // Time step
				const decay = Math.exp(-t / timeConstant);
				predictions[sourceIndex][i] = input_signal[0] * decay;
				
				// Simulate output node (connected to capacitor)
				const outputIndex = nodeNames.findIndex(name => 
					components.some(c => c[0] === name || c[1] === name) && name !== sourceNode.name
				);
				if (outputIndex !== -1) {
					predictions[outputIndex][i] = input_signal[0] * (1 - decay);
				}
			}
		}
		// RL Circuit behavior (exponential rise)
		else if (hasInductor && hasResistor && !hasCapacitor) {
			const timeConstant = 0.0003; // L/R time constant
			for (let i = 0; i < predict_steps; i++) {
				const t = i * 0.0001;
				const rise = 1 - Math.exp(-t / timeConstant);
				predictions[sourceIndex][i] = input_signal[0] * rise;
				
				const outputIndex = nodeNames.findIndex(name => 
					components.some(c => c[0] === name || c[1] === name) && name !== sourceNode.name
				);
				if (outputIndex !== -1) {
					predictions[outputIndex][i] = input_signal[0] * (1 - rise);
				}
			}
		}
		// Resistive divider (amplifier-like behavior)
		else if (hasResistor && !hasCapacitor && !hasInductor) {
			const gain = 0.6; // Simulate voltage divider effect
			for (let i = 0; i < predict_steps; i++) {
				predictions[sourceIndex][i] = input_signal[0];
				
				const outputIndex = nodeNames.findIndex(name => 
					components.some(c => c[0] === name || c[1] === name) && name !== sourceNode.name
				);
				if (outputIndex !== -1) {
					predictions[outputIndex][i] = input_signal[0] * gain;
				}
			}
		}
		// Default behavior (pass-through)
		else {
			for (let i = 0; i < predict_steps; i++) {
				predictions[sourceIndex][i] = input_signal[0];
			}
		}

		return predictions;
	}

	// API Methods
	async healthCheck(): Promise<HealthResponse> {
		if (!this.isSimulationMode) {
			try {
				const response = await fetch(`${this.baseUrl}/health`);
				if (response.ok) {
					return await response.json();
				}
			} catch (error) {
				console.log('Real API health check failed, using simulation');
			}
		}

		// Simulation response
		return {
			status: 'healthy',
			model_loaded: true
		};
	}

	async getModelInfo(): Promise<ModelInfoResponse> {
		if (!this.isSimulationMode) {
			try {
				const response = await fetch(`${this.baseUrl}/model/info`);
				if (response.ok) {
					return await response.json();
				}
			} catch (error) {
				console.log('Real API model info failed, using simulation');
			}
		}

		// Simulation response
		return {
			parameters: 1250000,
			device: 'cpu',
			config: {
				node_features: 64,
				edge_features: 32
			}
		};
	}

	async predictCustom(circuitData: CircuitData): Promise<PredictionResponse> {
		if (!this.isSimulationMode) {
			try {
				const response = await fetch(`${this.baseUrl}/predict_custom`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(circuitData)
				});
				if (response.ok) {
					return await response.json();
				}
			} catch (error) {
				console.log('Real API prediction failed, using simulation');
			}
		}

		// Simulation response
		try {
			const nodeNames = circuitData.nodes.map(n => n.name);
			const predictions = this.simulateCircuitBehavior(circuitData);
			
			// Add some realistic noise to predictions
			const noisyPredictions = predictions.map(nodePreds => 
				nodePreds.map(v => v + (Math.random() - 0.5) * 0.1)
			);

			return {
				success: true,
				inference_time: 0.15 + Math.random() * 0.1, // 150-250ms
				node_names: nodeNames,
				predictions: noisyPredictions
			};
		} catch (error: any) {
			return {
				success: false,
				inference_time: 0,
				node_names: [],
				predictions: [],
				error_message: error.message
			};
		}
	}

	// Helper methods for common circuit types
	async testRCCircuit(): Promise<PredictionResponse> {
		const circuitData: CircuitData = {
			nodes: [
				{ name: "vin", type: "source" },
				{ name: "vout", type: "internal" },
				{ name: "gnd", type: "ground" }
			],
			components: [
				["vin", "vout", "R", 1000.0],   // 1kΩ resistor
				["vout", "gnd", "C", 1e-6]      // 1μF capacitor
			],
			input_signal: this.generateStepSignal(20, 5),
			time_vector: this.generateTimeVector(20, 0.002),
			input_steps: 10,
			predict_steps: 10
		};

		return this.predictCustom(circuitData);
	}

	async testRLCircuit(): Promise<PredictionResponse> {
		const circuitData: CircuitData = {
			nodes: [
				{ name: "vin", type: "source" },
				{ name: "vout", type: "internal" },
				{ name: "gnd", type: "ground" }
			],
			components: [
				["vin", "vout", "R", 100.0],    // 100Ω resistor
				["vout", "gnd", "L", 1e-3]      // 1mH inductor
			],
			input_signal: this.generateStepSignal(20, 5),
			time_vector: this.generateTimeVector(20, 0.002),
			input_steps: 10,
			predict_steps: 10
		};

		return this.predictCustom(circuitData);
	}

	async testAmplifierCircuit(): Promise<PredictionResponse> {
		const circuitData: CircuitData = {
			nodes: [
				{ name: "vin", type: "source" },
				{ name: "v1", type: "internal" },
				{ name: "vout", type: "internal" },
				{ name: "gnd", type: "ground" }
			],
			components: [
				["vin", "v1", "R", 1000.0],     // Input resistor
				["v1", "vout", "R", 5000.0],    // Feedback resistor (gain = 6)
				["vout", "gnd", "R", 1000.0]    // Output resistor
			],
			input_signal: this.generateStepSignal(20, 5),
			time_vector: this.generateTimeVector(20, 0.002),
			input_steps: 10,
			predict_steps: 10
		};

		return this.predictCustom(circuitData);
	}

	// Check if we're in simulation mode
	isSimulation(): boolean {
		return this.isSimulationMode;
	}

	// Force simulation mode
	setSimulationMode(enabled: boolean): void {
		this.isSimulationMode = enabled;
	}
}

// Export singleton instance
export const aiSimulator = new AISimulator(); 