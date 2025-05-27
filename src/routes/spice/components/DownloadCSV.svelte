<script lang="ts">
	import type { ResultArrayType } from '../lib/simulationArray';
	import type { DisplayDataType } from '../lib/displayData';

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

	function getDataInfo(): string {
		if (!resultArray || !resultArray.results || resultArray.results.length === 0) {
			return 'No data';
		}

		const totalPoints = resultArray.results.reduce((sum: number, result) => {
			return sum + (result.numPoints || 0);
		}, 0);

		const allSignals = new Set<string>();
		for (const result of resultArray.results) {
			if (result.variableNames) {
				result.variableNames.forEach(name => {
					if (name !== 'x') allSignals.add(name);
				});
			}
		}

		return `${totalPoints} data points, ${allSignals.size} signals`;
	}
</script>

<div class="download-csv">
	<div class="info">
		<span class="data-info">{getDataInfo()}</span>
	</div>
	
	<div class="controls">
		<input
			type="text"
			bind:value={filename}
			placeholder="filename"
			class="filename-input"
			disabled={isGenerating}
		/>
		
		<button
			type="button"
			class="download-button"
			on:click={downloadCSV}
			disabled={isGenerating || !resultArray || !resultArray.results || resultArray.results.length === 0}
		>
			{#if isGenerating}
				<span class="spinner"></span>
				Generating...
			{:else}
				<svg class="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
					<polyline points="7,10 12,15 17,10"/>
					<line x1="12" y1="15" x2="12" y2="3"/>
				</svg>
				Download CSV
			{/if}
		</button>
	</div>
</div>

<style>
	.download-csv {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--bg-secondary, #f8f9fa);
		border: 1px solid var(--border-color, #dee2e6);
		border-radius: 8px;
		font-family: var(--font-mono, 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace);
	}

	.info {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.data-info {
		font-size: 0.9rem;
		color: var(--text-muted, #6c757d);
		font-weight: 500;
	}

	.controls {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.filename-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-color, #dee2e6);
		border-radius: 6px;
		background: var(--bg-primary, #ffffff);
		color: var(--text-color, #2d3748);
		font-family: inherit;
		font-size: 0.9rem;
		transition: border-color 0.2s ease;
	}

	.filename-input:focus {
		outline: none;
		border-color: var(--primary-color, #3182ce);
		box-shadow: 0 0 0 3px var(--primary-color-alpha, rgba(49, 130, 206, 0.1));
	}

	.filename-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.download-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--primary-color, #3182ce);
		color: white;
		border: none;
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.download-button:hover:not(:disabled) {
		background: var(--primary-color-hover, #2c5aa0);
		transform: translateY(-1px);
	}

	.download-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.download-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.download-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Dark theme */
	:global(.dark) .download-csv {
		background: var(--bg-secondary-dark, #2d3748);
		border-color: var(--border-color-dark, #4a5568);
		color: var(--text-color-dark, #e2e8f0);
	}

	:global(.dark) .data-info {
		color: var(--text-muted-dark, #a0aec0);
	}

	:global(.dark) .filename-input {
		background: var(--bg-primary-dark, #1a202c);
		border-color: var(--border-color-dark, #4a5568);
		color: var(--text-color-dark, #e2e8f0);
	}

	:global(.dark) .filename-input:focus {
		border-color: var(--primary-color-dark, #63b3ed);
		box-shadow: 0 0 0 3px var(--primary-color-alpha-dark, rgba(99, 179, 237, 0.1));
	}

	@media (max-width: 768px) {
		.controls {
			flex-direction: column;
			align-items: stretch;
		}

		.filename-input {
			flex: none;
		}

		.download-button {
			justify-content: center;
		}
	}
</style>