<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import type { ResultArrayType } from '../lib/simulationArray';
	import type { DisplayDataType } from '../lib/displayData';

	export let resultArray: ResultArrayType | undefined = undefined;
	export let displayData: DisplayDataType[] = [];
	export let theme: 'light' | 'dark' = 'dark';

	const dispatch = createEventDispatcher();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let webglLoaded = false;
	let webglError = false;
	let wglp: any = null;

	// WebGL Plot modules
	let WebglPlotModule: any = null;

	onMount(async () => {
		if (!browser) return;

		try {
			// Try to load WebGL Plot
			const { WebglPlot, ColorRGBA, WebglLine } = await import('webgl-plot');
			WebglPlotModule = { WebglPlot, ColorRGBA, WebglLine };
			
			initializeWebGL();
			webglLoaded = true;
			plotWebGL();
		} catch (error) {
			console.warn('Failed to load WebGL Plot, using Canvas fallback:', error);
			webglError = true;
			initializeCanvas();
		}
	});

	function initializeWebGL() {
		if (!WebglPlotModule || !canvas) return;

		try {
			wglp = new WebglPlotModule.WebglPlot(canvas);
			
			// Set theme colors
			if (theme === 'dark') {
				wglp.gClearColor = { r: 0.1, g: 0.1, b: 0.1, a: 1 };
			} else {
				wglp.gClearColor = { r: 0.95, g: 0.95, b: 0.95, a: 1 };
			}
			
			// Start render loop
			const render = () => {
				if (wglp) {
					wglp.update();
				}
				requestAnimationFrame(render);
			};
			render();
		} catch (error) {
			console.error('WebGL initialization failed:', error);
			webglError = true;
			initializeCanvas();
		}
	}

	function initializeCanvas() {
		if (!canvas) return;
		ctx = canvas.getContext('2d');
		plotCanvas();
	}

	function plotWebGL() {
		if (!wglp || !WebglPlotModule || !resultArray || !displayData.length) return;

		try {
			// Clear existing lines
			wglp.removeDataLines();

			const visibleData = displayData.filter(dd => dd.visible);
			if (visibleData.length === 0) return;

			// Get first result
			const result = resultArray.results?.[0];
			if (!result || !result.data || result.data.length === 0) return;

			// Plot each visible signal
			visibleData.forEach((dd, index) => {
				const dataIndex = result.variableNames.indexOf(dd.name);
				if (dataIndex < 0 || dataIndex >= result.data.length) return;

				const data = result.data[dataIndex];
				if (!data?.values || data.values.length === 0) return;

				// Convert to real values for plotting
				let values: number[];
				if (Array.isArray(data.values) && typeof data.values[0] === 'object') {
					// Complex data - use magnitude
					values = (data.values as any[]).map(v => 
						Math.sqrt((v.re || 0) * (v.re || 0) + (v.im || 0) * (v.im || 0))
					);
				} else {
					values = data.values as number[];
				}

				if (values.length === 0) return;

				// Create line with color
				const color = dd.color 
					? new WebglPlotModule.ColorRGBA(dd.color.r, dd.color.g, dd.color.b, 1)
					: new WebglPlotModule.ColorRGBA(
						0.2 + (index * 0.3) % 0.8,
						0.2 + (index * 0.5) % 0.8,
						0.2 + (index * 0.7) % 0.8,
						1
					);

				const line = new WebglPlotModule.WebglLine(color, values.length);

				// Set data points
				for (let i = 0; i < values.length; i++) {
					const x = (i / (values.length - 1)) * 2 - 1; // Normalize to [-1, 1]
					const y = (values[i] - Math.min(...values)) / (Math.max(...values) - Math.min(...values)) * 2 - 1;
					line.setX(i, x);
					line.setY(i, y);
				}

				wglp.addDataLine(line);
			});
		} catch (error) {
			console.error('WebGL plotting error:', error);
		}
	}

	function plotCanvas() {
		if (!ctx || !canvas || !resultArray || !displayData.length) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// Set background
		ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : '#f5f5f5';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const visibleData = displayData.filter(dd => dd.visible);
		if (visibleData.length === 0) return;

		try {
			const result = resultArray.results?.[0];
			if (!result || !result.data || result.data.length === 0) return;

			// Draw each visible signal
			visibleData.forEach((dd, index) => {
				const dataIndex = result.variableNames.indexOf(dd.name);
				if (dataIndex < 0 || dataIndex >= result.data.length || !ctx) return;

				const data = result.data[dataIndex];
				if (!data?.values || data.values.length === 0) return;

				// Convert to real values
				let values: number[];
				if (Array.isArray(data.values) && typeof data.values[0] === 'object') {
					values = (data.values as any[]).map(v => 
						Math.sqrt((v.re || 0) * (v.re || 0) + (v.im || 0) * (v.im || 0))
					);
				} else {
					values = data.values as number[];
				}

				if (values.length === 0) return;

				// Set line color
				if (dd.color) {
					ctx.strokeStyle = `rgb(${dd.color.r * 255}, ${dd.color.g * 255}, ${dd.color.b * 255})`;
				} else {
					const hue = (index * 60) % 360;
					ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
				}

				ctx.lineWidth = 2;
				ctx.beginPath();

				const minVal = Math.min(...values);
				const maxVal = Math.max(...values);
				const range = maxVal - minVal || 1;

				// Draw line
				for (let i = 0; i < values.length; i++) {
					const x = (i / (values.length - 1)) * canvas.width;
					const y = canvas.height - ((values[i] - minVal) / range) * canvas.height;
					
					if (i === 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}
				ctx.stroke();
			});
		} catch (error) {
			console.error('Canvas plotting error:', error);
		}
	}

	// Mouse interaction handlers (for WebGL)
	function handleMouseDown(event: MouseEvent) {
		event.preventDefault();
	}

	function handleMouseMove(event: MouseEvent) {
		event.preventDefault();
	}

	function handleMouseUp(event: MouseEvent) {
		event.preventDefault();
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
	}

	function resetView() {
		// Reset WebGL view if available
		if (wglp) {
			// Reset any transformations
		}
	}

	// Reactive updates
	$: if (wglp && webglLoaded && WebglPlotModule) {
		plotWebGL();
	}

	$: if (ctx && webglError) {
		plotCanvas();
	}

	// Handle canvas resize
	function updateCanvasSize() {
		if (!canvas) return;
		
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * window.devicePixelRatio;
		canvas.height = rect.height * window.devicePixelRatio;
		canvas.style.width = rect.width + 'px';
		canvas.style.height = rect.height + 'px';
		
		if (ctx) {
			ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
			plotCanvas();
		}
	}

	onMount(() => {
		if (canvas) {
			updateCanvasSize();
			window.addEventListener('resize', updateCanvasSize);
			return () => window.removeEventListener('resize', updateCanvasSize);
		}
	});
</script>

<div class="plot-container">
	<div class="plot-controls">
		<button class="control-btn" on:click={resetView} title="Reset View" disabled={!webglLoaded}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
				<path d="M21 3v5h-5"/>
				<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
				<path d="M3 21v-5h5"/>
			</svg>
			Reset
		</button>
	</div>
	
	{#if webglLoaded}
		<canvas
			bind:this={canvas}
			class="plot-canvas"
			on:mousedown={handleMouseDown}
			on:mousemove={handleMouseMove}
			on:mouseup={handleMouseUp}
			on:wheel={handleWheel}
			on:contextmenu|preventDefault
		></canvas>
	{:else if webglError}
		<div class="fallback-plot">
			<div class="fallback-content">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 3v18h18"/>
					<path d="M7 12l3-3 3 3 5-5"/>
				</svg>
				<h3>WebGL Plot Not Available</h3>
				<p>Unable to load WebGL plotting library.</p>
				<p>Simulation results can still be downloaded as CSV.</p>
			</div>
		</div>
	{:else}
		<div class="loading-plot">
			<div class="loading-content">
				<div class="loading-spinner"></div>
				<p>Loading plot...</p>
			</div>
		</div>
	{/if}

	{#if !resultArray && webglLoaded}
		<div class="no-data">
			<p>No simulation data to display</p>
			<p class="hint">Run a simulation to see plots here</p>
		</div>
	{/if}
</div>

<style>
	.plot-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 300px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.plot-controls {
		display: flex;
		justify-content: flex-end;
		padding: 0.5rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
	}

	.control-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.control-btn:hover:not(:disabled) {
		background: var(--accent-color);
		color: white;
	}

	.control-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.plot-canvas {
		flex: 1;
		width: 100%;
		height: 100%;
		cursor: crosshair;
	}

	.plot-canvas:active {
		cursor: grabbing;
	}

	.fallback-plot,
	.loading-plot {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
	}

	.fallback-content,
	.loading-content {
		text-align: center;
		color: var(--text-secondary);
		padding: 2rem;
	}

	.fallback-content svg {
		margin-bottom: 1rem;
		color: var(--text-tertiary);
	}

	.fallback-content h3 {
		margin: 0 0 0.5rem 0;
		color: var(--text-primary);
		font-size: 1.125rem;
	}

	.fallback-content p {
		margin: 0.25rem 0;
		font-size: 0.875rem;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--border-color);
		border-top: 3px solid var(--accent-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem auto;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-content p {
		margin: 0;
		font-size: 0.875rem;
	}

	.no-data {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: var(--text-secondary);
		pointer-events: none;
	}

	.no-data p {
		margin: 0.25rem 0;
	}

	.hint {
		font-size: 0.875rem;
		opacity: 0.7;
	}
</style>
