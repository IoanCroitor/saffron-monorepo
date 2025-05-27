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

	function onCodeChange(code: string) {
		netlistCode = code;
	}

	function onDisplayDataChange(newDisplayData: DisplayDataType[]) {
		displayData = newDisplayData;
	}
</script>

<svelte:head>
	<title>SPICE Circuit Simulator - Saffron</title>
	<meta name="description" content="Browser-based SPICE circuit simulator using WebAssembly" />
</svelte:head>

<div class="spice-simulator" data-theme={theme}>
	<div class="simulator-header">
		<div class="header-content">
			<h1>SPICE Circuit Simulator</h1>
			<p>A browser-based circuit simulator powered by WebAssembly</p>
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
				<h2>Netlist Editor</h2>
			</div>
			<SpiceEditor 
				value={netlistCode}
				{theme}
				on:change={(e) => onCodeChange(e.detail)}
			/>
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
					
					<DisplayBox 
						{resultArray}
						{displayData}
						{theme}
						on:displayDataChange={(e) => onDisplayDataChange(e.detail)}
					/>
				</div>
			{:else}
				<div class="no-results">
					<p>Run a simulation to see results here</p>
				</div>
			{/if}
		</div>
	</div>
</div>

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
		color: var(--text-secondary);
	}

	.plot-type-selector label:hover {
		background: var(--bg-secondary);
	}

	.plot-type-selector input[type="radio"] {
		margin: 0;
		accent-color: var(--primary-color);
	}

	.plot-type-selector input[type="radio"]:checked + span {
		color: var(--text-primary);
		font-weight: 500;
	}

	.plot-type-selector label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--text-primary);
		transition: background-color 0.2s;
	}

	.plot-type-selector label:hover {
		background: var(--bg-secondary);
	}

	.plot-type-selector input[type="radio"] {
		margin: 0;
		accent-color: var(--accent-color);
	}

	.results-content {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.no-results {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		font-style: italic;
	}

	@media (max-width: 1024px) {
		.simulator-content {
			grid-template-columns: 1fr;
		}
		
		.editor-section {
			border-right: none;
			border-bottom: 1px solid var(--border-color);
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