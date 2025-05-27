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
	
	// Oscilloscope-like features
	let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>;
	let currentTransform = d3.zoomIdentity;
	let xScale: d3.ScaleLinear<number, number>;
	let yScale: d3.ScaleLinear<number, number>;
	let originalXDomain: [number, number];
	let originalYDomain: [number, number];
	let showCrosshair = true;
	let showGrid = true;
	let measurementMode = false;
	let measurementPoints: { x: number, y: number, signal?: string }[] = [];
	let persistentMeasurements: { point1: { x: number, y: number, signal?: string }, point2: { x: number, y: number, signal?: string } }[] = [];
	let cursorPosition = { x: 0, y: 0 };
	let cursorValues = { x: 0, y: 0 };
	let nearestSignalValue: { signal: string, value: number } | null = null;
	let lockedSignal: string | null = null; // For cursor signal selection
	let isMouseOverPlot = false;
	let animationFrameId: number;
	let lastMouseEvent: MouseEvent | null = null;
	let isDragging = false;
	let dragTarget: { type: 'measurement', measurementIndex: number, pointIndex: number } | null = null;
	
	// Signal data for snapping measurements
	let signalData: { name: string, data: { x: number, y: number }[], color: string }[] = [];

	onMount(() => {
		initializePlot();
		// Set up resize observer for responsive behavior
		if (plotContainer) {
			const resizeObserver = new ResizeObserver(() => {
				handleResize();
			});
			resizeObserver.observe(plotContainer);
			
			// Cleanup on component destroy
			return () => {
				resizeObserver.disconnect();
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
				}
			};
		}
	});

	afterUpdate(() => {
		updatePlot();
	});

	// Reactive statements to update plot when controls change
	$: if (svg && showGrid !== undefined) {
		// Update plot when grid setting changes
		updatePlot();
	}

	$: if (svg && showCrosshair !== undefined && isMouseOverPlot) {
		// Update crosshair visibility
		svg.select('.crosshair').style('display', showCrosshair ? 'block' : 'none');
		svg.select('.cursor-info').style('display', showCrosshair ? 'block' : 'none');
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (!isMouseOverPlot) return;
		
		switch (event.key) {
			case 'r':
			case 'R':
				event.preventDefault();
				resetZoom();
				break;
			case 'c':
			case 'C':
				event.preventDefault();
				showCrosshair = !showCrosshair;
				break;
			case 'g':
			case 'G':
				event.preventDefault();
				showGrid = !showGrid;
				break;
			case 'm':
			case 'M':
				event.preventDefault();
				measurementMode = !measurementMode;
				break;
			case 'Delete':
			case 'Backspace':
				event.preventDefault();
				clearMeasurements();
				break;
		}
	}

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

		// Create clip path for plot area
		svg.append('defs')
			.append('clipPath')
			.attr('id', 'plot-clip')
			.append('rect')
			.attr('x', margin.left)
			.attr('y', margin.top)
			.attr('width', width - margin.left - margin.right)
			.attr('height', height - margin.top - margin.bottom);

		// Create plot group with clipping
		const plotGroup = svg.append('g')
			.attr('class', 'plot-group')
			.attr('clip-path', 'url(#plot-clip)');

		// Add mouse interaction overlay
		const overlay = svg.append('rect')
			.attr('class', 'mouse-overlay')
			.attr('x', margin.left)
			.attr('y', margin.top)
			.attr('width', width - margin.left - margin.right)
			.attr('height', height - margin.top - margin.bottom)
			.attr('fill', 'none')
			.attr('pointer-events', 'all')
			.style('cursor', 'crosshair');

		// Add crosshair group (initially hidden)
		const crosshair = svg.append('g')
			.attr('class', 'crosshair')
			.style('display', 'none');

		crosshair.append('line')
			.attr('class', 'crosshair-x')
			.attr('y1', margin.top)
			.attr('y2', height - margin.bottom)
			.attr('stroke', theme === 'dark' ? '#ff6b6b' : '#e74c3c')
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '3,3');

		crosshair.append('line')
			.attr('class', 'crosshair-y')
			.attr('x1', margin.left)
			.attr('x2', width - margin.right)
			.attr('stroke', theme === 'dark' ? '#ff6b6b' : '#e74c3c')
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '3,3');

		// Add cursor value display
		const cursorInfo = svg.append('g')
			.attr('class', 'cursor-info')
			.style('display', 'none');

		cursorInfo.append('rect')
			.attr('class', 'cursor-info-bg')
			.attr('width', 120)
			.attr('height', 40)
			.attr('fill', theme === 'dark' ? '#2d2d2d' : '#f8f9fa')
			.attr('stroke', theme === 'dark' ? '#444' : '#ddd')
			.attr('stroke-width', 1)
			.attr('rx', 4);

		cursorInfo.append('text')
			.attr('class', 'cursor-x-text')
			.attr('x', 8)
			.attr('y', 15)
			.attr('fill', theme === 'dark' ? '#fff' : '#000')
			.style('font-size', '11px')
			.style('font-family', 'monospace');

		cursorInfo.append('text')
			.attr('class', 'cursor-y-text')
			.attr('x', 8)
			.attr('y', 30)
			.attr('fill', theme === 'dark' ? '#fff' : '#000')
			.style('font-size', '11px')
			.style('font-family', 'monospace');

		// Setup zoom behavior
		zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.1, 50])
			.extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
			.on('zoom', handleZoom);

		svg.call(zoomBehavior);

		// Mouse event handlers
		overlay
			.on('mouseover', handleMouseOver)
			.on('mousemove', handleMouseMove)
			.on('mouseout', handleMouseOut)
			.on('click', handleClick)
			.on('mousedown', handleMouseDown)
			.on('mouseup', handleMouseUp);

		updatePlot();
	}

	function updatePlot() {
		if (!svg || !resultArray || resultArray.results.length === 0) {
			// If no data, ensure all measurement visuals are also cleared
			if (svg) {
				svg.selectAll('.persistent-measurement-group').remove();
				svg.selectAll('.temporary-measurement-marker').remove();
			}
			return;
		}

		const visibleData = displayData.filter(dd => dd.visible);
		if (visibleData.length === 0) {
			// If no visible signals, also clear measurements
			if (svg) {
				svg.selectAll('.persistent-measurement-group').remove();
				svg.selectAll('.temporary-measurement-marker').remove();
			}
			return;
		}

		// Clear previous plot elements AND all measurement elements
		svg.selectAll('.plot-element').remove();
		svg.selectAll('.persistent-measurement-group').remove();
		svg.selectAll('.temporary-measurement-marker').remove();

		const result = resultArray.results[0];
		if (!result || !result.variableNames || result.variableNames.length === 0) return;

		// Find time/frequency variable (usually first one)
		const xVariableName = result.variableNames[0];
		const xData = getVariableData(result, xVariableName);
		
		if (!xData || xData.length === 0) {
			console.log('D3PlotCanvas - No X data found for variable:', xVariableName);
			return;
		}

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

		// Set up scales with original domains
		originalXDomain = d3.extent(xData.map(d => getValueAsNumber(d))) as [number, number];
		originalYDomain = d3.extent(allYValues) as [number, number];

		// Apply current transform if it exists
		const transformedXDomain = currentTransform.rescaleX(d3.scaleLinear().domain(originalXDomain).range([margin.left, width - margin.right])).domain();
		const transformedYDomain = currentTransform.rescaleY(d3.scaleLinear().domain(originalYDomain).range([height - margin.bottom, margin.top])).domain();

		xScale = d3.scaleLinear()
			.domain(transformedXDomain)
			.range([margin.left, width - margin.right]);

		yScale = d3.scaleLinear()
			.domain(transformedYDomain)
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

		// Reset signal data array for snapping
		signalData = [];

		// Plot lines for each visible signal
		visibleData.forEach((dd, index) => {
			const yData = getVariableData(result, dd.name);
			
			if (!yData || yData.length !== xData.length) {
				console.log(`D3PlotCanvas - Data length mismatch for ${dd.name}:`, yData?.length, 'vs', xData.length);
				return;
			}

			const color = dd.color ? 
				`rgb(${Math.round(dd.color.r * 255)}, ${Math.round(dd.color.g * 255)}, ${Math.round(dd.color.b * 255)})` : 
				d3.schemeCategory10[index % 10];

			// Store signal data for snapping
			signalData.push({
				name: dd.name,
				data: xData.map((x, i) => ({ 
					x: getValueAsNumber(x), 
					y: getValueAsNumber(yData[i]) 
				})),
				color
			});

			// Add the line
			svg.select('.plot-group').append('path')
				.datum(yData)
				.attr('class', 'plot-element line')
				.attr('fill', 'none')
				.attr('stroke', color)
				.attr('stroke-width', 1.5)
				.attr('d', line);

			// Add legend entry
			addLegendEntry(dd.name, color, index);
		});

		// Redraw persistent measurements
		persistentMeasurements.forEach(measurement => {
			drawPersistentMeasurement(measurement.point1, measurement.point2);
		});

		// Draw temporary marker if one point is selected in measurement mode
		if (measurementMode && measurementPoints.length === 1 && xScale && yScale) {
			const tempPoint = measurementPoints[0];
			// Ensure xScale and yScale are available before calling them
			if (xScale && yScale) {
				const markerX = xScale(tempPoint.x);
				const markerY = yScale(tempPoint.y);
				addTemporaryMeasurementMarker(markerX, markerY, 1, tempPoint.signal);
			}
		}
	}

	function addGridLines(xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) {
		if (!showGrid) return;
		
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
		const newWidth = Math.max(400, Math.floor(rect.width));
		const newHeight = Math.max(300, Math.floor(rect.height));
		
		if (Math.abs(newWidth - width) > 5 || Math.abs(newHeight - height) > 5) {
			width = newWidth;
			height = newHeight;
			
			if (svg) {
				svg.attr('width', width).attr('height', height);
				
				// Update background
				svg.select('rect').attr('width', width).attr('height', height);
				
				// Update clip path
				svg.select('#plot-clip rect')
					.attr('width', width - margin.left - margin.right)
					.attr('height', height - margin.top - margin.bottom);
				
				// Update mouse overlay
				svg.select('.mouse-overlay')
					.attr('width', width - margin.left - margin.right)
					.attr('height', height - margin.top - margin.bottom);
				
				// Update crosshair lines
				svg.select('.crosshair-x')
					.attr('y1', margin.top)
					.attr('y2', height - margin.bottom);
				
				svg.select('.crosshair-y')
					.attr('x1', margin.left)
					.attr('x2', width - margin.right);
				
				// Update zoom extent
				if (zoomBehavior) {
					zoomBehavior.extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);
				}
				
				updatePlot();
			}
		}
	}

	function handleZoom(event: any) {
		currentTransform = event.transform;
		updatePlot();
	}

	function handleMouseOver() {
		isMouseOverPlot = true;
		if (showCrosshair) {
			svg.select('.crosshair').style('display', 'block');
			svg.select('.cursor-info').style('display', 'block');
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isMouseOverPlot) return;
		
		// Store the latest event for throttled updates
		lastMouseEvent = event;
		
		// Immediately update cursor position for responsiveness
		if (xScale && yScale && svg) {
			const [mouseX, mouseY] = d3.pointer(event, svg.node());
			const plotX = Math.max(margin.left, Math.min(width - margin.right, mouseX));
			const plotY = Math.max(margin.top, Math.min(height - margin.bottom, mouseY));
			
			cursorValues = {
				x: xScale.invert(plotX),
				y: yScale.invert(plotY)
			};
		}
		
		// Throttle the visual updates for performance
		if (animationFrameId) {
			return; // Skip if we already have a pending update
		}
		
		animationFrameId = requestAnimationFrame(() => {
			updateCursor(lastMouseEvent);
			animationFrameId = 0; // Reset the frame ID
		});
	}

	function updateCursor(event: MouseEvent | null) {
		if (!event || !xScale || !yScale || !svg) return;

		const [mouseX, mouseY] = d3.pointer(event, svg.node());
		
		// Constrain to plot area
		const plotX = Math.max(margin.left, Math.min(width - margin.right, mouseX));
		const plotY = Math.max(margin.top, Math.min(height - margin.bottom, mouseY));

		cursorPosition = { x: plotX, y: plotY };
		cursorValues = {
			x: xScale.invert(plotX),
			y: yScale.invert(plotY)
		};

		// Find nearest signal point for status bar display
		if (lockedSignal) {
			// If a signal is locked, check if it's still marked for cursor measurement
			const lockedDisplayData = displayData.find(dd => dd.name === lockedSignal);
			if (lockedDisplayData?.measureWithCursor) {
				const lockedSignalData = signalData.find(s => s.name === lockedSignal);
				if (lockedSignalData && lockedSignalData.data.length > 0) {
				const data = lockedSignalData.data;
				let closestIndex = 0;
				let minDistance = Infinity;
				
				// Binary search for efficiency
				let left = 0;
				let right = data.length - 1;
				
				while (left <= right) {
					const mid = Math.floor((left + right) / 2);
					const distance = Math.abs(data[mid].x - cursorValues.x);
					
					if (distance < minDistance) {
						minDistance = distance;
						closestIndex = mid;
					}
					
					if (data[mid].x < cursorValues.x) {
						left = mid + 1;
					} else {
						right = mid - 1;
					}
				}
				
				// Check adjacent points
				for (let i = Math.max(0, closestIndex - 1); i <= Math.min(data.length - 1, closestIndex + 1); i++) {
					const distance = Math.abs(data[i].x - cursorValues.x);
					if (distance < minDistance) {
						minDistance = distance;
						closestIndex = i;
					}
				}
				
				const closestPoint = data[closestIndex];
				nearestSignalValue = {
					signal: lockedSignal,
					value: closestPoint.y,
					x: closestPoint.x
				};				} else {
					nearestSignalValue = null;
				}
			} else {
				// Locked signal is no longer marked for measurement, unlock it
				lockedSignal = null;
				nearestSignalValue = findNearestSignalPoint(cursorValues.x);
			}
		} else {
			// Default behavior: find nearest signal across all signals marked for measurement
			nearestSignalValue = findNearestSignalPoint(cursorValues.x);
		}

		if (!showCrosshair) return;

		// Update crosshair position
		svg.select('.crosshair-x')
			.attr('x1', plotX)
			.attr('x2', plotX);

		svg.select('.crosshair-y')
			.attr('y1', plotY)
			.attr('y2', plotY);

		// Update cursor info position and values
		const infoX = plotX + 10 > width - 130 ? plotX - 130 : plotX + 10;
		const infoY = plotY - 10 < 40 ? plotY + 10 : plotY - 50;

		svg.select('.cursor-info')
			.attr('transform', `translate(${infoX}, ${infoY})`);

		svg.select('.cursor-x-text')
			.text(`X: ${formatValue(cursorValues.x)}`);

		svg.select('.cursor-y-text')
			.text(`Y: ${formatValue(cursorValues.y)}`);
	}

	function handleMouseOut() {
		isMouseOverPlot = false;
		if (!lockedSignal) {
			nearestSignalValue = null; // Only clear if not locked to a signal
		}
		
		// Cancel any pending animation frame
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		
		if (svg) {
			svg.select('.crosshair').style('display', 'none');
			svg.select('.cursor-info').style('display', 'none');
		}
	}

	function handleClick(event: MouseEvent) {
		if (!xScale || !yScale || !svg) return;

		const [mouseX, mouseY] = d3.pointer(event, svg.node());
		const plotX = Math.max(margin.left, Math.min(width - margin.right, mouseX));
		const plotY = Math.max(margin.top, Math.min(height - margin.bottom, mouseY));

		const rawPoint = {
			x: xScale.invert(plotX),
			y: yScale.invert(plotY)
		};

		// Check if we're in measurement mode
		if (measurementMode) {
			// Snap to nearest signal point in measurement mode
			const snappedPoint = snapToNearestSignal(rawPoint.x, rawPoint.y);

			const newMeasurementPoints = [...measurementPoints, snappedPoint];

			if (newMeasurementPoints.length === 2) {
				persistentMeasurements = [...persistentMeasurements, {
					point1: newMeasurementPoints[0],
					point2: newMeasurementPoints[1]
				}];
				measurementPoints = []; // Reset for next measurement
			} else {
				measurementPoints = newMeasurementPoints; // Store the first point
			}
		} else {
			// Not in measurement mode - handle signal locking for cursor
			const nearest = findNearestSignalPoint(rawPoint.x);
			if (nearest) {
				if (lockedSignal === nearest.signal) {
					// Clicking the same signal unlocks it
					lockedSignal = null;
				} else {
					// Lock to the clicked signal
					lockedSignal = nearest.signal;
				}
			}
		}
		// updatePlot() will be called by afterUpdate due to state changes
	}

	// Old addMeasurement function is removed. Its logic is now in drawPersistentMeasurement.
	// function addMeasurement(point1: {x: number, y: number}, point2: {x: number, y: number}) { ... }

	// Old addMeasurementMarker is refactored into addTemporaryMeasurementMarker 
	// and parts into drawPersistentMeasurement.
	// function addMeasurementMarker(x: number, y: number, index: number, signal?: string) { ... }

	function addTemporaryMeasurementMarker(screenX: number, screenY: number, index: number, signal?: string) {
		if (!svg) return;
		const group = svg.append('g').attr('class', 'temporary-measurement-marker');

		group.append('circle')
			.attr('cx', screenX)
			.attr('cy', screenY)
			.attr('r', 5) // Slightly larger or different style for temporary
			.attr('fill', theme === 'dark' ? '#00bcd4' : '#0097a7') // Cyan-ish color
			.attr('stroke', theme === 'dark' ? '#1a1a1a' : '#ffffff')
			.attr('stroke-width', 1.5);

		group.append('text')
			.attr('x', screenX + 10)
			.attr('y', screenY - 10)
			.attr('fill', theme === 'dark' ? '#00bcd4' : '#0097a7')
			.style('font-size', '12px')
			.style('font-weight', 'bold')
			.text(index.toString());

		if (signal) {
			group.append('text')
				.attr('x', screenX + 10)
				.attr('y', screenY + 18)
				.attr('fill', theme === 'dark' ? '#00bcd4' : '#0097a7')
				.style('font-size', '10px')
				.style('font-style', 'italic')
				.text(signal);
		}
	}

	function drawPersistentMeasurement(
		point1: { x: number, y: number, signal?: string }, 
		point2: { x: number, y: number, signal?: string }
	) {
		if (!xScale || !yScale || !svg) return;

		const p1_screen = { x: xScale(point1.x), y: yScale(point1.y) };
		const p2_screen = { x: xScale(point2.x), y: yScale(point2.y) };

		const group = svg.append('g').attr('class', 'persistent-measurement-group');

		// Add measurement line
		group.append('line')
			.attr('class', 'persistent-measurement-line')
			.attr('x1', p1_screen.x)
			.attr('y1', p1_screen.y)
			.attr('x2', p2_screen.x)
			.attr('y2', p2_screen.y)
			.attr('stroke', theme === 'dark' ? '#ffd700' : '#ff8c00') // Gold/Orange color
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '5,5');

		// Markers for point1 and point2
		group.append('circle')
			.attr('class', 'persistent-measurement-marker-point')
			.attr('cx', p1_screen.x)
			.attr('cy', p1_screen.y)
			.attr('r', 4)
			.attr('fill', theme === 'dark' ? '#ffd700' : '#ff8c00');

		group.append('circle')
			.attr('class', 'persistent-measurement-marker-point')
			.attr('cx', p2_screen.x)
			.attr('cy', p2_screen.y)
			.attr('r', 4)
			.attr('fill', theme === 'dark' ? '#ffd700' : '#ff8c00');
		// Add measurement text
		const deltaX = Math.abs(point2.x - point1.x);
		const deltaY = Math.abs(point2.y - point1.y);
		const midX_screen = (p1_screen.x + p2_screen.x) / 2;
		const midY_screen = (p1_screen.y + p2_screen.y) / 2;

		// Adjust text anchor position to be slightly above the line and centered
		// Ensure text does not go off-screen (basic check)
		let textPosX = midX_screen;
		let textPosY = midY_screen - 10; // Default above the line

		const textGroup = group.append('g')
			.attr('class', 'persistent-measurement-text-group')
			.attr('transform', `translate(${textPosX}, ${textPosY})`);

		const hasSignalNames = point1.signal && point2.signal;
		const rectHeight = hasSignalNames ? 55 : 35; // Adjusted height
		const rectWidth = 130; // Adjusted width for potentially longer signal names

		textGroup.append('rect')
			.attr('x', -rectWidth / 2)
			.attr('y', -18) // Base y for the top of the rect content area
			.attr('width', rectWidth)
			.attr('height', rectHeight)
			.attr('fill', theme === 'dark' ? 'rgba(45, 45, 45, 0.85)' : 'rgba(248, 249, 250, 0.85)')
			.attr('stroke', theme === 'dark' ? '#ffd700' : '#ff8c00')
			.attr('stroke-width', 1)
			.attr('rx', 4);

		let yTextOffset = hasSignalNames ? -10 : 0; // Initial y for text inside the box (relative to textGroup origin)

		textGroup.append('text')
			.attr('text-anchor', 'middle')
			.attr('y', yTextOffset)
			.attr('fill', theme === 'dark' ? '#ffd700' : '#ff8c00')
			.style('font-size', '10px')
			.style('font-family', 'monospace')
			.text(`ΔX: ${formatValue(deltaX)}`);
		
		yTextOffset += 14; // Line height + spacing

		textGroup.append('text')
			.attr('text-anchor', 'middle')
			.attr('y', yTextOffset)
			.attr('fill', theme === 'dark' ? '#ffd700' : '#ff8c00')
			.style('font-size', '10px')
			.style('font-family', 'monospace')
			.text(`ΔY: ${formatValue(deltaY)}`);

		if (hasSignalNames) {
			yTextOffset += 14; // Line height + spacing
			textGroup.append('text')
				.attr('text-anchor', 'middle')
				.attr('y', yTextOffset)
				.attr('fill', theme === 'dark' ? '#cccccc' : '#333333')
				.style('font-size', '9px')
				.style('font-family', 'monospace')
				.text(`(${point1.signal} → ${point2.signal})`);
		}
	}

	function clearMeasurements() {
		measurementPoints = [];
		persistentMeasurements = [];
		// afterUpdate will call updatePlot, which will clear the SVG elements
	}

	function formatValue(value: number): string {
		if (Math.abs(value) >= 1e6) {
			return (value / 1e6).toFixed(2) + 'M';
		} else if (Math.abs(value) >= 1e3) {
			return (value / 1e3).toFixed(2) + 'k';
		} else if (Math.abs(value) >= 1) {
			return value.toFixed(3);
		} else if (Math.abs(value) >= 1e-3) {
			return (value * 1e3).toFixed(2) + 'm';
		} else if (Math.abs(value) >= 1e-6) {
			return (value * 1e6).toFixed(2) + 'µ';
		} else if (Math.abs(value) >= 1e-9) {
			return (value * 1e9).toFixed(2) + 'n';
		} else {
			return value.toExponential(2);
		}
	}

	function findNearestSignalPoint(targetX: number): { signal: string, value: number, x: number } | null {
		if (!signalData || signalData.length === 0) return null;
		
		let nearest: { signal: string, value: number, x: number, distance: number } | null = null;
		
		signalData.forEach(signal => {
			// Only consider signals that are marked for cursor measurement
			const signalDisplayData = displayData.find(dd => dd.name === signal.name);
			if (!signalDisplayData?.measureWithCursor) return;
			
			// Find closest x value in this signal using binary search for better performance
			const data = signal.data;
			if (data.length === 0) return;
			
			// Binary search for closest x value
			let left = 0;
			let right = data.length - 1;
			let closestIndex = 0;
			let minDistance = Infinity;
			
			while (left <= right) {
				const mid = Math.floor((left + right) / 2);
				const distance = Math.abs(data[mid].x - targetX);
				
				if (distance < minDistance) {
					minDistance = distance;
					closestIndex = mid;
				}
				
				if (data[mid].x < targetX) {
					left = mid + 1;
				} else {
					right = mid - 1;
				}
			}
			
			// Check adjacent points for better accuracy
			for (let i = Math.max(0, closestIndex - 1); i <= Math.min(data.length - 1, closestIndex + 1); i++) {
				const distance = Math.abs(data[i].x - targetX);
				if (distance < minDistance) {
					minDistance = distance;
					closestIndex = i;
				}
			}
			
			const closestPoint = data[closestIndex];
			if (!nearest || minDistance < nearest.distance) {
				nearest = {
					signal: signal.name,
					value: closestPoint.y,
					x: closestPoint.x,
					distance: minDistance
				};
			}
		});
		
		return nearest ? { signal: nearest.signal, value: nearest.value, x: nearest.x } : null;
	}

	function snapToNearestSignal(x: number, y: number): { x: number, y: number, signal?: string } {
		if (!measurementMode || !signalData) {
			return { x, y };
		}
		
		// In measurement mode, we want to snap to any signal that's marked for cursor measurement
		const nearest = findNearestSignalPoint(x);
		if (nearest) {
			return { x: nearest.x, y: nearest.value, signal: nearest.signal };
		}
		
		return { x, y };
	}

	function resetZoom() {
		if (svg && zoomBehavior) {
			svg.transition()
				.duration(750)
				.call(zoomBehavior.transform, d3.zoomIdentity);
		}
	}
</script>

<svelte:window on:resize={handleResize} on:keydown={handleKeydown} />

<div class="d3-plot-container">
	<div class="plot-header">
		<h3>Simulation Results</h3>
		<div class="plot-controls">
			<button class="control-btn" on:click={resetZoom} title="Reset Zoom">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 3v6h6"/>
					<path d="M21 21v-6h-6"/>
					<path d="M21 3L9 15"/>
					<path d="M3 21L15 9"/>
				</svg>
			</button>
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button class="control-btn" class:active={showCrosshair} on:click={() => showCrosshair = !showCrosshair} title="Toggle Crosshair">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/>
					<path d="M12 2v20"/>
					<path d="M2 12h20"/>
				</svg>
			</button>
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button class="control-btn" class:active={showGrid} on:click={() => showGrid = !showGrid} title="Toggle Grid">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect width="18" height="18" x="3" y="3" rx="2"/>
					<path d="M9 3v18"/>
					<path d="M15 3v18"/>
					<path d="M3 9h18"/>
					<path d="M3 15h18"/>
				</svg>
			</button>
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button class="control-btn" class:active={measurementMode} on:click={() => measurementMode = !measurementMode} title="Measurement Mode">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="m3 17 6-6 4 4 8-8"/>
					<path d="m14 7 3-3 3 3"/>
					<path d="m17 4v6"/>
				</svg>
			</button>
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button class="control-btn" on:click={clearMeasurements} title="Clear Measurements">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 6h18"/>
					<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
					<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
				</svg>
			</button>
		</div>
		<div class="plot-info">
			{#if resultArray && resultArray.results.length > 0}
				<span class="info-text">
					{resultArray.results[0]?.variableNames?.length || 0} variables
				</span>
			{/if}
			{#if measurementMode}
				<span class="mode-indicator measurement-mode">
					MEASURE {measurementPoints.length > 0 ? `(${measurementPoints.length}/2)` : ''}
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
	
	<!-- Status Bar -->
	<div class="status-bar">
		<div class="status-left">
			{#if isMouseOverPlot}
				<span class="status-item">
					<span class="status-label">Cursor:</span>
					<span class="status-value">X: {formatValue(cursorValues.x)}</span>
					<span class="status-value">Y: {formatValue(cursorValues.y)}</span>
				</span>
				{#if nearestSignalValue}
					<span class="status-item signal-info">
						<span class="status-label">Signal:</span>
						<span class="status-signal">{nearestSignalValue.signal}</span>
						<span class="status-value">{formatValue(nearestSignalValue.value)}</span>
					</span>
				{/if}
			{:else}
				<span class="status-item ready">Ready</span>
			{/if}
		</div>
		<div class="status-right">
			{#if measurementMode && measurementPoints.length > 0}
				<span class="status-item measurement-info">
					<span class="status-label">Measurement:</span>
					<span class="status-value">{measurementPoints.length}/2 points</span>
				</span>
			{/if}
			{#if resultArray && resultArray.results.length > 0}
				<span class="status-item">
					<span class="status-value">{displayData.filter(dd => dd.visible).length} visible</span>
					<span class="status-value">{resultArray.results[0]?.variableNames?.length || 0} total</span>
				</span>
			{/if}
		</div>
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
		display: grid;
		grid-template-columns: 1fr auto 200px;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		border-radius: 4px 4px 0 0;
		min-height: 60px;
	}

	.plot-header h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		justify-self: start;
	}

	.plot-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-self: center;
	}

	.control-btn {
		padding: 0.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-btn:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border-color: var(--accent-color);
	}

	.control-btn.active {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}

	.plot-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: flex-end;
		justify-self: end;
		min-width: 180px;
	}

	.info-text {
		font-size: 0.75rem;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.mode-indicator {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		white-space: nowrap;
	}

	.measurement-mode {
		background: #ffd700;
		color: #000;
	}

	.plot-content {
		flex: 1;
		position: relative;
		overflow: hidden;
		min-height: 0;
	}

	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-color);
		border-radius: 0 0 4px 4px;
		min-height: 40px;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.status-left,
	.status-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
	}

	.status-label {
		font-weight: 600;
		color: var(--text-primary);
	}

	.status-value {
		font-family: monospace;
		color: var(--accent-color);
		background: var(--bg-primary);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		border: 1px solid var(--border-color);
	}

	.status-signal {
		font-family: monospace;
		font-weight: 600;
		color: var(--text-primary);
		background: var(--bg-tertiary);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		border: 1px solid var(--border-color);
	}

	.signal-info {
		background: var(--bg-primary);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		border: 1px solid var(--border-color);
	}

	.measurement-info {
		background: #ffd700;
		color: #000;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
	}

	.measurement-info .status-label,
	.measurement-info .status-value {
		color: #000;
		background: transparent;
		border: none;
		padding: 0;
	}

	.ready {
		color: var(--text-tertiary);
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
		display: block;
		background: transparent;
	}

	/* D3 styling */
	:global(.plot-element.line) {
		stroke-linejoin: round;
		stroke-linecap: round;
		will-change: d;
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

	:global(.crosshair) {
		pointer-events: none;
	}

	:global(.cursor-info) {
		pointer-events: none;
	}
</style>
