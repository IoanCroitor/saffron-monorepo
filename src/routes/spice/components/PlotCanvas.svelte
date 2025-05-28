<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import type { ResultArrayType } from '../lib/simulationArray';
	import type { DisplayDataType } from '../lib/displayData';

	export let resultArray: ResultArrayType | undefined = undefined;
	export let displayData: DisplayDataType[] = [];
	export let theme: 'light' | 'dark' = 'dark';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let plotContainer: HTMLDivElement;
	
	let width = 800;
	let height = 400;
	let margin = { top: 20, right: 60, bottom: 50, left: 60 };
	
	// Plot bounds and scales
	let xMin = 0, xMax = 1, yMin = 0, yMax = 1;
	let xScale: (x: number) => number;
	let yScale: (y: number) => number;

	// Fullscreen state
	let isChartFullscreen = false;
	let chartWrapper: HTMLDivElement;

	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d');
			updateCanvasSize();
			window.addEventListener('resize', updateCanvasSize);
		}
		
		return () => {
			window.removeEventListener('resize', updateCanvasSize);
		};
	});

	afterUpdate(() => {
		if (ctx && resultArray && displayData.length > 0) {
			drawPlot();
		}
	});

	function updateCanvasSize() {
		if (plotContainer && canvas) {
			const rect = plotContainer.getBoundingClientRect();
			width = Math.max(400, rect.width - 40);
			height = Math.max(300, rect.height - 40);
			
			// Set canvas size with device pixel ratio for crisp rendering
			const dpr = window.devicePixelRatio || 1;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			canvas.style.width = width + 'px';
			canvas.style.height = height + 'px';
			
			if (ctx) {
				ctx.scale(dpr, dpr);
				drawPlot();
			}
		}
	}

	function calculateBounds() {
		if (!resultArray || resultArray.length === 0) return;

		let dataXMin = Infinity, dataXMax = -Infinity;
		let dataYMin = Infinity, dataYMax = -Infinity;

		// Find bounds across all visible signals
		const visibleSignals = displayData.filter(d => d.visible);
		
		for (const result of resultArray) {
			if (!result.data) continue;
			
			// X-axis bounds
			if (result.data.x) {
				const xData = Array.isArray(result.data.x) ? result.data.x : [result.data.x];
				dataXMin = Math.min(dataXMin, ...xData);
				dataXMax = Math.max(dataXMax, ...xData);
			}
			
			// Y-axis bounds for visible signals
			for (const signal of visibleSignals) {
				if (result.data[signal.name]) {
					const yData = Array.isArray(result.data[signal.name]) 
						? result.data[signal.name] 
						: [result.data[signal.name]];
					
					// Handle complex numbers
					const realData = yData.map(val => 
						typeof val === 'object' && val !== null && 'real' in val 
							? val.real 
							: typeof val === 'number' ? val : 0
					);
					
					dataYMin = Math.min(dataYMin, ...realData);
					dataYMax = Math.max(dataYMax, ...realData);
				}
			}
		}

		// Add padding
		const xPadding = (dataXMax - dataXMin) * 0.05;
		const yPadding = (dataYMax - dataYMin) * 0.1;
		
		xMin = dataXMin - xPadding;
		xMax = dataXMax + xPadding;
		yMin = dataYMin - yPadding;
		yMax = dataYMax + yPadding;

		// Create scale functions
		xScale = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
		yScale = (y: number) => height - margin.bottom - ((y - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);
	}

	function drawPlot() {
		if (!ctx || !resultArray || resultArray.length === 0) return;

		calculateBounds();
		
		// Clear canvas
		ctx.clearRect(0, 0, width, height);
		
		// Set styles based on theme
		const bgColor = theme === 'dark' ? '#1a202c' : '#ffffff';
		const gridColor = theme === 'dark' ? '#4a5568' : '#e2e8f0';
		const textColor = theme === 'dark' ? '#e2e8f0' : '#2d3748';
		
		// Draw background
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, width, height);
		
		// Draw grid and axes
		drawGrid(gridColor, textColor);
		
		// Draw data lines
		const visibleSignals = displayData.filter(d => d.visible);
		for (const signal of visibleSignals) {
			drawSignal(signal);
		}
	}

	function drawGrid(gridColor: string, textColor: string) {
		if (!ctx) return;

		ctx.strokeStyle = gridColor;
		ctx.lineWidth = 1;
		ctx.font = '12px monospace';
		ctx.fillStyle = textColor;

		// Vertical grid lines (X-axis)
		const xTicks = 8;
		for (let i = 0; i <= xTicks; i++) {
			const x = margin.left + (i / xTicks) * (width - margin.left - margin.right);
			const value = xMin + (i / xTicks) * (xMax - xMin);
			
			ctx.beginPath();
			ctx.moveTo(x, margin.top);
			ctx.lineTo(x, height - margin.bottom);
			ctx.stroke();
			
			// X-axis labels
			ctx.textAlign = 'center';
			ctx.fillText(formatNumber(value), x, height - margin.bottom + 20);
		}

		// Horizontal grid lines (Y-axis)
		const yTicks = 6;
		for (let i = 0; i <= yTicks; i++) {
			const y = height - margin.bottom - (i / yTicks) * (height - margin.top - margin.bottom);
			const value = yMin + (i / yTicks) * (yMax - yMin);
			
			ctx.beginPath();
			ctx.moveTo(margin.left, y);
			ctx.lineTo(width - margin.right, y);
			ctx.stroke();
			
			// Y-axis labels
			ctx.textAlign = 'right';
			ctx.fillText(formatNumber(value), margin.left - 10, y + 4);
		}

		// Draw axes
		ctx.strokeStyle = textColor;
		ctx.lineWidth = 2;
		
		// X-axis
		ctx.beginPath();
		ctx.moveTo(margin.left, height - margin.bottom);
		ctx.lineTo(width - margin.right, height - margin.bottom);
		ctx.stroke();
		
		// Y-axis
		ctx.beginPath();
		ctx.moveTo(margin.left, margin.top);
		ctx.lineTo(margin.left, height - margin.bottom);
		ctx.stroke();
	}

	function drawSignal(signal: DisplayDataType) {
		if (!ctx || !resultArray) return;

		ctx.strokeStyle = signal.color;
		ctx.lineWidth = 2;
		ctx.beginPath();

		let firstPoint = true;

		for (const result of resultArray) {
			if (!result.data || !result.data.x || !result.data[signal.name]) continue;

			const xData = Array.isArray(result.data.x) ? result.data.x : [result.data.x];
			const yData = Array.isArray(result.data[signal.name]) 
				? result.data[signal.name] 
				: [result.data[signal.name]];

			for (let i = 0; i < Math.min(xData.length, yData.length); i++) {
				const x = xData[i];
				const yVal = yData[i];
				
				// Handle complex numbers - use real part
				const y = typeof yVal === 'object' && yVal !== null && 'real' in yVal 
					? yVal.real 
					: typeof yVal === 'number' ? yVal : 0;

				const plotX = xScale(x);
				const plotY = yScale(y);

				if (firstPoint) {
					ctx.moveTo(plotX, plotY);
					firstPoint = false;
				} else {
					ctx.lineTo(plotX, plotY);
				}
			}
		}

		ctx.stroke();
	}

	function formatNumber(value: number): string {
		if (Math.abs(value) >= 1e6) {
			return (value / 1e6).toFixed(1) + 'M';
		} else if (Math.abs(value) >= 1e3) {
			return (value / 1e3).toFixed(1) + 'k';
		} else if (Math.abs(value) >= 1) {
			return value.toFixed(2);
		} else if (Math.abs(value) >= 1e-3) {
			return (value * 1e3).toFixed(1) + 'm';
		} else if (Math.abs(value) >= 1e-6) {
			return (value * 1e6).toFixed(1) + 'μ';
		} else if (Math.abs(value) >= 1e-9) {
			return (value * 1e9).toFixed(1) + 'n';
		} else {
			return value.toExponential(1);
		}
	}

	function toggleChartFullscreen() {
		if (!isChartFullscreen) {
			if (chartWrapper.requestFullscreen) {
				chartWrapper.requestFullscreen();
				isChartFullscreen = true;
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
				isChartFullscreen = false;
			}
		}
	}

	function handleChartFullscreenChange() {
		isChartFullscreen = document.fullscreenElement === chartWrapper;
		// Trigger resize to adjust plot after fullscreen change
		if (plotContainer) {
			setTimeout(() => updateCanvasSize(), 100);
		}
	}
</script>

<svelte:window on:fullscreenchange={handleChartFullscreenChange} />

<div class="plot-container" bind:this={chartWrapper} class:fullscreen={isChartFullscreen} data-theme={theme}>
	<div class="plot-header">
		<h3>WebGL Plot</h3>
		<div class="plot-controls">
			<button 
				class="control-btn"
				on:click={toggleChartFullscreen}
				title={isChartFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
			>
				{#if isChartFullscreen}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M8 3v3a2 2 0 0 1-2 2H3"/>
						<path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
						<path d="M3 16h3a2 2 0 0 1 2 2v3"/>
						<path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
					</svg>
				{:else}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 7V5a2 2 0 0 1 2-2h2"/>
						<path d="M17 3h2a2 2 0 0 1 2 2v2"/>
						<path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
						<path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
					</svg>
				{/if}
			</button>
		</div>
	</div>
	<div class="plot-content" bind:this={plotContainer} class:dark={theme === 'dark'}>
	{#if !resultArray || resultArray.length === 0}
		<div class="no-data">
			<p>No simulation data to display</p>
		</div>
	{:else if displayData.filter(d => d.visible).length === 0}
		<div class="no-data">
			<p>No signals selected for display</p>
		</div>
	{:else}
		<canvas bind:this={canvas}></canvas>
	{/if}
	</div>
</div>

<style>
	.plot-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 400px;
		position: relative;
		background: var(--bg-primary, #ffffff);
		border: 1px solid var(--border-color, #dee2e6);
		border-radius: 8px;
		overflow: hidden;
	}

	.plot-container.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw !important;
		height: 100vh !important;
		z-index: 9999;
		border-radius: 0;
		border: none;
	}

	.plot-container.dark {
		background: var(--bg-primary-dark, #1a202c);
		border-color: var(--border-color-dark, #4a5568);
	}

	.plot-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary, #f8f9fa);
		border-bottom: 1px solid var(--border-color, #dee2e6);
		min-height: 60px;
	}

	.plot-header h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #212529);
	}

	.plot-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.control-btn {
		padding: 0.5rem;
		background: var(--bg-primary, #ffffff);
		border: 1px solid var(--border-color, #dee2e6);
		border-radius: 4px;
		color: var(--text-secondary, #6c757d);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-btn:hover {
		background: var(--bg-secondary, #f8f9fa);
		color: var(--text-primary, #212529);
		border-color: var(--accent-color, #007bff);
	}

	.plot-content {
		flex: 1;
		position: relative;
		overflow: hidden;
		min-height: 0;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.no-data {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted, #6c757d);
		font-style: italic;
		text-align: center;
		padding: 2rem;
	}

	.no-data p {
		margin: 0.25rem 0;
		font-size: 1.1rem;
	}

	.plot-container.dark {
		background: var(--bg-primary-dark, #1a202c);
		border-color: var(--border-color-dark, #4a5568);
	}

	.plot-container.dark .plot-header {
		background: var(--bg-secondary-dark, #2d3748);
		border-bottom-color: var(--border-color-dark, #4a5568);
	}

	.plot-container.dark .plot-header h3 {
		color: var(--text-primary-dark, #f7fafc);
	}

	.plot-container.dark .control-btn {
		background: var(--bg-primary-dark, #1a202c);
		border-color: var(--border-color-dark, #4a5568);
		color: var(--text-secondary-dark, #a0aec0);
	}

	.plot-container.dark .control-btn:hover {
		background: var(--bg-secondary-dark, #2d3748);
		color: var(--text-primary-dark, #f7fafc);
		border-color: var(--accent-color, #007bff);
	}

	.plot-container.dark .no-data {
		color: var(--text-muted-dark, #a0aec0);
	}
</style>