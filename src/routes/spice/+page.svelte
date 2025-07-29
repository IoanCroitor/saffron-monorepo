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
	import { geminiAPI, type NetlistCorrectionResponse } from '$lib/services/gemini-api';
	// shadcn-svelte components
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import { 
		Copy, 
		Download, 
		Trash2, 
		CircuitBoard,
		FileText,
		XCircle,
		Play,
		Square,
		Settings,
		Maximize2,
		Minimize2,
		Ruler,
		Eye,
		GripVertical,
		Star
	} from '@lucide/svelte';

	// Props from server
	export let data;



	function exportResults(format: 'csv' | 'json', filename: string) {
		if (!resultArray || !resultArray.results.length) return;
		
		const results = resultArray.results[0];
		let content: string;
		let mimeType: string;
		let extension: string;
		
		if (format === 'csv') {
			content = convertToCSV(results);
			mimeType = 'text/csv';
			extension = 'csv';
		} else {
			content = JSON.stringify(results, null, 2);
			mimeType = 'application/json';
			extension = 'json';
		}
		
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${filename}.${extension}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function convertToCSV(results: any): string {
		if (!results.variableNames || !results.data) return '';
		
		const headers = results.variableNames.join(',');
		const rows: string[] = [];
		
		// Get the maximum length of any data array
		const maxLength = Math.max(...results.data.map((d: any) => d.values?.length || 0));
		
		for (let i = 0; i < maxLength; i++) {
			const row = results.data.map((d: any) => {
				const value = d.values?.[i];
				if (typeof value === 'object' && value !== null) {
					// Handle complex numbers
					return value.real !== undefined ? value.real : JSON.stringify(value);
				}
				return value || '';
			});
			rows.push(row.join(','));
		}
		
		return [headers, ...rows].join('\n');
	}

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
i1 0 tank 0 pulse(0 1m 0 1p 1p 5p 10p)
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
.tran 0.1p 20p uic
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
i1 0 n1 0 pulse(0 1m 0 0.1p 0.1p 1p 20p)
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
vin in 0 sin(0 0.1 1g 0 0)
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
.tran 0.01p 5p uic
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
i1 gate 0 0 pulse(0 100u 0 0.1p 0.1p 1p 2p)
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
l1 n1 n2 18.0
c1 n2 0 0.1
c2 vin n2 0.01
m1 n2 n2 n3 n3 N90 W=200.0u L=0.09u
m2 n3 n2 0 0 N90 W=100.0u L=0.09u
r2 n3 0 500.0
vin vin 0 pulse(0 2.5 0 0.1 0.1 12 25)
vdd vdd 0 1.8
.tran 0.05 45 uic
.end`
		},
		{
			name: 'Parametric Oscillator (Varactor Tuned)',
			category: 'Advanced Circuits',
			description: 'Voltage-controlled oscillator using varactor',
			value: 'parametric-oscillator',
			code: `PARAMETRIC OSCILLATOR (Varactor Tuned)
.include modelcard.CMOS90
l1 osc n1 8.5n
m1 n1 vtune n2 0 N90 W=50.0u L=0.09u
c1 n2 0 0.05p
r1 osc 0 180.0
vpump vtune 0 sin(0 0.8 2meg 0 0)
m2 vdd gate osc osc P90 W=180.0u L=0.09u
m3 osc gate 0 0 N90 W=90.0u L=0.09u
r2 vdd gate 1.2k
vdd vdd 0 1.8
.tran 0.02n 40n uic
.end`
		}
	];

	// Initialize variables from server data or defaults
	let netlistCode = data.netlist || `Basic RLC circuit
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
	let threads = data.threads || navigator?.hardwareConcurrency || 4;
	let theme: 'light' | 'dark' = data.theme || 'dark';
	let simArray: SimArray;
	let isInitialized = false;
	let plotType: 'webgl' | 'd3' = data.plotType || 'd3';
	
	// UI state from server data
	let showGrid = data.showGrid ?? true;
	let showCrosshair = data.showCrosshair ?? true;
	let measurementMode = data.measurementMode ?? false;
	let lockedSignal = data.lockedSignal ?? null;
	let autoRun = data.autoRun ?? false;
	let readOnly = data.readOnly ?? false;

	// UI state
	let selectedExample = '';
	let exampleSelectorOpen = false;
	let isFullscreen = false;

	// Netlist correction state
	let isCorrecting = false;
	let correctionResult: NetlistCorrectionResponse | null = null;
	let showCorrectionDialog = false;

	// Resizable layout state
	let editorWidth = 25; // percentage
	let sidebarWidth = 20; // percentage
	let isDragging = false;
	let dragStartX = 0;
	let dragStartWidths = { editor: 0, sidebar: 0 };

	// Tab state for right sidebar
	let activeSidebarTab = 'signals';
	
	// Force D3.js only
	$: plotType = 'd3';

	// Signal control helper functions
	let availableSignals: string[] = [];
	
	// Extract available signals from result array
	$: {
		if (resultArray && resultArray.results && resultArray.results.length > 0) {
			const firstResult = resultArray.results[0];
			if (firstResult && firstResult.variableNames) {
				availableSignals = firstResult.variableNames.filter(name => name !== 'x');
			}
		}
	}

	function toggleSignalVisibility(signalName: string) {
		const existingIndex = displayData.findIndex(item => item.name === signalName);
		
		if (existingIndex >= 0) {
			// Remove signal from display
			displayData = displayData.filter(item => item.name !== signalName);
		} else {
			// Add signal to display with auto-assigned color
			const newDisplayItem: DisplayDataType = {
				name: signalName,
				visible: true,
				color: getNextColor(),
				index: displayData.length,
				measureWithCursor: false
			};
			displayData = [...displayData, newDisplayItem];
		}
		
		onDisplayDataChange(displayData);
	}

	function toggleCursorMeasurement(signalName: string) {
		displayData = displayData.map(item => 
			item.name === signalName 
				? { ...item, measureWithCursor: !item.measureWithCursor }
				: item
		);
		onDisplayDataChange(displayData);
	}

	function getNextColor() {
		const colorPalette = [
			{ r: 0.31, g: 0.78, b: 0.47, a: 1.0 }, // Green
			{ r: 0.20, g: 0.60, b: 0.86, a: 1.0 }, // Blue  
			{ r: 0.95, g: 0.39, b: 0.27, a: 1.0 }, // Red
			{ r: 0.94, g: 0.77, b: 0.06, a: 1.0 }, // Yellow
			{ r: 0.61, g: 0.35, b: 0.71, a: 1.0 }, // Purple
			{ r: 0.90, g: 0.49, b: 0.13, a: 1.0 }, // Orange
			{ r: 0.33, g: 0.68, b: 0.75, a: 1.0 }, // Teal
			{ r: 0.84, g: 0.15, b: 0.56, a: 1.0 }, // Pink
		];
		return colorPalette[displayData.length % colorPalette.length];
	}

	function isSignalVisible(signalName: string): boolean {
		return displayData.some(item => item.name === signalName && item.visible);
	}

	function isSignalMeasured(signalName: string): boolean {
		return displayData.some(item => item.name === signalName && item.measureWithCursor);
	}

	function getSignalDisplayData(signalName: string): DisplayDataType | undefined {
		return displayData.find(item => item.name === signalName);
	}

	function colorToHex(color: any): string {
		const r = Math.round(color.r * 255);
		const g = Math.round(color.g * 255);
		const b = Math.round(color.b * 255);
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}

	function toggleAllSignals() {
		if (displayData.length === availableSignals.length) {
			// Hide all
			displayData = [];
		} else {
			// Show all
			displayData = availableSignals.map((signal, index) => ({
				name: signal,
				visible: true,
				color: getNextColor(),
				index,
				measureWithCursor: false
			}));
		}
		onDisplayDataChange(displayData);
	}

	function toggleAllMeasurements() {
		const visibleSignals = displayData.filter(item => item.visible);
		const allMeasured = visibleSignals.every(item => item.measureWithCursor);
		
		displayData = displayData.map(item => 
			item.visible 
				? { ...item, measureWithCursor: !allMeasured }
				: item
		);
		onDisplayDataChange(displayData);
	}

	$: visibleSignals = displayData.filter(item => item.visible);
	$: measuredSignals = displayData.filter(item => item.measureWithCursor);

	onMount(async () => {
		console.log('SPICE page mounted, browser:', browser);
		if (browser) {
			console.log('Creating SimArray...');
			simArray = new SimArray();
			
			// Initialize simulation workers
			try {
				console.log('Initializing SimArray with threads:', threads);
				await simArray.init(threads);
				isInitialized = true;
				console.log('SimArray initialized successfully');
			} catch (error) {
				console.error('Failed to initialize SimArray:', error);
				errorMessage = `Failed to initialize simulation engine: ${error instanceof Error ? error.message : 'Unknown error'}`;
				isInitialized = false;
			}
			
			// Handle example selection from URL
			if (data.example) {
				const selectedExample = examples.find(ex => ex.value === data.example);
				if (selectedExample) {
					netlistCode = selectedExample.code;
					console.log(`Loaded example: ${selectedExample.name}`);
				}
			}
			
			// Theme detection (only if not set by URL)
			if (!data.theme) {
				// Check current theme from document class
				const isDark = document.documentElement.classList.contains('dark');
				theme = isDark ? 'dark' : 'light';
				
				// Also listen for system theme changes
				const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
				mediaQuery.addEventListener('change', (e) => {
					const newTheme = e.matches ? 'dark' : 'light';
					if (newTheme !== theme) {
						console.log('System theme changed from', theme, 'to', newTheme);
						theme = newTheme;
					}
				});
			}

			// Listen for manual theme changes from mode-watcher
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
						const target = mutation.target as HTMLElement;
						const newTheme = target.classList.contains('dark') ? 'dark' : 'light';
						if (newTheme !== theme) {
							console.log('Theme changed from', theme, 'to', newTheme);
							theme = newTheme;
						}
					}
				});
			});

			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['class']
			});
			
			// Auto-run simulation if requested
			if (autoRun && isInitialized && netlistCode.trim()) {
				setTimeout(() => runSimulation(), 100);
			}
		}
	});

	async function runSimulation() {
		console.log('runSimulation called', { simArray: !!simArray, isInitialized, isRunning });
		if (!simArray || !isInitialized || isRunning) {
			console.log('Simulation blocked:', { simArray: !!simArray, isInitialized, isRunning });
			return;
		}
		
		isRunning = true;
		errorMessage = '';
		resultArray = undefined;
		displayData = [];

		try {
			// Apply simulation parameters from URL if provided
			let modifiedNetlist = netlistCode;
			
			// Modify time step if specified
			if (data.timeStep) {
				modifiedNetlist = modifiedNetlist.replace(/\.tran\s+[\d.]+/, `.tran ${data.timeStep}`);
			}
			
			// Modify end time if specified
			if (data.endTime) {
				modifiedNetlist = modifiedNetlist.replace(/\.tran\s+[\d.]+\s+[\d.]+/, `.tran ${data.timeStep || '0.1'} ${data.endTime}`);
			}
			
			// Modify simulation type if specified
			if (data.simulationType && data.simulationType !== 'transient') {
				// Replace .tran with .ac or .dc based on type
				if (data.simulationType === 'ac') {
					modifiedNetlist = modifiedNetlist.replace(/\.tran\s+[\d.]+\s+[\d.]+/, '.ac dec 10 1 1meg');
				} else if (data.simulationType === 'dc') {
					modifiedNetlist = modifiedNetlist.replace(/\.tran\s+[\d.]+\s+[\d.]+/, '.dc vin 0 5 0.1');
				}
			}
			
			const parser = getParser(modifiedNetlist);
			console.log('Parser result:', parser);

			if (parser.sweep) {
				await simArray.runSweep(modifiedNetlist, threads);
			} else {
				await simArray.run(modifiedNetlist);
			}

			const results = simArray.getResults();
			
			if (results && results.results.length > 0) {
				resultArray = results;
				displayData = makeDD(results.results[0], theme);
				
				// Apply signal visibility settings from URL parameters
				if (data.visibleSignals.length > 0 || data.hiddenSignals.length > 0) {
					displayData = displayData.map(signal => {
						// If specific signals are marked as visible, hide all others
						if (data.visibleSignals.length > 0) {
							signal.visible = data.visibleSignals.includes(signal.name);
						}
						// If specific signals are marked as hidden, hide them
						if (data.hiddenSignals.length > 0) {
							if (data.hiddenSignals.includes(signal.name)) {
								signal.visible = false;
							}
						}
						return signal;
					});
				}
				
				// Auto-export results if requested
				if (data.exportFormat && data.exportFilename && (data.exportFormat === 'csv' || data.exportFormat === 'json')) {
					setTimeout(() => {
						exportResults(data.exportFormat as 'csv' | 'json', data.exportFilename);
					}, 500);
				}
				
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

	async function correctNetlist() {
		if (!errorMessage || isCorrecting) {
			return;
		}

		console.log('Starting netlist correction...');
		console.log('Error message:', errorMessage);
		console.log('Current netlist:', netlistCode);

		isCorrecting = true;
		correctionResult = null;

		try {
			// Determine simulation type from netlist
			let simulationType: 'transient' | 'ac' | 'dc' = 'transient';
			if (netlistCode.includes('.ac')) {
				simulationType = 'ac';
			} else if (netlistCode.includes('.dc')) {
				simulationType = 'dc';
			}

			console.log('Simulation type:', simulationType);

			const result = await geminiAPI.correctNetlist({
				netlist: netlistCode,
				errorMessage: errorMessage,
				simulationType: simulationType
			});

			console.log('Correction result:', result);
			correctionResult = result;
			
			if (result.success) {
				// Apply the corrected netlist
				netlistCode = result.correctedNetlist;
				errorMessage = '';
				showCorrectionDialog = true;
				console.log('Correction applied successfully');
			} else {
				errorMessage = 'Failed to correct netlist: ' + result.explanation;
				console.error('Correction failed:', result.explanation);
			}
		} catch (error) {
			console.error('Netlist correction error:', error);
			errorMessage = 'Failed to correct netlist: ' + (error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isCorrecting = false;
		}
	}

	function applyCorrection() {
		if (correctionResult && correctionResult.success) {
			netlistCode = correctionResult.correctedNetlist;
			errorMessage = '';
			showCorrectionDialog = false;
			correctionResult = null;
		}
	}

	function dismissCorrection() {
		showCorrectionDialog = false;
		correctionResult = null;
	}

	async function validateNetlist() {
		if (!netlistCode.trim() || isCorrecting) {
			return;
		}

		isCorrecting = true;
		errorMessage = '';

		try {
			console.log('Starting netlist validation...');
			const validation = await geminiAPI.validateNetlist(netlistCode);
			console.log('Validation result:', validation);
			
			if (validation.isValid) {
				errorMessage = 'Netlist validation passed! No issues found.';
			} else {
				errorMessage = `Validation issues found:\n${validation.issues.join('\n')}`;
			}
		} catch (error) {
			console.error('Netlist validation error:', error);
			errorMessage = 'Failed to validate netlist: ' + (error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isCorrecting = false;
		}
	}

	function onCodeChange(code: string) {
		netlistCode = code;
	}

	function onDisplayDataChange(newDisplayData: DisplayDataType[]) {
		displayData = newDisplayData;
	}

	function selectExample(example: any) {
		selectedExample = example.name;
		netlistCode = example.code;
		exampleSelectorOpen = false;
		// Clear previous results when switching examples
		resultArray = undefined;
		displayData = [];
		errorMessage = '';
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}

	function resetZoom() {
		// This will be handled by the plot components
	}

	// Resizable layout functions
	function startDrag(event: MouseEvent) {
		isDragging = true;
		dragStartX = event.clientX;
		dragStartWidths = { editor: editorWidth, sidebar: sidebarWidth };
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	function handleDrag(event: MouseEvent) {
		if (!isDragging) return;
		
		const deltaX = event.clientX - dragStartX;
		const containerWidth = window.innerWidth;
		const deltaPercent = (deltaX / containerWidth) * 100;
		
		// Adjust widths while maintaining total of 100%
		const newEditorWidth = Math.max(20, Math.min(40, dragStartWidths.editor + deltaPercent));
		const newSidebarWidth = Math.max(15, Math.min(30, dragStartWidths.sidebar - deltaPercent));
		
		// Normalize to ensure total is 100%
		const total = newEditorWidth + newSidebarWidth;
		editorWidth = (newEditorWidth / total) * 100;
		sidebarWidth = (newSidebarWidth / total) * 100;
	}

	function stopDrag() {
		isDragging = false;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}

	// Handle mouse events for resizing
	$: if (browser) {
		window.addEventListener('mousemove', handleDrag);
		window.addEventListener('mouseup', stopDrag);
	}
</script>

<svelte:head>
	<title>SPICE Circuit Simulator - Saffron</title>
	<meta name="description" content="Browser-based SPICE circuit simulator using WebAssembly" />
</svelte:head>

<div class="h-screen bg-background flex flex-col overflow-hidden" class:fullscreen={isFullscreen} style="height: calc(100vh - 64px);">
	<!-- Header -->
	<header class="border-b bg-card flex-shrink-0">
		<div class="px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<CircuitBoard class="h-6 w-6 text-primary icon-fixed" />
					<div>
						<h1 class="text-lg font-bold text-foreground">SPICE Circuit Simulator</h1>
						<p class="text-xs text-muted-foreground">Browser-based circuit simulation</p>
					</div>
				</div>
				
				<div class="flex items-center gap-2">
					<!-- Thread Control -->
					<div class="flex items-center gap-2">
						<Label for="threads" class="text-xs font-medium">Threads:</Label>
						<Input
							id="threads"
							type="number"
							bind:value={threads}
							min="1"
							max={navigator?.hardwareConcurrency || 8}
							disabled={isRunning}
							class="w-12 h-7 text-xs"
						/>
					</div>
					
					<!-- Run Button -->
					<button 
						on:click={runSimulation}
						disabled={isRunning || !isInitialized || readOnly}
						class="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isRunning}
							<Square class="h-3 w-3 icon-fixed-sm" />
							Running...
						{:else if !isInitialized}
							<Settings class="h-3 w-3 icon-fixed-sm" />
							Init...
						{:else}
							<Play class="h-3 w-3 icon-fixed-sm" />
							Run
						{/if}
					</button>
					
					<!-- Debug Info -->
					<div class="text-xs text-muted-foreground">
						{isInitialized ? '✓' : '✗'} {isRunning ? '▶' : '⏸'}
					</div>
					
					<!-- Netlist Correction Button -->
					{#if errorMessage}
						<button 
							on:click={correctNetlist}
							disabled={isCorrecting}
							class="inline-flex items-center gap-1 px-3 py-1.5 border border-input bg-background text-foreground rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
							title="Fix netlist errors with AI"
						>
							{#if isCorrecting}
								<Settings class="h-3 w-3 icon-fixed-sm animate-spin" />
								Fixing...
							{:else}
								<Star class="h-3 w-3 icon-fixed-sm" />
								Fix
							{/if}
						</button>
					{/if}
					
					<!-- Fullscreen Toggle -->
					<button 
						on:click={toggleFullscreen}
						class="inline-flex items-center gap-1 px-3 py-1.5 border border-input bg-background text-foreground rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
					>
						{#if isFullscreen}
							<Minimize2 class="h-3 w-3 icon-fixed-sm" />
						{:else}
							<Maximize2 class="h-3 w-3 icon-fixed-sm" />
						{/if}
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Error Banner -->
	{#if errorMessage}
		<div class="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm">
			<div class="flex items-center gap-2">
				<XCircle class="h-4 w-4" />
				<strong>Simulation Error:</strong> {errorMessage}
			</div>
		</div>
	{/if}

	<!-- Correction Dialog -->
	{#if showCorrectionDialog && correctionResult}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-background border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
				<div class="flex items-center gap-2 mb-4">
					<Star class="h-5 w-5 text-primary" />
					<h3 class="text-lg font-semibold">Netlist Correction Applied</h3>
				</div>
				
				<div class="space-y-4">
					<div>
						<h4 class="font-medium mb-2">Explanation:</h4>
						<p class="text-sm text-muted-foreground">{correctionResult.explanation}</p>
					</div>
					
					{#if correctionResult.changes.length > 0}
						<div>
							<h4 class="font-medium mb-2">Changes Made:</h4>
							<ul class="text-sm text-muted-foreground space-y-1">
								{#each correctionResult.changes as change}
									<li class="flex items-center gap-2">
										<div class="w-1.5 h-1.5 bg-primary rounded-full"></div>
										{change}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
					
					<div>
						<h4 class="font-medium mb-2">Corrected Netlist:</h4>
						<pre class="bg-muted p-3 rounded text-xs overflow-x-auto">{correctionResult.correctedNetlist}</pre>
					</div>
				</div>
				
				<div class="flex gap-2 mt-6">
					<button 
						on:click={applyCorrection}
						class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
					>
						Apply Correction
					</button>
					<button 
						on:click={dismissCorrection}
						class="px-4 py-2 border border-input bg-background text-foreground rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content - Resizable Layout -->
	<main class="flex-1 flex overflow-hidden">
		<!-- Editor Panel -->
		<div class="flex flex-col border-r border-border overflow-hidden" style="width: {editorWidth}%; min-width: 250px; max-width: 400px;">
			<div class="border-b border-border bg-muted/30 px-3 py-2 flex-shrink-0">
				<h2 class="text-sm font-semibold flex items-center gap-2">
					<FileText class="h-4 w-4 icon-fixed" />
					Circuit Editor
				</h2>
			</div>
			<div class="flex-1 overflow-auto p-3 space-y-3">
				<!-- Example Selector -->
				<div class="space-y-2">
					<Label class="text-xs font-medium">Example Circuit</Label>
					<div class="relative">
						<select 
							bind:value={selectedExample}
							on:change={(e) => {
								const target = e.target as HTMLSelectElement;
								const example = examples.find(ex => ex.value === target.value);
								if (example) selectExample(example);
							}}
							class="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Select an example...</option>
							{#each examples as example}
								<option value={example.value}>{example.name} - {example.category}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Read-only Notice -->
				{#if readOnly}
					<div class="p-2 bg-muted/50 border border-border rounded text-xs">
						<div class="flex items-center gap-1">
							<FileText class="h-3 w-3" />
							<span>Read-only mode</span>
						</div>
					</div>
				{/if}

				<!-- Editor -->
				<div class="space-y-1">
					<Label class="text-xs font-medium">Netlist Code</Label>
					<div class="border border-border rounded-md overflow-hidden">
						<SpiceEditor 
							value={netlistCode}
							{theme}
							on:change={(e) => !readOnly && onCodeChange(e.detail)}
						/>
					</div>
				</div>

				<!-- Netlist Validation -->
				<div class="space-y-2">
					<button 
						on:click={validateNetlist}
						disabled={isCorrecting || !netlistCode.trim()}
						class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
						title="Validate netlist for common issues"
					>
						{#if isCorrecting}
							<Settings class="h-3 w-3 animate-spin" />
							Validating...
						{:else}
							<Star class="h-3 w-3" />
							Validate Netlist
						{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- Resize Handle -->
		<div 
			class="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center"
			on:mousedown={startDrag}
		>
			<GripVertical class="h-4 w-4 text-muted-foreground" />
		</div>

		<!-- Results Panel -->
		<div class="flex flex-col border-r border-border flex-1 min-w-0 overflow-hidden">
			<div class="flex-1 overflow-auto p-3">
				{#if resultArray}
					<div class="space-y-3">
						<!-- Plot Area -->
						<div class="border border-border rounded-md overflow-hidden flex-1 min-h-0">
							<D3PlotCanvas 
								{resultArray}
								{displayData}
								{theme}
							/>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center h-full text-center">
						<CircuitBoard class="h-12 w-12 text-muted-foreground mb-2" />
						<h3 class="text-sm font-semibold mb-1">No Results Yet</h3>
						<p class="text-xs text-muted-foreground">
							Run a simulation to see results here
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Resize Handle -->
		<div 
			class="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center"
			on:mousedown={startDrag}
		>
			<GripVertical class="h-4 w-4 text-muted-foreground" />
		</div>

		<!-- Right Sidebar with Tabs -->
		<div class="flex flex-col overflow-hidden" style="width: {sidebarWidth}%; min-width: 200px; max-width: 300px;">
			<div class="border-b border-border bg-muted/30 px-3 py-2 flex-shrink-0">
				<h2 class="text-sm font-semibold flex items-center gap-2">
					<Eye class="h-4 w-4 icon-fixed" />
					Signal Controls
				</h2>
			</div>
			<div class="flex-1 overflow-auto p-3">
						{#if resultArray}
							<div class="space-y-3 h-full flex flex-col">
								<!-- Signal Controls with shadcn components -->
								<div class="flex-1 space-y-3">
									<!-- Visibility Tab -->
									<div class="space-y-2">
										<div class="flex items-center justify-between">
											<h4 class="text-sm font-medium">Signal Visibility</h4>
											<button 
												on:click={toggleAllSignals}
												class="inline-flex items-center px-2 py-1 text-xs rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
											>
												{displayData.length === availableSignals.length ? 'Hide All' : 'Show All'}
											</button>
										</div>
										
										<div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
											{#each availableSignals as signal}
												{@const signalData = getSignalDisplayData(signal)}
												{@const isVisible = isSignalVisible(signal)}
												
												<div class="flex items-center space-x-2 p-2 rounded-md border border-border hover:bg-accent/50">
													<input
														type="checkbox"
														id={`signal-${signal}`}
														checked={isVisible}
														on:change={() => toggleSignalVisibility(signal)}
														class="rounded border-border"
													/>
													<Label for={`signal-${signal}`} class="flex-1 text-sm cursor-pointer">
														{signal}
													</Label>
													{#if isVisible && signalData}
														<div 
															class="w-3 h-3 rounded-full border border-border"
															style="background-color: {colorToHex(signalData.color)}"
														></div>
													{/if}
												</div>
											{/each}
										</div>
										
										{#if displayData.length > 0}
											<div class="text-xs text-muted-foreground pt-2 border-t border-border">
												{displayData.length} of {availableSignals.length} signals visible
											</div>
										{/if}
									</div>
									
									<!-- Cursor Measurement Tab -->
									{#if visibleSignals.length > 0}
										<div class="space-y-2 pt-3 border-t border-border">
											<div class="flex items-center justify-between">
												<h4 class="text-sm font-medium">Cursor Measurement</h4>
												<button 
													on:click={toggleAllMeasurements}
													disabled={visibleSignals.length === 0}
													class="inline-flex items-center px-2 py-1 text-xs rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{measuredSignals.length === visibleSignals.length ? 'None' : 'All'}
												</button>
											</div>
											
											<div class="text-xs text-muted-foreground">
												Select which signals to measure when using cursor on the plot
											</div>
											
											<div class="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
												{#each visibleSignals as signalData}
													{@const isMeasured = isSignalMeasured(signalData.name)}
													
													<div class="flex items-center space-x-2 p-2 rounded-md border border-border hover:bg-accent/50">
														<input
															type="checkbox"
															id={`measure-${signalData.name}`}
															checked={isMeasured}
															on:change={() => toggleCursorMeasurement(signalData.name)}
															class="rounded border-border"
														/>
														<Label for={`measure-${signalData.name}`} class="flex-1 text-sm cursor-pointer">
															{signalData.name}
														</Label>
														<div 
															class="w-3 h-3 rounded-full border border-border"
															style="background-color: {colorToHex(signalData.color)}"
														></div>
														{#if isMeasured}
															<Badge variant="secondary" class="text-xs px-1 py-0">
																<Ruler class="h-3 w-3" />
															</Badge>
														{/if}
													</div>
												{/each}
											</div>
											
											<div class="text-xs text-muted-foreground pt-2 border-t border-border">
												{measuredSignals.length} of {visibleSignals.length} signals selected for measurement
											</div>
										</div>
									{/if}
								</div>
								
								<!-- Download Button at Bottom -->
								<div class="pt-3 border-t border-border">
									<DownloadCSV {resultArray} />
								</div>
							</div>
						{:else}
							<div class="flex flex-col items-center justify-center h-full text-center">
								<Eye class="h-8 w-8 text-muted-foreground mb-2" />
								<h3 class="text-sm font-semibold mb-1">No Signals</h3>
								<p class="text-xs text-muted-foreground">
									Run a simulation to see signal controls
								</p>
							</div>
						{/if}
			</div>
		</div>
	</main>
</div>

<style>
	.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 9999;
		overflow: hidden;
	}
	
	.fullscreen main {
		height: calc(100vh - 60px);
	}

	/* Custom scrollbars */
	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: hsl(var(--border)) transparent;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: hsl(var(--border));
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: hsl(var(--muted-foreground));
	}

	/* Fixed icon sizes */
	.icon-fixed {
		flex-shrink: 0;
		min-width: 1rem;
		min-height: 1rem;
	}

	.icon-fixed-sm {
		flex-shrink: 0;
		min-width: 0.75rem;
		min-height: 0.75rem;
	}

	/* Fixed layout to prevent scrolling */
	main {
		overflow: hidden;
	}
	
	main > div {
		overflow: hidden;
	}
	
	/* Desktop fixed layout */
	@media (min-width: 769px) {
		main > div {
			overflow: hidden;
		}
	}

	/* Mobile responsive adjustments */
	@media (max-width: 768px) {
		main {
			flex-direction: column;
		}
		
		main > div {
			width: 100% !important;
			min-width: unset !important;
			max-width: unset !important;
		}
		
		main > div:not(:last-child) {
			border-right: none;
			border-bottom: 1px solid var(--border);
		}
	}
</style>