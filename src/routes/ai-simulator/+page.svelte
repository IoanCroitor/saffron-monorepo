<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { 
		Zap, 
		Loader2, 
		AlertCircle, 
		CheckCircle,
		Play,
		Settings,
		Activity,
		TrendingUp,
		CircuitBoard,
		Maximize2,
		Minimize2,
		FileText
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { aiSimulator, type CircuitData, type PredictionResponse } from '$lib/services/ai-simulator';
	import * as d3 from 'd3';

	// State management
	let isProcessing = $state(false);
	let error = $state('');
	let success = $state('');
	let apiStatus = $state<'unknown' | 'available' | 'simulation'>('unknown');
	let modelInfo: any = $state(null);
	let currentPrediction: PredictionResponse | null = $state(null);
	let selectedCircuit = $state<'rc' | 'rl' | 'amplifier' | 'custom'>('rc');
	let isVisualizationExpanded = $state(false);
	
	// D3 visualization elements
	let chartContainer: HTMLDivElement;
	let timeChartContainer: HTMLDivElement;
	let circuitDiagramContainer: HTMLDivElement;
	
	// Custom circuit data
	let customCircuitData: CircuitData = $state({
		nodes: [
			{ name: "vin", type: "source" },
			{ name: "vout", type: "internal" },
			{ name: "gnd", type: "ground" }
		],
		components: [
			["vin", "vout", "R", 1000.0],
			["vout", "gnd", "C", 1e-6]
		],
		input_signal: [],
		time_vector: [],
		input_steps: 10,
		predict_steps: 10
	});

	// JSON editor state
	let jsonEditorText = $state('');
	let isJsonValid = $state(true);
	let jsonError = $state('');

	onMount(async () => {
		await checkAPIStatus();
	});

	async function checkAPIStatus() {
		try {
			const health = await aiSimulator.healthCheck();
			const info = await aiSimulator.getModelInfo();
			
			modelInfo = info;
			apiStatus = aiSimulator.isSimulation() ? 'simulation' : 'available';
			
			if (apiStatus === 'simulation') {
				success = 'Using AI simulation mode (real API not available)';
			} else {
				success = 'Connected to real AI inference API';
			}
		} catch (err: any) {
			error = `Failed to check API status: ${err.message}`;
			apiStatus = 'simulation';
		}
	}

	// D3 Visualization Functions
	function createTimeSeriesChart(data: PredictionResponse, container: HTMLDivElement) {
		// Clear previous chart
		d3.select(container).selectAll("*").remove();
		
		if (!data || !data.predictions.length) return;

		const margin = { top: 20, right: 30, bottom: 40, left: 60 };
		const width = container.clientWidth - margin.left - margin.right;
		const height = 300 - margin.top - margin.bottom;

		const svg = d3.select(container)
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// Create time scale
		const timeScale = d3.scaleLinear()
			.domain([0, data.predictions[0].length - 1])
			.range([0, width]);

		// Create voltage scale
		const allValues = data.predictions.flat();
		const voltageScale = d3.scaleLinear()
			.domain([d3.min(allValues) || 0, d3.max(allValues) || 5])
			.range([height, 0]);

		// Color scale for different nodes
		const colorScale = d3.scaleOrdinal()
			.domain(data.node_names)
			.range(d3.schemeCategory10);

		// Add X axis
		svg.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(timeScale).ticks(10))
			.append("text")
			.attr("x", width / 2)
			.attr("y", 35)
			.attr("text-anchor", "middle")
			.text("Time Steps");

		// Add Y axis
		svg.append("g")
			.call(d3.axisLeft(voltageScale).ticks(5))
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -45)
			.attr("x", -height / 2)
			.attr("text-anchor", "middle")
			.text("Voltage (V)");

		// Create line generator
		const line = d3.line<number>()
			.x((d, i) => timeScale(i))
			.y(d => voltageScale(d))
			.curve(d3.curveMonotoneX);

		// Add lines for each node
		data.node_names.forEach((nodeName, i) => {
			svg.append("path")
				.datum(data.predictions[i])
				.attr("fill", "none")
				.attr("stroke", colorScale(nodeName) as string)
				.attr("stroke-width", 2)
				.attr("d", line as any);

			// Add dots for data points
			svg.selectAll(`.dot-${i}`)
				.data(data.predictions[i])
				.enter()
				.append("circle")
				.attr("class", `dot-${i}`)
				.attr("cx", (d, i) => timeScale(i))
				.attr("cy", d => voltageScale(d))
				.attr("r", 3)
				.attr("fill", colorScale(nodeName) as string)
				.attr("opacity", 0.7);
		});

		// Add legend
		const legend = svg.append("g")
			.attr("class", "legend")
			.attr("transform", `translate(${width - 100}, 10)`);

		data.node_names.forEach((nodeName, i) => {
			const legendRow = legend.append("g")
				.attr("transform", `translate(0, ${i * 20})`);

			legendRow.append("rect")
				.attr("width", 15)
				.attr("height", 15)
				.attr("fill", colorScale(nodeName) as string);

			legendRow.append("text")
				.attr("x", 20)
				.attr("y", 12)
				.attr("text-anchor", "start")
				.style("font-size", "12px")
				.text(nodeName);
		});
	}

	function createCircuitDiagram(data: PredictionResponse, container: HTMLDivElement) {
		// Clear previous diagram
		d3.select(container).selectAll("*").remove();
		
		if (!data || !data.node_names.length) return;

		const width = container.clientWidth;
		const height = 200;
		const nodeRadius = 25;

		const svg = d3.select(container)
			.append("svg")
			.attr("width", width)
			.attr("height", height);

		// Create node positions in a circular layout
		const nodePositions = data.node_names.map((name, i) => {
			const angle = (i / data.node_names.length) * 2 * Math.PI - Math.PI / 2;
			const radius = Math.min(width, height) / 3;
			return {
				name,
				x: width / 2 + radius * Math.cos(angle),
				y: height / 2 + radius * Math.sin(angle)
			};
		});

		// Color scale for nodes
		const colorScale = d3.scaleOrdinal()
			.domain(data.node_names)
			.range(d3.schemeCategory10);

		// Add connections between nodes
		nodePositions.forEach((node, i) => {
			const nextNode = nodePositions[(i + 1) % nodePositions.length];
			
			svg.append("line")
				.attr("x1", node.x)
				.attr("y1", node.y)
				.attr("x2", nextNode.x)
				.attr("y2", nextNode.y)
				.attr("stroke", "#64748b")
				.attr("stroke-width", 2)
				.attr("opacity", 0.6);
		});

		// Add nodes
		const nodes = svg.selectAll(".node")
			.data(nodePositions)
			.enter()
			.append("g")
			.attr("class", "node");

		nodes.append("circle")
			.attr("cx", d => d.x)
			.attr("cy", d => d.y)
			.attr("r", nodeRadius)
			.attr("fill", d => colorScale(d.name) as string)
			.attr("stroke", "#374151")
			.attr("stroke-width", 2);

		nodes.append("text")
			.attr("x", d => d.x)
			.attr("y", d => d.y)
			.attr("text-anchor", "middle")
			.attr("dy", "0.35em")
			.style("font-size", "12px")
			.style("font-weight", "bold")
			.style("fill", "white")
			.text(d => d.name);

		// Add current values as small text below nodes
		nodes.append("text")
			.attr("x", d => d.x)
			.attr("y", d => d.y + nodeRadius + 15)
			.attr("text-anchor", "middle")
			.style("font-size", "10px")
			.style("fill", "#6b7280")
			.text(d => {
				const nodeIndex = data.node_names.indexOf(d.name);
				const currentValue = data.predictions[nodeIndex]?.[data.predictions[nodeIndex].length - 1];
				return currentValue ? `${currentValue.toFixed(2)}V` : '';
			});
	}

	function createInputSignalChart(inputSignal: number[], container: HTMLDivElement) {
		// Clear previous chart
		d3.select(container).selectAll("*").remove();
		
		if (!inputSignal.length) return;

		const margin = { top: 20, right: 30, bottom: 40, left: 60 };
		const width = container.clientWidth - margin.left - margin.right;
		const height = 200 - margin.top - margin.bottom;

		const svg = d3.select(container)
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// Create scales
		const xScale = d3.scaleLinear()
			.domain([0, inputSignal.length - 1])
			.range([0, width]);

		const yScale = d3.scaleLinear()
			.domain([d3.min(inputSignal) || 0, d3.max(inputSignal) || 5])
			.range([height, 0]);

		// Add X axis
		svg.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(xScale).ticks(10))
			.append("text")
			.attr("x", width / 2)
			.attr("y", 35)
			.attr("text-anchor", "middle")
			.text("Time Steps");

		// Add Y axis
		svg.append("g")
			.call(d3.axisLeft(yScale).ticks(5))
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -45)
			.attr("x", -height / 2)
			.attr("text-anchor", "middle")
			.text("Input Voltage (V)");

		// Create line generator
		const line = d3.line<number>()
			.x((d, i) => xScale(i))
			.y(d => yScale(d))
			.curve(d3.curveStepAfter);

		// Add the line
		svg.append("path")
			.datum(inputSignal)
			.attr("fill", "none")
			.attr("stroke", "#3b82f6")
			.attr("stroke-width", 3)
			.attr("d", line);

		// Add dots for data points
		svg.selectAll(".dot")
			.data(inputSignal)
			.enter()
			.append("circle")
			.attr("class", "dot")
			.attr("cx", (d, i) => xScale(i))
			.attr("cy", d => yScale(d))
			.attr("r", 4)
			.attr("fill", "#3b82f6")
			.attr("opacity", 0.8);
	}

	// Update visualizations when prediction data changes
	$effect(() => {
		if (currentPrediction && timeChartContainer) {
			createTimeSeriesChart(currentPrediction, timeChartContainer);
		}
		if (currentPrediction && circuitDiagramContainer) {
			createCircuitDiagram(currentPrediction, circuitDiagramContainer);
		}
		if (customCircuitData.input_signal.length > 0 && chartContainer) {
			createInputSignalChart(customCircuitData.input_signal, chartContainer);
		}
	});

	async function testRCCircuit() {
		isProcessing = true;
		error = '';
		success = '';
		currentPrediction = null;

		try {
			const result = await aiSimulator.testRCCircuit();
			currentPrediction = result;
			
			if (result.success) {
				success = `RC Circuit prediction successful! Inference time: ${result.inference_time.toFixed(3)}s`;
			} else {
				error = result.error_message || 'RC Circuit prediction failed';
			}
		} catch (err: any) {
			error = `RC Circuit test failed: ${err.message}`;
		} finally {
			isProcessing = false;
		}
	}

	async function testRLCircuit() {
		isProcessing = true;
		error = '';
		success = '';
		currentPrediction = null;

		try {
			const result = await aiSimulator.testRLCircuit();
			currentPrediction = result;
			
			if (result.success) {
				success = `RL Circuit prediction successful! Inference time: ${result.inference_time.toFixed(3)}s`;
			} else {
				error = result.error_message || 'RL Circuit prediction failed';
			}
		} catch (err: any) {
			error = `RL Circuit test failed: ${err.message}`;
		} finally {
			isProcessing = false;
		}
	}

	async function testAmplifierCircuit() {
		isProcessing = true;
		error = '';
		success = '';
		currentPrediction = null;

		try {
			const result = await aiSimulator.testAmplifierCircuit();
			currentPrediction = result;
			
			if (result.success) {
				success = `Amplifier Circuit prediction successful! Inference time: ${result.inference_time.toFixed(3)}s`;
			} else {
				error = result.error_message || 'Amplifier Circuit prediction failed';
			}
		} catch (err: any) {
			error = `Amplifier Circuit test failed: ${err.message}`;
		} finally {
			isProcessing = false;
		}
	}

	async function testCustomCircuit() {
		isProcessing = true;
		error = '';
		success = '';
		currentPrediction = null;

		try {
			const result = await aiSimulator.predictCustom(customCircuitData);
			currentPrediction = result;
			
			if (result.success) {
				success = `Custom Circuit prediction successful! Inference time: ${result.inference_time.toFixed(3)}s`;
			} else {
				error = result.error_message || 'Custom Circuit prediction failed';
			}
		} catch (err: any) {
			error = `Custom Circuit test failed: ${err.message}`;
		} finally {
			isProcessing = false;
		}
	}

	function updateCustomCircuit() {
		// Generate input signal and time vector for custom circuit
		customCircuitData.input_signal = aiSimulator.generateStepSignal(20, 5);
		customCircuitData.time_vector = aiSimulator.generateTimeVector(20, 0.002);
	}

	function toggleVisualization() {
		isVisualizationExpanded = !isVisualizationExpanded;
	}

	// JSON Editor Functions
	function updateJsonEditor() {
		jsonEditorText = JSON.stringify(customCircuitData, null, 2);
	}

	function validateAndUpdateJson() {
		try {
			const parsed = JSON.parse(jsonEditorText);
			
			// Validate required fields
			if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
				throw new Error('Missing or invalid "nodes" array');
			}
			if (!parsed.components || !Array.isArray(parsed.components)) {
				throw new Error('Missing or invalid "components" array');
			}
			if (!parsed.input_signal || !Array.isArray(parsed.input_signal)) {
				throw new Error('Missing or invalid "input_signal" array');
			}
			if (!parsed.time_vector || !Array.isArray(parsed.time_vector)) {
				throw new Error('Missing or invalid "time_vector" array');
			}
			if (typeof parsed.input_steps !== 'number') {
				throw new Error('Missing or invalid "input_steps" number');
			}
			if (typeof parsed.predict_steps !== 'number') {
				throw new Error('Missing or invalid "predict_steps" number');
			}

			// Validate node structure
			parsed.nodes.forEach((node: any, index: number) => {
				if (!node.name || !node.type) {
					throw new Error(`Invalid node at index ${index}: missing name or type`);
				}
				if (!['source', 'internal', 'ground'].includes(node.type)) {
					throw new Error(`Invalid node type "${node.type}" at index ${index}`);
				}
			});

			// Validate component structure
			parsed.components.forEach((comp: any, index: number) => {
				if (!Array.isArray(comp) || comp.length !== 4) {
					throw new Error(`Invalid component at index ${index}: must be array of 4 elements`);
				}
				if (!['R', 'L', 'C'].includes(comp[2])) {
					throw new Error(`Invalid component type "${comp[2]}" at index ${index}`);
				}
				if (typeof comp[3] !== 'number') {
					throw new Error(`Invalid component value at index ${index}`);
				}
			});

			// Update the circuit data
			customCircuitData = parsed;
			isJsonValid = true;
			jsonError = '';
			success = 'JSON circuit data updated successfully!';
			
		} catch (err: any) {
			isJsonValid = false;
			jsonError = err.message;
			error = `Invalid JSON: ${err.message}`;
		}
	}

	function loadExampleCircuit(type: 'rc' | 'rl' | 'amplifier' | 'complex') {
		let exampleData: CircuitData;
		
		switch (type) {
			case 'rc':
				exampleData = {
					nodes: [
						{ name: "vin", type: "source" },
						{ name: "vout", type: "internal" },
						{ name: "gnd", type: "ground" }
					],
					components: [
						["vin", "vout", "R", 1000.0],
						["vout", "gnd", "C", 1e-6]
					],
					input_signal: aiSimulator.generateStepSignal(20, 5),
					time_vector: aiSimulator.generateTimeVector(20, 0.002),
					input_steps: 10,
					predict_steps: 10
				};
				break;
				
			case 'rl':
				exampleData = {
					nodes: [
						{ name: "vin", type: "source" },
						{ name: "vout", type: "internal" },
						{ name: "gnd", type: "ground" }
					],
					components: [
						["vin", "vout", "R", 100.0],
						["vout", "gnd", "L", 1e-3]
					],
					input_signal: aiSimulator.generateStepSignal(20, 5),
					time_vector: aiSimulator.generateTimeVector(20, 0.002),
					input_steps: 10,
					predict_steps: 10
				};
				break;
				
			case 'amplifier':
				exampleData = {
					nodes: [
						{ name: "vin", type: "source" },
						{ name: "v1", type: "internal" },
						{ name: "vout", type: "internal" },
						{ name: "gnd", type: "ground" }
					],
					components: [
						["vin", "v1", "R", 1000.0],
						["v1", "vout", "R", 5000.0],
						["vout", "gnd", "R", 1000.0]
					],
					input_signal: aiSimulator.generateStepSignal(20, 5),
					time_vector: aiSimulator.generateTimeVector(20, 0.002),
					input_steps: 10,
					predict_steps: 10
				};
				break;
				
			case 'complex':
				exampleData = {
					nodes: [
						{ name: "vin", type: "source" },
						{ name: "v1", type: "internal" },
						{ name: "v2", type: "internal" },
						{ name: "vout", type: "internal" },
						{ name: "gnd", type: "ground" }
					],
					components: [
						["vin", "v1", "R", 1000.0],
						["v1", "v2", "C", 1e-6],
						["v2", "vout", "R", 2000.0],
						["vout", "gnd", "L", 1e-3]
					],
					input_signal: aiSimulator.generateStepSignal(25, 3),
					time_vector: aiSimulator.generateTimeVector(25, 0.005),
					input_steps: 15,
					predict_steps: 10
				};
				break;
		}
		
		customCircuitData = exampleData;
		jsonEditorText = JSON.stringify(exampleData, null, 2);
		isJsonValid = true;
		jsonError = '';
		success = `Loaded ${type.toUpperCase()} circuit example!`;
	}

	// Initialize custom circuit data and JSON editor
	updateCustomCircuit();
	updateJsonEditor();
</script>

<svelte:head>
	<title>AI Circuit Simulator - Saffron</title>
	<meta name="description" content="Test and demonstrate AI circuit inference capabilities with D3 visualization" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-background to-muted/20">
	<div class="container mx-auto px-4 py-8 max-w-7xl">
		<!-- Header Section -->
		<div class="text-center mb-12">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
				<CircuitBoard class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-5xl font-bold text-foreground mb-4 tracking-tight">AI Circuit Simulator</h1>
			<p class="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
				Test and demonstrate AI-powered circuit inference capabilities with real-time D3 visualization
			</p>
		</div>

		<!-- API Status -->
		{#if apiStatus === 'simulation'}
			<Card class="mb-8 border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
				<CardContent class="flex items-center gap-3 p-6">
					<div class="flex-shrink-0">
						<Settings class="h-6 w-6 text-blue-600" />
					</div>
					<div>
						<p class="text-blue-700 dark:text-blue-300 font-medium">
							Running in Simulation Mode
						</p>
						<p class="text-sm text-blue-600 dark:text-blue-400">
							Real API not available, using AI simulation for testing
						</p>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Status Messages -->
		{#if error}
			<Card class="mb-8 border-destructive/50 bg-destructive/5">
				<CardContent class="flex items-center gap-3 p-6">
					<div class="flex-shrink-0">
						<AlertCircle class="h-6 w-6 text-destructive" />
					</div>
					<p class="text-destructive font-medium">{error}</p>
				</CardContent>
			</Card>
		{/if}

		{#if success}
			<Card class="mb-8 border-green-500/50 bg-green-50 dark:bg-green-950/20">
				<CardContent class="flex items-center gap-3 p-6">
					<div class="flex-shrink-0">
						<CheckCircle class="h-6 w-6 text-green-600" />
					</div>
					<p class="text-green-600 font-medium">{success}</p>
				</CardContent>
			</Card>
		{/if}

		<!-- Model Information -->
		{#if modelInfo}
			<Card class="mb-8 shadow-lg border-0 bg-card/50 backdrop-blur-sm">
				<CardHeader class="pb-6">
					<CardTitle class="flex items-center gap-3 text-2xl">
						<div class="p-2 rounded-lg bg-primary/10">
							<Activity class="h-6 w-6 text-primary" />
						</div>
						Model Information
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
						<div class="p-4 bg-muted/30 rounded-lg">
							<div class="text-sm font-medium text-muted-foreground">Parameters</div>
							<div class="text-2xl font-bold text-primary">{modelInfo.parameters.toLocaleString()}</div>
						</div>
						<div class="p-4 bg-muted/30 rounded-lg">
							<div class="text-sm font-medium text-muted-foreground">Device</div>
							<div class="text-2xl font-bold text-primary">{modelInfo.device.toUpperCase()}</div>
						</div>
						<div class="p-4 bg-muted/30 rounded-lg">
							<div class="text-sm font-medium text-muted-foreground">Features</div>
							<div class="text-lg font-semibold">
								Node: {modelInfo.config.node_features}, Edge: {modelInfo.config.edge_features}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Main Content Grid -->
		<div class="grid gap-8 lg:grid-cols-2 xl:gap-12">
			<!-- Circuit Selection -->
			<div class="space-y-8">
				<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
					<CardHeader class="pb-6">
						<CardTitle class="flex items-center gap-3 text-2xl">
							<div class="p-2 rounded-lg bg-primary/10">
								<Zap class="h-6 w-6 text-primary" />
							</div>
							Circuit Tests
						</CardTitle>
						<CardDescription class="text-base">
							Select a circuit type to test AI inference capabilities
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<!-- Circuit Type Selection -->
						<div class="grid grid-cols-2 gap-4">
							<Button 
								variant={selectedCircuit === 'rc' ? 'default' : 'outline'}
								onclick={() => selectedCircuit = 'rc'}
								class="h-24 flex-col gap-2"
								disabled={isProcessing}
							>
								<div class="p-2 rounded-full bg-primary/10">
									<Zap class="h-5 w-5 text-primary" />
								</div>
								<span class="font-medium">RC Circuit</span>
								<span class="text-xs text-muted-foreground">Resistor + Capacitor</span>
							</Button>
							
							<Button 
								variant={selectedCircuit === 'rl' ? 'default' : 'outline'}
								onclick={() => selectedCircuit = 'rl'}
								class="h-24 flex-col gap-2"
								disabled={isProcessing}
							>
								<div class="p-2 rounded-full bg-primary/10">
									<Zap class="h-5 w-5 text-primary" />
								</div>
								<span class="font-medium">RL Circuit</span>
								<span class="text-xs text-muted-foreground">Resistor + Inductor</span>
							</Button>
							
							<Button 
								variant={selectedCircuit === 'amplifier' ? 'default' : 'outline'}
								onclick={() => selectedCircuit = 'amplifier'}
								class="h-24 flex-col gap-2"
								disabled={isProcessing}
							>
								<div class="p-2 rounded-full bg-primary/10">
									<TrendingUp class="h-5 w-5 text-primary" />
								</div>
								<span class="font-medium">Amplifier</span>
								<span class="text-xs text-muted-foreground">Resistive Divider</span>
							</Button>
							
							<Button 
								variant={selectedCircuit === 'custom' ? 'default' : 'outline'}
								onclick={() => selectedCircuit = 'custom'}
								class="h-24 flex-col gap-2"
								disabled={isProcessing}
							>
								<div class="p-2 rounded-full bg-primary/10">
									<Settings class="h-5 w-5 text-primary" />
								</div>
								<span class="font-medium">Custom</span>
								<span class="text-xs text-muted-foreground">Custom Circuit</span>
							</Button>
						</div>

						<Separator />

						<!-- Test Button -->
						<Button 
							onclick={() => {
								switch (selectedCircuit) {
									case 'rc':
										testRCCircuit();
										break;
									case 'rl':
										testRLCircuit();
										break;
									case 'amplifier':
										testAmplifierCircuit();
										break;
									case 'custom':
										testCustomCircuit();
										break;
								}
							}}
							disabled={isProcessing}
							class="w-full h-12"
							size="lg"
						>
							{#if isProcessing}
								<Loader2 class="h-5 w-5 mr-3 animate-spin" />
								Processing...
							{:else}
								<Play class="h-5 w-5 mr-3" />
								Test {selectedCircuit.toUpperCase()} Circuit
							{/if}
						</Button>

						<!-- Custom Circuit Configuration -->
						{#if selectedCircuit === 'custom'}
							<div class="space-y-6 p-4 bg-muted/30 rounded-lg">
								<div class="flex items-center justify-between">
									<h4 class="font-medium">Custom Circuit Configuration</h4>
									<Badge variant={isJsonValid ? "secondary" : "destructive"}>
										{isJsonValid ? "Valid JSON" : "Invalid JSON"}
									</Badge>
								</div>

								<!-- Example Circuits -->
								<div class="space-y-3">
									<h5 class="text-sm font-medium text-muted-foreground">Load Example Circuits</h5>
									<div class="grid grid-cols-2 gap-2">
										<Button 
											variant="outline" 
											size="sm"
											onclick={() => loadExampleCircuit('rc')}
											class="text-xs"
										>
											RC Circuit
										</Button>
										<Button 
											variant="outline" 
											size="sm"
											onclick={() => loadExampleCircuit('rl')}
											class="text-xs"
										>
											RL Circuit
										</Button>
										<Button 
											variant="outline" 
											size="sm"
											onclick={() => loadExampleCircuit('amplifier')}
											class="text-xs"
										>
											Amplifier
										</Button>
										<Button 
											variant="outline" 
											size="sm"
											onclick={() => loadExampleCircuit('complex')}
											class="text-xs"
										>
											Complex
										</Button>
									</div>
								</div>

								<!-- JSON Editor -->
								<div class="space-y-3">
									<div class="flex items-center justify-between">
										<h5 class="text-sm font-medium text-muted-foreground">Edit Circuit JSON</h5>
										<Button 
											variant="outline" 
											size="sm"
											onclick={updateJsonEditor}
											class="text-xs"
										>
											Refresh from Form
										</Button>
									</div>
									
									<div class="relative">
										<textarea
											bind:value={jsonEditorText}
											class="w-full h-64 p-3 font-mono text-xs border rounded-md resize-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 {!isJsonValid ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-muted-foreground/25'}"
											placeholder="Enter circuit JSON data..."
											oninput={() => {
												// Clear validation on input
												if (!isJsonValid) {
													isJsonValid = true;
													jsonError = '';
												}
											}}
										></textarea>
										
										{#if jsonError}
											<div class="absolute bottom-2 left-2 right-2 p-2 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded text-xs text-red-700 dark:text-red-300">
												<strong>Error:</strong> {jsonError}
											</div>
										{/if}
									</div>

									<div class="flex gap-2">
										<Button 
											variant="outline" 
											onclick={validateAndUpdateJson}
											class="flex-1"
											disabled={!jsonEditorText.trim()}
										>
											Validate & Apply JSON
										</Button>
										<Button 
											variant="outline" 
											onclick={updateCustomCircuit}
											class="flex-1"
										>
											Generate Signals
										</Button>
									</div>
								</div>

								<!-- Quick Configuration -->
								<div class="space-y-3">
									<h5 class="text-sm font-medium text-muted-foreground">Quick Configuration</h5>
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											<label class="text-sm font-medium">Input Steps</label>
											<input 
												type="number" 
												bind:value={customCircuitData.input_steps}
												class="w-full p-2 border rounded-md"
												min="1"
												max="50"
											/>
										</div>
										<div>
											<label class="text-sm font-medium">Predict Steps</label>
											<input 
												type="number" 
												bind:value={customCircuitData.predict_steps}
												class="w-full p-2 border rounded-md"
												min="1"
												max="50"
											/>
										</div>
									</div>
								</div>
							</div>
						{/if}

						<!-- JSON Schema Documentation -->
						{#if selectedCircuit === 'custom'}
							<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
								<CardHeader class="pb-4">
									<CardTitle class="flex items-center gap-3 text-lg">
										<div class="p-2 rounded-lg bg-blue-500/10">
											<FileText class="h-5 w-5 text-blue-600" />
										</div>
										JSON Schema Documentation
									</CardTitle>
									<CardDescription class="text-sm">
										Circuit data structure and validation rules
									</CardDescription>
								</CardHeader>
								<CardContent class="space-y-4">
									<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
										<!-- Schema Structure -->
										<div class="space-y-3">
											<h4 class="font-medium text-sm">Circuit Data Structure</h4>
											<div class="text-xs space-y-2 text-muted-foreground">
												<div class="p-2 bg-muted/30 rounded">
													<strong>nodes:</strong> Array of circuit nodes
													<ul class="ml-4 mt-1 space-y-1">
														<li>• <code>name:</code> string (node identifier)</li>
														<li>• <code>type:</code> "source" | "internal" | "ground"</li>
													</ul>
												</div>
												<div class="p-2 bg-muted/30 rounded">
													<strong>components:</strong> Array of [from, to, type, value]
													<ul class="ml-4 mt-1 space-y-1">
														<li>• <code>from:</code> string (source node)</li>
														<li>• <code>to:</code> string (target node)</li>
														<li>• <code>type:</code> "R" | "L" | "C"</li>
														<li>• <code>value:</code> number (component value)</li>
													</ul>
												</div>
												<div class="p-2 bg-muted/30 rounded">
													<strong>input_signal:</strong> Array of numbers (voltage values)
												</div>
												<div class="p-2 bg-muted/30 rounded">
													<strong>time_vector:</strong> Array of numbers (time points)
												</div>
												<div class="p-2 bg-muted/30 rounded">
													<strong>input_steps:</strong> number (input signal length)
												</div>
												<div class="p-2 bg-muted/30 rounded">
													<strong>predict_steps:</strong> number (prediction length)
												</div>
											</div>
										</div>

										<!-- Example JSON -->
										<div class="space-y-3">
											<h4 class="font-medium text-sm">Example JSON</h4>
											<pre class="text-xs bg-muted/30 p-3 rounded overflow-x-auto text-muted-foreground">
{`{
  "nodes": [
    {"name": "vin", "type": "source"},
    {"name": "vout", "type": "internal"},
    {"name": "gnd", "type": "ground"}
  ],
  "components": [
    ["vin", "vout", "R", 1000.0],
    ["vout", "gnd", "C", 1e-6]
  ],
  "input_signal": [0, 0, 0, 5, 5, 5, ...],
  "time_vector": [0, 0.0001, 0.0002, ...],
  "input_steps": 10,
  "predict_steps": 10
}`}
											</pre>
										</div>
									</div>

									<!-- Validation Rules -->
									<div class="space-y-3">
										<h4 class="font-medium text-sm">Validation Rules</h4>
										<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
											<div class="space-y-2">
												<div class="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
													<strong class="text-green-700 dark:text-green-300">✓ Required Fields</strong>
													<ul class="mt-1 space-y-1">
														<li>• All fields must be present</li>
														<li>• Arrays must not be empty</li>
														<li>• Numbers must be positive</li>
													</ul>
												</div>
											</div>
											<div class="space-y-2">
												<div class="p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
													<strong class="text-amber-700 dark:text-amber-300">⚠ Node Types</strong>
													<ul class="mt-1 space-y-1">
														<li>• Must have exactly one "source"</li>
														<li>• Must have exactly one "ground"</li>
														<li>• Internal nodes are optional</li>
													</ul>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						{/if}
					</CardContent>
				</Card>

				<!-- Input Signal Visualization -->
				{#if customCircuitData.input_signal.length > 0}
					<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
						<CardHeader class="pb-6">
							<CardTitle class="flex items-center gap-3 text-xl">
								<div class="p-2 rounded-lg bg-blue-500/10">
									<TrendingUp class="h-5 w-5 text-blue-600" />
								</div>
								Input Signal
							</CardTitle>
							<CardDescription class="text-sm">
								Step signal input waveform
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div bind:this={chartContainer} class="w-full h-64"></div>
						</CardContent>
					</Card>
				{/if}
			</div>

			<!-- Results Section -->
			<div class="space-y-8">
				{#if currentPrediction}
					<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
						<CardHeader class="pb-6">
							<CardTitle class="flex items-center gap-3 text-2xl">
								<div class="p-2 rounded-lg bg-green-500/10">
									<TrendingUp class="h-6 w-6 text-green-600" />
								</div>
								Prediction Results
							</CardTitle>
							<CardDescription class="text-base">
								AI-generated circuit predictions and analysis
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-6">
							<!-- Prediction Summary -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-sm font-medium text-muted-foreground">Inference Time</div>
									<div class="text-lg font-semibold">{currentPrediction.inference_time.toFixed(3)}s</div>
								</div>
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-sm font-medium text-muted-foreground">Nodes</div>
									<div class="text-lg font-semibold">{currentPrediction.node_names.length}</div>
								</div>
								<div class="p-3 bg-muted/30 rounded-lg">
									<div class="text-sm font-medium text-muted-foreground">Timesteps</div>
									<div class="text-lg font-semibold">{currentPrediction.predictions[0]?.length || 0}</div>
								</div>
							</div>

							<!-- Circuit Diagram -->
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<h4 class="font-medium">Circuit Diagram</h4>
									<Badge variant="secondary">Interactive</Badge>
								</div>
								<div bind:this={circuitDiagramContainer} class="w-full h-64 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25"></div>
							</div>

							<!-- Time Series Visualization -->
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<h4 class="font-medium">Time Series Analysis</h4>
									<Button 
										variant="outline" 
										size="sm"
										onclick={toggleVisualization}
										class="flex items-center gap-2"
									>
										{#if isVisualizationExpanded}
											<Minimize2 class="h-4 w-4" />
											Collapse
										{:else}
											<Maximize2 class="h-4 w-4" />
											Expand
										{/if}
									</Button>
								</div>
								<div 
									bind:this={timeChartContainer} 
									class="w-full transition-all duration-300 {isVisualizationExpanded ? 'h-96' : 'h-64'} bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25"
								></div>
							</div>

							<!-- Node Names -->
							<div class="space-y-3">
								<h4 class="font-medium">Circuit Nodes</h4>
								<div class="flex flex-wrap gap-2">
									{#each currentPrediction.node_names as nodeName}
										<Badge variant="secondary">{nodeName}</Badge>
									{/each}
								</div>
							</div>

							<!-- Prediction Data -->
							<div class="space-y-4">
								<h4 class="font-medium">Prediction Values (First 10 timesteps)</h4>
								<div class="space-y-3">
									{#each currentPrediction.node_names as nodeName, i}
										<div class="p-3 bg-muted/30 rounded-lg">
											<div class="flex items-center justify-between mb-2">
												<span class="font-medium">{nodeName}</span>
												<Badge variant="outline">
													{currentPrediction.predictions[i]?.length || 0} values
												</Badge>
											</div>
											<div class="text-sm text-muted-foreground font-mono">
												[{currentPrediction.predictions[i]?.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]
											</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Denormalized Data -->
							<div class="space-y-4">
								<h4 class="font-medium">Denormalized Predictions</h4>
								<div class="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
									<p class="text-sm text-blue-600 dark:text-blue-400">
										Predictions have been denormalized to match the input signal range for realistic circuit behavior simulation.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				{:else}
					<Card class="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
						<CardContent class="p-12 text-center">
							<div class="space-y-4">
								<div class="p-4 rounded-full bg-muted/50 w-fit mx-auto">
									<TrendingUp class="h-12 w-12 text-muted-foreground/50" />
								</div>
								<div class="space-y-2">
									<p class="text-lg font-medium text-muted-foreground">No predictions yet</p>
									<p class="text-sm text-muted-foreground/75">
										Select a circuit type and run a test to see AI predictions with D3 visualization
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Enhanced responsive behavior and animations */
	@media (max-width: 768px) {
		.container {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}

	/* Smooth animations for state changes */
	.grid {
		transition: all 0.3s ease;
	}

	/* Button hover effects */
	button {
		transition: all 0.2s ease;
	}

	/* Card hover effects */
	.card {
		transition: all 0.3s ease;
	}

	/* Badge animations */
	.badge {
		transition: all 0.2s ease;
	}

	/* D3 chart styling */
	:global(.d3-tip) {
		line-height: 1;
		font-weight: bold;
		padding: 12px;
		background: rgba(0, 0, 0, 0.8);
		color: #fff;
		border-radius: 2px;
		pointer-events: none;
	}

	/* SVG styling */
	:global(svg) {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}

	/* Chart container styling */
	:global(.chart-container) {
		background: transparent;
		border-radius: 8px;
		overflow: hidden;
	}
</style> 