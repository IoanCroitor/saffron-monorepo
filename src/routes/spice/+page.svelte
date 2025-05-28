<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import SpiceEditor from './components/SpiceEditor.svelte';
	import PlotCanvas from './components/PlotCanvas.svelte';
	import D3PlotCanvas from './components/D3PlotCanvas.svelte';
	import DisplayBox from './components/DisplayBox.svelte';
	import DownloadCSV from './components/DownloadCSV.svelte';
	import { SimArray, type ResultArrayType } from './lib/simulationArray';
	import type { DisplayDataType } from './lib/displayData';
	import { makeDD } from './lib/displayData';
	import { getParser } from './lib/parserDC';
const examples = [
	{
		name: 'Fast Series RLC Resonant Circuit',
		category: 'Basic Circuits',
		description: 'High-speed RLC resonant circuit with picosecond timing',
		value: 'fast-series-rlc',
		code: `FAST SERIES RLC RESONANT CIRCUIT
r1 vin n1 1
l1 n1 n2 1u
c1 n2 0 1n
vin vin 0 pulse(0 1 0 1p 1p 10p 20p)
.tran 1p 100p
.end`
	},
	{
		name: 'Fast Parallel RLC Tank',
		category: 'Basic Circuits',
		description: 'Parallel RLC tank circuit with current source',
		value: 'fast-parallel-rlc',
		code: `FAST PARALLEL RLC TANK
i1 0 tank 0 pulse(0 1m 0 1p 1p 5p 10p) ; Changed DC value from 1m to 0
r1 tank 0 100
l1 tank 0 100n
c1 tank 0 1p
.tran 0.1p 50p
.end`
	},
	{
		name: 'Fast RC Filter',
		category: 'Filters',
		description: 'Simple RC low-pass filter with fast response',
		value: 'fast-rc-filter',
		code: `FAST RC FILTER
vin vin 0 pulse(0 1 0 1p 1p 5p 10p)
r1 vin out 1k
c1 out 0 1p
.tran 0.1p 30p
.end`
	},
	{
		name: 'Fast LC Oscillator',
		category: 'Oscillators',
		description: 'LC oscillator using CMOS transistors',
		value: 'fast-lc-oscillator',
		code: `FAST LC OSCILLATOR
.include modelcard.CMOS90
m1 vdd gate out out P90 W=10u L=0.09u
m2 out gate 0 0 N90 W=5u L=0.09u
l1 out fb 10n
c1 fb 0 0.1p
r1 vdd gate 10k
vdd vdd 0 1.8
.tran 0.1p 20p uic ; Added uic for potentially better oscillator startup
.end`
	},
	{
		name: 'Fast Inverter Chain',
		category: 'Digital Circuits',
		description: 'CMOS inverter chain with timing analysis',
		value: 'fast-inverter-chain',
		code: `FAST INVERTER CHAIN
.include modelcard.CMOS90
m1 vdd in out1 out1 P90 W=4u L=0.09u
m2 out1 in 0 0 N90 W=2u L=0.09u
m3 vdd out1 out2 out2 P90 W=8u L=0.09u
m4 out2 out1 0 0 N90 W=4u L=0.09u
c1 out1 0 0.1f
c2 out2 0 0.2f
vin in 0 pulse(0 1.8 0 0.1p 0.1p 2p 4p)
vdd vdd 0 1.8
.tran 0.01p 10p
.end`
	},
	{
		name: 'Fast RLC Damped Oscillation',
		category: 'Basic Circuits',
		description: 'RLC circuit showing damped oscillation behavior',
		value: 'fast-rlc-damped',
		code: `FAST RLC DAMPED OSCILLATION
r1 n1 n2 10
l1 n2 n3 100n
c1 n3 0 10f
i1 0 n1 0 pulse(0 1m 0 0.1p 0.1p 1p 20p) ; Changed DC value from 1m to 0
.tran 0.01p 15p
.end`
	},
	{
		name: 'Fast Transmission Line',
		category: 'Transmission Lines',
		description: 'Transmission line with matched impedances',
		value: 'fast-transmission-line',
		code: `FAST TRANSMISSION LINE
t1 in 0 out 0 z0=50 td=1p
r1 in 0 50
r2 out 0 50
vin in 0 pulse(0 1 0 0.1p 0.1p 2p 4p)
.tran 0.01p 12p
.end`
	},
	{
		name: 'Fast Crystal Model',
		category: 'Resonators',
		description: 'Crystal oscillator equivalent circuit model',
		value: 'fast-crystal-model',
		code: `FAST CRYSTAL MODEL
l1 in n1 1u
c1 n1 n2 1f
r1 n2 out 1
c2 in out 10f
vin in 0 sin(0 0.1 1g 0 0) ; Added phase and phi for clarity, default is 0
.tran 0.01p 10p
.end`
	},
	{
		name: 'Fast CMOS Ring Oscillator',
		category: 'Oscillators',
		description: 'Three-stage CMOS ring oscillator',
		value: 'fast-cmos-ring',
		code: `FAST CMOS RING OSC
.include modelcard.CMOS90
m1 vdd a b b P90 W=2u L=0.09u
m2 b a 0 0 N90 W=1u L=0.09u
m3 vdd b c c P90 W=2u L=0.09u
m4 c b 0 0 N90 W=1u L=0.09u
m5 vdd c a a P90 W=2u L=0.09u
m6 a c 0 0 N90 W=1u L=0.09u
vdd vdd 0 1.8
.tran 0.01p 5p uic ; Added uic for potentially better oscillator startup
.end`
	},
	{
		name: 'Fast Current Mirror',
		category: 'Analog Circuits',
		description: 'CMOS current mirror with load resistor',
		value: 'fast-current-mirror',
		code: `FAST CURRENT MIRROR
.include modelcard.CMOS90
m1 vdd gate gate gate P90 W=10u L=0.09u
m2 vdd gate out out P90 W=10u L=0.09u
i1 gate 0 0 pulse(0 100u 0 0.1p 0.1p 1p 2p) ; Changed DC value from 100u to 0
r1 out 0 1k
vdd vdd 0 1.8
.tran 0.01p 6p
.end`
	},
	{
		name: 'Chaos RLC Circuit (Chua\'s Circuit)',
		category: 'Nonlinear Circuits',
		description: 'Chua\'s circuit exhibiting chaotic behavior',
		value: 'chaos-rlc-circuit',
		code: `CHAOS RLC CIRCUIT (Chua's Circuit)
.include modelcard.CMOS90
r1 vin n1 220.0
l1 n1 n2 18.0 ; Assuming Henrys
c1 n2 0 0.1  ; Assuming Farads
c2 vin n2 0.01 ; Assuming Farads

; Nonlinear resistor using MOSFETs
m1 n2 n2 n3 n3 N90 W=200.0u L=0.09u
m2 n3 n2 0 0 N90 W=100.0u L=0.09u
r2 n3 0 500.0
vin vin 0 pulse(0 2.5 0 0.1 0.1 12 25)
vdd vdd 0 1.8
.tran 0.05 45 uic ; Added uic as it's often helpful for complex circuits
.end`
	},
	{
		name: 'Parametric Oscillator (Varactor Tuned)',
		category: 'Advanced Circuits',
		description: 'Voltage-controlled oscillator using varactor',
		value: 'parametric-oscillator',
		code: `PARAMETRIC OSCILLATOR (Varactor Tuned)
.include modelcard.CMOS90
l1 osc n1 8.5n ; Assuming nH for a "fast" context with CMOS
m1 n1 vtune n2 0 N90 W=50.0u L=0.09u
c1 n2 0 0.05p ; Assuming pF for a "fast" context with CMOS
r1 osc 0 180.0

; Pump frequency
vpump vtune 0 sin(0 0.8 2meg 0 0) ; Added phase and phi for clarity

; Main oscillation
m2 vdd gate osc osc P90 W=180.0u L=0.09u
m3 osc gate 0 0 N90 W=90.0u L=0.09u
r2 vdd gate 1.2k
vdd vdd 0 1.8
.tran 0.02n 40n uic ; Adjusted tran times to be more consistent with "fast" and assumed nH/pF. Original times were very long.
.end`
	}
];

	let netlistCode = `Basic RLC circuit
.include modelcard.CMOS90

r vdd 2 100.0
l vdd 2 1
c vdd 2 0.01
m1 2 1 0 0 N90 W=100.0u L=0.09u
vdd vdd 0 1.8

vin 1 0 0 pulse (0 1.8 0 0.1 0.1 15 30)
.tran 0.1 50

.end`;

	let resultArray: ResultArrayType | undefined;
	let displayData: DisplayDataType[] = [];
	let isRunning = false;
	let errorMessage = '';
	let threads = navigator?.hardwareConcurrency || 4;
	let theme: 'light' | 'dark' = 'dark';
	let simArray: SimArray;
	let isInitialized = false;
	let plotType: 'webgl' | 'd3' = 'd3'; // Default to D3 for better compatibility

	onMount(async () => {
		if (browser) {
			simArray = new SimArray();
			
			// Initialize simulation workers
			try {
				await simArray.init(threads);
				isInitialized = true;
				console.log('SimArray initialized successfully');
			} catch (error) {
				console.error('Failed to initialize SimArray:', error);
				errorMessage = `Failed to initialize simulation engine: ${error instanceof Error ? error.message : 'Unknown error'}`;
				isInitialized = false;
			}
			
			// Theme detection
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			theme = mediaQuery.matches ? 'dark' : 'light';
			
			mediaQuery.addEventListener('change', (e) => {
				theme = e.matches ? 'dark' : 'light';
			});
		}
	});

	async function runSimulation() {
		if (!simArray || !isInitialized || isRunning) return;
		
		isRunning = true;
		errorMessage = '';
		resultArray = undefined;
		displayData = [];

		try {
			const parser = getParser(netlistCode);
			console.log('Parser result:', parser);

			if (parser.sweep) {
				await simArray.runSweep(netlistCode, threads);
			} else {
				await simArray.run(netlistCode);
			}

			const results = simArray.getResults();
			
			if (results && results.results.length > 0) {
				resultArray = results;
				displayData = makeDD(results.results[0], theme);
				console.log('Simulation completed successfully');
			} else {
				throw new Error('No simulation results generated');
			}
		} catch (error) {
			console.error('Simulation error:', error);
			errorMessage = error instanceof Error ? error.message : 'Unknown simulation error';
		} finally {
			isRunning = false;
		}
	}

	// Example selector state
	let selectedExample = '';
	let exampleSelectorOpen = false;

	function onCodeChange(code: string) {
		netlistCode = code;
	}

	function onDisplayDataChange(newDisplayData: DisplayDataType[]) {
		displayData = newDisplayData;
	}

	function toggleExampleSelector(event) {
		event.stopPropagation();
		exampleSelectorOpen = !exampleSelectorOpen;
	}

	function selectExample(example) {
		selectedExample = example.name;
		netlistCode = example.code;
		exampleSelectorOpen = false;
		// Clear previous results when switching examples
		resultArray = undefined;
		displayData = [];
		errorMessage = '';
	}

	function handleClickOutside(event) {
		// Only close if clicking outside the selector
		if (!event.target.closest('.example-selector')) {
			exampleSelectorOpen = false;
		}
	}
</script>

<svelte:head>
	<title>SPICE Circuit Simulator - Saffron</title>
	<meta name="description" content="Browser-based SPICE circuit simulator using WebAssembly" />
</svelte:head>

<div class="spice-simulator px-4" data-theme={theme}>
	<div class="simulator-header">
		<div class="header-content">
			<h1>SPICE Circuit Simulator</h1>
			
		</div>
		
		<div class="controls">
			<div class="thread-control">
				<label for="threads">Threads:</label>
				<input
					id="threads"
					type="number"
					bind:value={threads}
					min="1"
					max={navigator?.hardwareConcurrency || 8}
					disabled={isRunning}
				/>
			</div>
			
			<button 
				class="run-btn"
				class:running={isRunning}
				class:disabled={!isInitialized}
				on:click={runSimulation}
				disabled={isRunning || !isInitialized}
			>
				{#if isRunning}
					<div class="spinner"></div>
					Running...
				{:else if !isInitialized}
					⚠ Initializing...
				{:else}
					▶ Run Simulation
				{/if}
			</button>
		</div>
	</div>

	{#if errorMessage}
		<div class="error-banner">
			<strong>Simulation Error:</strong> {errorMessage}
		</div>
	{/if}

	<div class="simulator-content">
		<div class="editor-section">
			<div class="section-header">
				<h2>Circuit Editor</h2>
			</div>
			
			<div class="editor-container">
				<div class="example-selector-container">
					<!-- Inline Example Selector -->
					<div class="example-selector py-2">

						<button 
							class="example-trigger" 
							on:click={toggleExampleSelector}
						>
							{selectedExample || 'Select example...'}
							<span class="chevron" class:rotated={exampleSelectorOpen}>↓</span>
						</button>
						
						{#if exampleSelectorOpen}
							<div class="example-dropdown">
								{#each examples as example}
									<button 
										class="example-item" 
										on:click={() => selectExample(example)}
									>
										<div class="example-name">{example.name}</div>
										<div class="example-category">{example.category}</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
				
				<div class="netlist-editor-container">
					<SpiceEditor 
						value={netlistCode}
						{theme}
						on:change={(e) => onCodeChange(e.detail)}
					/>
				</div>
			</div>
		</div>

		<div class="results-section">
			<div class="section-header">
				<h2>Simulation Results</h2>
				<div class="header-controls">
					{#if resultArray}
						<div class="plot-type-selector">
							<label>
								<input 
									type="radio" 
									bind:group={plotType} 
									value="d3" 
								/>
								D3.js
							</label>
							<label>
								<input 
									type="radio" 
									bind:group={plotType} 
									value="webgl" 
								/>
								WebGL
							</label>
						</div>
						<DownloadCSV {resultArray} />
					{/if}
				</div>
			</div>
			
			{#if resultArray}
				<div class="results-content">
					<div class="plot-area">
						{#if plotType === 'd3'}
							<D3PlotCanvas 
								{resultArray}
								{displayData}
								{theme}
							/>
						{:else}
							<PlotCanvas 
								{resultArray}
								{displayData}
								{theme}
							/>
						{/if}
					</div>
					
					<div class="control-panel">
						<DisplayBox 
							{resultArray}
							bind:displayData
							{theme}
							on:updateDisplay={(e) => onDisplayDataChange(e.detail)}
						/>
					</div>
				</div>
			{:else}
				<div class="no-results">
					<p>Run a simulation to see results here</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Click outside handler -->
<svelte:window on:click={handleClickOutside} />

<style>
	.spice-simulator {
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-family: system-ui, -apple-system, sans-serif;
	}

	.spice-simulator[data-theme="dark"] {
		--bg-primary: #1a1a1a;
		--bg-secondary: #2d2d2d;
		--bg-tertiary: #3d3d3d;
		--text-primary: #e5e5e5;
		--text-secondary: #b5b5b5;
		--border-color: #404040;
		--accent-color: #4f9eff;
		--error-bg: #4a1e1e;
		--error-border: #8b2635;
		--success-bg: #1e4a2e;
		--success-border: #26a641;
	}

	.spice-simulator[data-theme="light"] {
		--bg-primary: #ffffff;
		--bg-secondary: #f6f8fa;
		--bg-tertiary: #e5e7ea;
		--text-primary: #24292f;
		--text-secondary: #656d76;
		--border-color: #d0d7de;
		--accent-color: #0969da;
		--error-bg: #ffebee;
		--error-border: #d32f2f;
		--success-bg: #e8f5e8;
		--success-border: #2e7d32;
	}

	.simulator-header {
		padding: 2rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-content h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.header-content p {
		margin: 0.5rem 0 0 0;
		color: var(--text-secondary);
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.thread-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
	}

	.thread-control input {
		width: 60px;
		padding: 0.25rem;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.run-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.run-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent-color) 80%, black);
	}

	.run-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-banner {
		padding: 1rem 2rem;
		background: var(--error-bg);
		border-bottom: 1px solid var(--error-border);
		color: var(--error-border);
	}

	.simulator-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		min-height: calc(100vh - 120px);
	}

	.editor-section,
	.results-section {
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--border-color);
	}

	.results-section {
		border-right: none;
	}

	.section-header {
		padding: 1rem 2rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.plot-type-selector {
		display: flex;
		gap: 1rem;
		padding: 0.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
	}

	.plot-type-selector label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		transition: background-color 0.2s;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.plot-type-selector label:hover {
		background: var(--bg-secondary);
	}

	.plot-type-selector input[type="radio"] {
		margin: 0;
		accent-color: var(--accent-color);
	}

	.results-content {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: 1.5rem;
		flex: 1;
		min-height: 0; /* Allow grid items to shrink */
	}

	.plot-area {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1rem;
		min-height: 400px;
		display: flex;
		flex-direction: column;
	}

	.control-panel {
		display: flex;
		flex-direction: column;
		min-height: 0; /* Allow flex items to shrink */
	}

	.no-results {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		font-style: italic;
	}

	.example-selector {
		position: relative;
	}

	.example-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	.example-trigger {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		background: var(--bg-primary);
		color: var(--text-primary);
		text-align: left;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.example-trigger:hover {
		border-color: var(--accent-color);
		background: var(--bg-secondary);
	}

	.chevron {
		transition: transform 0.2s;
		color: var(--text-secondary);
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.example-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 1000;
		margin-top: 0.25rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
		max-height: 300px;
		overflow-y: auto;
	}

	.example-item {
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.2s;
		border-bottom: 1px solid var(--border-color);
	}

	.example-item:last-child {
		border-bottom: none;
	}

	.example-item:hover {
		background: var(--bg-secondary);
	}

	.example-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.example-category {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	@media (max-width: 1200px) {
		.results-content {
			grid-template-columns: 1fr 300px;
		}
	}

	@media (max-width: 1024px) {
		.simulator-content {
			grid-template-columns: 1fr;
		}
		
		.editor-section {
			border-right: none;
			border-bottom: 1px solid var(--border-color);
		}

		.results-section {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr auto;
		}

		.control-panel {
			order: 2;
		}

		.plot-area {
			order: 1;
		}
	}

	@media (max-width: 768px) {
		.simulator-header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.controls {
			justify-content: space-between;
		}
	}
</style>