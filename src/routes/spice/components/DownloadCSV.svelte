<script lang="ts">
	import type { ResultArrayType } from '../lib/simulationArray';
	import type { DisplayDataType } from '../lib/displayData';
	import { Input } from '$lib/components/ui/input';
	import { Download } from '@lucide/svelte';

	export let resultArray: ResultArrayType | undefined = undefined;
	export let displayData: DisplayDataType[] = [];
	export let filename: string = 'spice_simulation';

	let isGenerating = false;

	function generateCSV(): string {
		if (!resultArray || !resultArray.results || resultArray.results.length === 0) {
			return '';
		}

		// Get all available signals from variable names
		const allSignals = new Set<string>();
		for (const result of resultArray.results) {
			if (result.variableNames) {
				result.variableNames.forEach(name => allSignals.add(name));
			}
		}

		// Remove 'x' from signals and sort
		const signals = Array.from(allSignals).filter(s => s !== 'x').sort();
		
		// Create header row
		const headers = ['x', ...signals];
		let csv = headers.join(',') + '\n';

		// Collect all data points
		const dataPoints: { [key: string]: any }[] = [];
		
		for (const result of resultArray.results) {
			if (!result.data || result.data.length === 0) continue;

			// Find x variable (usually first variable)
			const xIndex = result.variableNames?.indexOf('x') ?? 0;
			const xData = result.data[xIndex]?.values || [];
			
			for (let i = 0; i < result.numPoints; i++) {
				const point: { [key: string]: any } = { 
					x: xData[i] || resultArray.sweep?.[i] || i 
				};
				
				for (const signal of signals) {
					const signalIndex = result.variableNames?.indexOf(signal) ?? -1;
					if (signalIndex >= 0 && result.data[signalIndex]) {
						const signalData = result.data[signalIndex].values;
						
						if (i < signalData.length) {
							const value = signalData[i];
							
							// Handle complex numbers
							if (typeof value === 'object' && value !== null) {
								if ('real' in value && 'img' in value) {
									// Complex number - export real and imaginary parts
									point[signal] = value.real;
									point[signal + '_imag'] = value.img;
								} else {
									point[signal] = JSON.stringify(value);
								}
							} else {
								point[signal] = value;
							}
						} else {
							point[signal] = '';
						}
					} else {
						point[signal] = '';
					}
				}
				
				dataPoints.push(point);
			}
		}

		// Sort data points by x value
		dataPoints.sort((a, b) => (a.x || 0) - (b.x || 0));

		// Update headers to include complex parts if any
		const finalHeaders = new Set(['x']);
		for (const point of dataPoints) {
			Object.keys(point).forEach(key => finalHeaders.add(key));
		}
		const sortedHeaders = Array.from(finalHeaders).sort((a, b) => {
			if (a === 'x') return -1;
			if (b === 'x') return 1;
			return a.localeCompare(b);
		});

		// Generate CSV content
		csv = sortedHeaders.join(',') + '\n';
		
		for (const point of dataPoints) {
			const row = sortedHeaders.map(header => {
				const value = point[header];
				if (value === undefined || value === null) {
					return '';
				}
				// Escape values that contain commas or quotes
				const stringValue = String(value);
				if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
					return '"' + stringValue.replace(/"/g, '""') + '"';
				}
				return stringValue;
			});
			csv += row.join(',') + '\n';
		}

		return csv;
	}

	function downloadCSV() {
		if (!resultArray || !resultArray.results || resultArray.results.length === 0) {
			alert('No simulation data available to download');
			return;
		}

		isGenerating = true;

		try {
			const csvContent = generateCSV();
			
			if (!csvContent) {
				alert('No data to export');
				return;
			}

			// Create blob and download
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', `${filename}.csv`);
			link.style.visibility = 'hidden';
			
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Clean up the URL object
			URL.revokeObjectURL(url);
			
		} catch (error) {
			console.error('Error generating CSV:', error);
			alert('Error generating CSV file');
		} finally {
			isGenerating = false;
		}
	}
</script>

<div class="space-y-2">
	<div class="text-sm font-medium text-muted-foreground">
		Export Results
	</div>
	
	<div class="flex gap-2 items-center">
		<Input
			type="text"
			bind:value={filename}
			placeholder="filename"
			disabled={isGenerating}
			class="flex-1"
		/>
		
		<button
			type="button"
			class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
			on:click={downloadCSV}
			disabled={isGenerating || !resultArray || !resultArray.results || resultArray.results.length === 0}
			title="Download CSV"
		>
			{#if isGenerating}
				<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
			{:else}
				<Download class="w-4 h-4" />
			{/if}
		</button>
	</div>
</div> 