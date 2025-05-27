<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import * as d3 from 'd3';
	import type { ResultArrayType } from '../lib/simulationArray';
	import type { DisplayDataType } from '../lib/displayData';

	export let resultArray: ResultArrayType | undefined = undefined;
	export let displayData: DisplayDataType[] = [];
	export let theme: 'light' | 'dark' = 'dark';

	let plotContainer: HTMLDivElement;
	let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let width = 800;
	let height = 400;
	const margin = { top: 20, right: 30, bottom: 40, left: 60 };

	onMount(() => {
		initializePlot();
		// Set up resize observer for responsive behavior
		if (plotContainer) {
			const resizeObserver = new ResizeObserver(() => {
				handleResize();
			});
			resizeObserver.observe(plotContainer);
			
			// Cleanup on component destroy
			return () => resizeObserver.disconnect();
		}
	});

	afterUpdate(() => {
		updatePlot();
	});

	function initializePlot() {
		if (!plotContainer) return;

		// Clear any existing SVG
		d3.select(plotContainer).selectAll('*').remove();

		// Create SVG
		svg = d3.select(plotContainer)
			.append('svg')
			.attr('width', width)
			.attr('height', height);

		// Add background
		svg.append('rect')
			.attr('width', width)
			.attr('height', height)
			.attr('fill', theme === 'dark' ? '#1a1a1a' : '#ffffff');

		updatePlot();
	}

	function updatePlot() {
		if (!svg || !resultArray || resultArray.results.length === 0) return;

		const visibleData = displayData.filter(dd => dd.visible);
		if (visibleData.length === 0) return;

		// Clear previous plot elements
		svg.selectAll('.plot-element').remove();

		const result = resultArray.results[0];
		if (!result || !result.variableNames || result.variableNames.length === 0) return;

		console.log('D3PlotCanvas - result structure:', result);
		console.log('D3PlotCanvas - variable names:', result.variableNames);
		console.log('D3PlotCanvas - visible data:', visibleData);

		// Find time/frequency variable (usually first one)
		const xVariableName = result.variableNames[0];
		const xData = getVariableData(result, xVariableName);
		
		if (!xData || xData.length === 0) {
			console.log('D3PlotCanvas - No X data found for variable:', xVariableName);
			return;
		}

		console.log('D3PlotCanvas - X data sample:', xData.slice(0, 5));

		// Set up scales
		const xScale = d3.scaleLinear()
			.domain(d3.extent(xData.map(d => getValueAsNumber(d))) as [number, number])
			.range([margin.left, width - margin.right]);

		// Calculate Y domain across all visible signals
		let allYValues: number[] = [];
		visibleData.forEach(dd => {
			const yData = getVariableData(result, dd.name);
			if (yData) {
				allYValues = allYValues.concat(yData.map(d => getValueAsNumber(d)));
			}
		});

		if (allYValues.length === 0) {
			console.log('D3PlotCanvas - No Y data found');
			return;
		}

		console.log('D3PlotCanvas - Y data range:', d3.extent(allYValues));

		const yScale = d3.scaleLinear()
			.domain(d3.extent(allYValues) as [number, number])
			.nice()
			.range([height - margin.bottom, margin.top]);

		// Create line generator
		const line = d3.line<any>()
			.x((d, i) => xScale(getValueAsNumber(xData[i])))
			.y(d => yScale(getValueAsNumber(d)))
			.curve(d3.curveLinear);

		// Add grid lines
		addGridLines(xScale, yScale);

		// Add axes
		addAxes(xScale, yScale, xVariableName);

		// Plot lines for each visible signal
		visibleData.forEach((dd, index) => {
			// Try to find the variable data using the display data name
			let yData = getVariableData(result, dd.name);
			
			// If not found, try removing modifiers like " (mag)" or " (phase)"
			if (!yData) {
				const baseName = dd.name.replace(/ \(mag\)| \(phase\)/, '');
				yData = getVariableData(result, baseName);
			}
			
			if (!yData || yData.length !== xData.length) {
				console.log(`D3PlotCanvas - Data length mismatch for ${dd.name}:`, yData?.length, 'vs', xData.length);
				return;
			}

			const color = dd.color ? 
				`rgb(${Math.round(dd.color.r * 255)}, ${Math.round(dd.color.g * 255)}, ${Math.round(dd.color.b * 255)})` : 
				d3.schemeCategory10[index % 10];

			console.log(`D3PlotCanvas - Plotting ${dd.name} with color:`, color);

			// Add the line
			svg.append('path')
				.datum(yData)
				.attr('class', 'plot-element line')
				.attr('fill', 'none')
				.attr('stroke', color)
				.attr('stroke-width', 1.5)
				.attr('d', line);

			// Add legend entry
			addLegendEntry(dd.name, color, index);
		});
	}

	function addGridLines(xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) {
		const gridColor = theme === 'dark' ? '#333' : '#e0e0e0';

		// X grid lines
		svg.selectAll('.grid-x')
			.data(xScale.ticks(8))
			.enter()
			.append('line')
			.attr('class', 'plot-element grid-x')
			.attr('x1', d => xScale(d))
			.attr('x2', d => xScale(d))
			.attr('y1', margin.top)
			.attr('y2', height - margin.bottom)
			.attr('stroke', gridColor)
			.attr('stroke-width', 0.5)
			.attr('opacity', 0.5);

		// Y grid lines
		svg.selectAll('.grid-y')
			.data(yScale.ticks(6))
			.enter()
			.append('line')
			.attr('class', 'plot-element grid-y')
			.attr('x1', margin.left)
			.attr('x2', width - margin.right)
			.attr('y1', d => yScale(d))
			.attr('y2', d => yScale(d))
			.attr('stroke', gridColor)
			.attr('stroke-width', 0.5)
			.attr('opacity', 0.5);
	}

	function addAxes(xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>, xLabel: string) {
		const textColor = theme === 'dark' ? '#ffffff' : '#000000';

		// X axis
		svg.append('g')
			.attr('class', 'plot-element axis')
			.attr('transform', `translate(0,${height - margin.bottom})`)
			.call(d3.axisBottom(xScale).tickFormat(d3.format('.2e')))
			.selectAll('text')
			.attr('fill', textColor);

		// Y axis
		svg.append('g')
			.attr('class', 'plot-element axis')
			.attr('transform', `translate(${margin.left},0)`)
			.call(d3.axisLeft(yScale).tickFormat(d3.format('.2e')))
			.selectAll('text')
			.attr('fill', textColor);

		// Axis lines
		svg.selectAll('.domain, .tick line')
			.attr('stroke', textColor);

		// X axis label
		svg.append('text')
			.attr('class', 'plot-element axis-label')
			.attr('transform', `translate(${width / 2}, ${height - 5})`)
			.style('text-anchor', 'middle')
			.style('font-size', '12px')
			.attr('fill', textColor)
			.text(xLabel);

		// Y axis label
		svg.append('text')
			.attr('class', 'plot-element axis-label')
			.attr('transform', 'rotate(-90)')
			.attr('y', 15)
			.attr('x', -height / 2)
			.style('text-anchor', 'middle')
			.style('font-size', '12px')
			.attr('fill', textColor)
			.text('Amplitude');
	}

	function addLegendEntry(name: string, color: string, index: number) {
		const textColor = theme === 'dark' ? '#ffffff' : '#000000';
		const legendY = 40 + index * 20;

		// Legend line
		svg.append('line')
			.attr('class', 'plot-element legend')
			.attr('x1', width - 150)
			.attr('x2', width - 130)
			.attr('y1', legendY)
			.attr('y2', legendY)
			.attr('stroke', color)
			.attr('stroke-width', 2);

		// Legend text
		svg.append('text')
			.attr('class', 'plot-element legend')
			.attr('x', width - 125)
			.attr('y', legendY + 4)
			.style('font-size', '12px')
			.attr('fill', textColor)
			.text(name);
	}

	function getVariableData(result: any, variableName: string): any[] | undefined {
		const index = result.variableNames.indexOf(variableName);
		if (index === -1) return undefined;

		// Handle the actual result structure with data array
		if (result.data && result.data[index] && result.data[index].values) {
			return result.data[index].values;
		}

		// Fallback for legacy structure
		if (result.realData && result.realData[index]) {
			return result.realData[index];
		}
		if (result.complexData && result.complexData[index]) {
			// For complex data, return magnitude
			return result.complexData[index].map((c: any) => 
				Math.sqrt(c.real * c.real + c.img * c.img)
			);
		}
		return undefined;
	}

	function getValueAsNumber(value: any): number {
		if (typeof value === 'number') return value;
		if (value && typeof value.real === 'number') {
			// For complex numbers, return magnitude
			if (typeof value.img === 'number') {
				return Math.sqrt(value.real * value.real + value.img * value.img);
			}
			return value.real;
		}
		// Handle string numbers
		if (typeof value === 'string') {
			const parsed = parseFloat(value);
			return isNaN(parsed) ? 0 : parsed;
		}
		return 0;
	}

	function handleResize() {
		if (!plotContainer) return;
		
		const rect = plotContainer.getBoundingClientRect();
		const newWidth = Math.max(400, rect.width);
		const newHeight = Math.max(300, rect.height);
		
		if (Math.abs(newWidth - width) > 10 || Math.abs(newHeight - height) > 10) {
			width = newWidth;
			height = newHeight;
			
			if (svg) {
				svg.attr('width', width).attr('height', height);
				// Update background
				svg.select('rect')
					.attr('width', width)
					.attr('height', height);
				updatePlot();
			}
		}
	}
</script>

<svelte:window on:resize={handleResize} />

<div class="d3-plot-container">
	<div class="plot-header">
		<h3>Simulation Results</h3>
		<div class="plot-info">
			{#if resultArray && resultArray.results.length > 0}
				<span class="info-text">
					{resultArray.results[0]?.variableNames?.length || 0} variables
				</span>
			{/if}
		</div>
	</div>
	
	<div class="plot-content" bind:this={plotContainer}>
		{#if !resultArray || resultArray.results.length === 0}
			<div class="no-data">
				<p>No simulation data to display</p>
				<p class="hint">Run a simulation to see the results here</p>
			</div>
		{:else if displayData.filter(dd => dd.visible).length === 0}
			<div class="no-data">
				<p>No signals selected for display</p>
				<p class="hint">Select signals in the Signal Visibility panel</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.d3-plot-container {
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		height: 100%;
		min-height: 400px;
	}

	.plot-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		border-radius: 4px 4px 0 0;
	}

	.plot-header h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.plot-info {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.info-text {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.plot-content {
		flex: 1;
		position: relative;
		overflow: hidden;
		min-height: 0;
	}

	.no-data {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-secondary);
		text-align: center;
		padding: 2rem;
	}

	.no-data p {
		margin: 0.25rem 0;
	}

	.hint {
		font-size: 0.75rem;
		opacity: 0.7;
	}

	:global(.d3-plot-container svg) {
		width: 100%;
		height: 100%;
	}

	/* D3 styling */
	:global(.plot-element.line) {
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	:global(.plot-element.axis .domain) {
		stroke-width: 1;
	}

	:global(.plot-element.axis .tick line) {
		stroke-width: 1;
	}

	:global(.plot-element.legend) {
		cursor: default;
	}
</style>
