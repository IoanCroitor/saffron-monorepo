<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ResultArrayType } from '../lib/simulationArray';
	import { isComplex } from '../lib/simulationArray';

	export let resultArray: ResultArrayType | undefined = undefined;

	const dispatch = createEventDispatcher();

	let downloadLink: HTMLAnchorElement;
	let href = '';
	let includeComplex = false;
	let polarFormat = false;
	let showOptions = false;

	type ComplexPolar = {
		magnitude: number;
		phase: number;
	};

	function generateCSVReal(resultArray: ResultArrayType): string {
		let csv = '';
		let header = '';
		const vars = resultArray.results[0].variableNames;

		// Generate header
		vars.forEach((name) => {
			for (let i = 0; i < resultArray.results.length; i++) {
				const sweepIndex = resultArray.sweep.length > i
					? `[${resultArray.sweep[i]}]`
					: '';
				header += `${name}${sweepIndex},`;
			}
		});
		header = header.slice(0, -1) + '\n'; // Remove last comma and add newline

		// Find maximum number of data points
		const maxRows = resultArray.results.reduce((max, result) => {
			return Math.max(max, result.data[0]?.values.length || 0);
		}, 0);

		// Generate data rows
		for (let row = 0; row < maxRows; row++) {
			let rowData = '';
			for (let col = 0; col < vars.length; col++) {
				for (let sweep = 0; sweep < resultArray.results.length; sweep++) {
					const result = resultArray.results[sweep];
					if (row < result.data[col]?.values.length && result.dataType === 'real') {
						const value = result.data[col].values[row] as number;
						rowData += value.toExponential() + ',';
					} else {
						rowData += ','; // Empty cell for missing data
					}
				}
			}
			csv += rowData.slice(0, -1) + '\n'; // Remove last comma and add newline
		}

		return header + csv;
	}

	function generateCSVComplex(resultArray: ResultArrayType, usePolar = false): string {
		let csv = '';
		let header = '';
		const vars = resultArray.results[0].variableNames;

		// Generate header for complex data
		vars.forEach((name) => {
			for (let i = 0; i < resultArray.results.length; i++) {
				const sweepIndex = resultArray.sweep.length > i
					? `[${resultArray.sweep[i]}]`
					: '';
				if (usePolar) {
					header += `${name}_mag${sweepIndex},${name}_phase${sweepIndex},`;
				} else {
					header += `${name}_real${sweepIndex},${name}_imag${sweepIndex},`;
				}
			}
		});
		header = header.slice(0, -1) + '\n';

		// Find maximum number of data points
		const maxRows = resultArray.results.reduce((max, result) => {
			return Math.max(max, result.data[0]?.values.length || 0);
		}, 0);

		// Generate data rows
		for (let row = 0; row < maxRows; row++) {
			let rowData = '';
			for (let col = 0; col < vars.length; col++) {
				for (let sweep = 0; sweep < resultArray.results.length; sweep++) {
					const result = resultArray.results[sweep];
					if (row < result.data[col]?.values.length && result.dataType === 'complex') {
						const complexValue = result.data[col].values[row] as any;
						
						if (usePolar) {
							const magnitude = Math.sqrt(complexValue.re * complexValue.re + complexValue.im * complexValue.im);
							const phase = Math.atan2(complexValue.im, complexValue.re) * 180 / Math.PI;
							rowData += `${magnitude.toExponential()},${phase.toExponential()},`;
						} else {
							rowData += `${complexValue.re.toExponential()},${complexValue.im.toExponential()},`;
						}
					} else {
						rowData += ',,'; // Empty cells for missing data
					}
				}
			}
			csv += rowData.slice(0, -1) + '\n';
		}

		return header + csv;
	}

	function downloadCSV() {
		if (!resultArray || resultArray.results.length === 0) return;

		try {
			let csvData = '';
			const firstResult = resultArray.results[0];
			
			if (firstResult.dataType === 'complex' && includeComplex) {
				csvData = generateCSVComplex(resultArray, polarFormat);
			} else {
				csvData = generateCSVReal(resultArray);
			}

			// Create blob and download
			const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			
			const link = document.createElement('a');
			link.href = url;
			link.download = `simulation_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			URL.revokeObjectURL(url);
			
			dispatch('downloaded');
		} catch (error) {
			console.error('Error generating CSV:', error);
			dispatch('error', { message: 'Failed to generate CSV file' });
		}
	}

	function toggleOptions() {
		showOptions = !showOptions;
	}

	// Check if we have complex data
	$: hasComplexData = resultArray?.results?.[0]?.dataType === 'complex';
</script>

<div class="download-csv">
	<button 
		class="download-btn"
		class:disabled={!resultArray}
		on:click={downloadCSV}
		disabled={!resultArray}
		title="Download simulation results as CSV"
	>
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
			<polyline points="7,10 12,15 17,10"/>
			<line x1="12" y1="15" x2="12" y2="3"/>
		</svg>
		CSV
	</button>

	{#if hasComplexData}
		<button 
			class="options-btn"
			class:active={showOptions}
			on:click={toggleOptions}
			title="Download options"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="3"/>
				<path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
			</svg>
		</button>
	{/if}
</div>

{#if showOptions && hasComplexData}
	<div class="options-panel">
		<div class="option-group">
			<label class="option-item">
				<input
					type="checkbox"
					bind:checked={includeComplex}
				/>
				<span>Include complex data</span>
			</label>
			
			{#if includeComplex}
				<label class="option-item sub-option">
					<input
						type="radio"
						bind:group={polarFormat}
						value={false}
						name="complex-format"
					/>
					<span>Rectangular (Real/Imaginary)</span>
				</label>
				
				<label class="option-item sub-option">
					<input
						type="radio"
						bind:group={polarFormat}
						value={true}
						name="complex-format"
					/>
					<span>Polar (Magnitude/Phase)</span>
				</label>
			{/if}
		</div>
	</div>
{/if}

<style>
	.download-csv {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.download-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.download-btn:hover:not(.disabled) {
		background: var(--accent-color);
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.download-btn.disabled {
		background: var(--border-color);
		color: var(--text-secondary);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.options-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.options-btn:hover,
	.options-btn.active {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}

	.options-panel {
		position: absolute;
		top: 100%;
		right: 0;
		z-index: 10;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 0.75rem;
		min-width: 200px;
		margin-top: 0.25rem;
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.option-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-primary);
		cursor: pointer;
		user-select: none;
	}

	.option-item input {
		margin: 0;
		cursor: pointer;
	}

	.sub-option {
		margin-left: 1rem;
		color: var(--text-secondary);
	}

	.option-item:hover {
		color: var(--accent-color);
	}
</style>
