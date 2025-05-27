<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { DisplayDataType, ColorType } from '../lib/displayData';
	import type { ResultArrayType } from '../lib/simulationArray';

	export let resultArray: ResultArrayType | undefined = undefined;
	export let displayData: DisplayDataType[] = [];
	export let theme: 'light' | 'dark' = 'dark';

	const dispatch = createEventDispatcher<{
		updateDisplay: DisplayDataType[];
	}>();

	let availableSignals: string[] = [];
	let activeTab: 'visibility' | 'measurement' = 'visibility';

	// Predefined color palette that looks good and is accessible
	const colorPalette: ColorType[] = [
		{ r: 0.31, g: 0.78, b: 0.47, a: 1.0 }, // Green
		{ r: 0.20, g: 0.60, b: 0.86, a: 1.0 }, // Blue  
		{ r: 0.95, g: 0.39, b: 0.27, a: 1.0 }, // Red
		{ r: 0.94, g: 0.77, b: 0.06, a: 1.0 }, // Yellow
		{ r: 0.61, g: 0.35, b: 0.71, a: 1.0 }, // Purple
		{ r: 0.90, g: 0.49, b: 0.13, a: 1.0 }, // Orange
		{ r: 0.33, g: 0.68, b: 0.75, a: 1.0 }, // Teal
		{ r: 0.84, g: 0.15, b: 0.56, a: 1.0 }, // Pink
	];

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
		
		dispatch('updateDisplay', displayData);
	}

	function toggleCursorMeasurement(signalName: string) {
		displayData = displayData.map(item => 
			item.name === signalName 
				? { ...item, measureWithCursor: !item.measureWithCursor }
				: item
		);
		dispatch('updateDisplay', displayData);
	}

	function getNextColor(): ColorType {
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

	function colorToHex(color: ColorType): string {
		const r = Math.round(color.r * 255);
		const g = Math.round(color.g * 255);
		const b = Math.round(color.b * 255);
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}

	function toggleAll() {
		if (displayData.length === availableSignals.length) {
			// Hide all
			displayData = [];
		} else {
			// Show all
			displayData = availableSignals.map((signal, index) => ({
				name: signal,
				visible: true,
				color: colorPalette[index % colorPalette.length],
				index,
				measureWithCursor: false
			}));
		}
		dispatch('updateDisplay', displayData);
	}

	function toggleAllMeasurements() {
		const visibleSignals = displayData.filter(item => item.visible);
		const allMeasured = visibleSignals.every(item => item.measureWithCursor);
		
		displayData = displayData.map(item => 
			item.visible 
				? { ...item, measureWithCursor: !allMeasured }
				: item
		);
		dispatch('updateDisplay', displayData);
	}

	$: visibleSignals = displayData.filter(item => item.visible);
	$: measuredSignals = displayData.filter(item => item.measureWithCursor);
</script>

<div class="display-box" class:dark={theme === 'dark'}>
	<div class="header">
		<div class="tabs">
			<button 
				class="tab-button"
				class:active={activeTab === 'visibility'}
				on:click={() => activeTab = 'visibility'}
			>
				<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
					<circle cx="12" cy="12" r="3"/>
				</svg>
				Visibility
			</button>
			<button 
				class="tab-button"
				class:active={activeTab === 'measurement'}
				on:click={() => activeTab = 'measurement'}
			>
				<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 9l3 3 3-3"/>
					<path d="M21 3l-6 6"/>
					<path d="M3 3l6 6"/>
					<line x1="12" y1="3" x2="12" y2="21"/>
				</svg>
				Cursor
			</button>
		</div>
		
		{#if availableSignals.length > 0}
			{#if activeTab === 'visibility'}
				<button 
					class="toggle-all-btn"
					on:click={toggleAll}
					title={displayData.length === availableSignals.length ? 'Hide all signals' : 'Show all signals'}
				>
					{displayData.length === availableSignals.length ? 'Hide All' : 'Show All'}
				</button>
			{:else if activeTab === 'measurement'}
				<button 
					class="toggle-all-btn"
					on:click={toggleAllMeasurements}
					title={measuredSignals.length === visibleSignals.length ? 'Disable all measurements' : 'Enable all measurements'}
					disabled={visibleSignals.length === 0}
				>
					{measuredSignals.length === visibleSignals.length ? 'None' : 'All'}
				</button>
			{/if}
		{/if}
	</div>
	
	{#if availableSignals.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📊</div>
			<p>No simulation results available</p>
			<span class="empty-hint">Run a simulation to see signals here</span>
		</div>
	{:else}
		{#if activeTab === 'visibility'}
			<div class="signals-grid">
				{#each availableSignals as signal}
					{@const signalData = getSignalDisplayData(signal)}
					{@const isVisible = isSignalVisible(signal)}
					
					<label class="signal-item" class:visible={isVisible}>
						<div class="signal-checkbox">
							<input
								type="checkbox"
								checked={isVisible}
								on:change={() => toggleSignalVisibility(signal)}
							/>
							<div class="checkmark"></div>
						</div>
						
						<div class="signal-info">
							<div class="signal-name">{signal}</div>
							{#if isVisible && signalData}
								<div 
									class="color-indicator" 
									style="background-color: {colorToHex(signalData.color)}"
								></div>
							{/if}
						</div>
					</label>
				{/each}
			</div>
			
			{#if displayData.length > 0}
				<div class="summary">
					<span class="summary-text">
						{displayData.length} of {availableSignals.length} signals visible
					</span>
				</div>
			{/if}
		{:else if activeTab === 'measurement'}
			{#if visibleSignals.length === 0}
				<div class="empty-state">
					<div class="empty-icon">📏</div>
					<p>No visible signals</p>
					<span class="empty-hint">Show some signals first to enable cursor measurements</span>
				</div>
			{:else}
				<div class="measurement-info">
					<p class="measurement-description">
						Select which signals to measure when using cursor on the plot
					</p>
				</div>
				
				<div class="signals-grid">
					{#each visibleSignals as signalData}
						{@const isMeasured = isSignalMeasured(signalData.name)}
						
						<label class="signal-item measurement-item" class:measured={isMeasured}>
							<div class="signal-checkbox">
								<input
									type="checkbox"
									checked={isMeasured}
									on:change={() => toggleCursorMeasurement(signalData.name)}
								/>
								<div class="checkmark"></div>
							</div>
							
							<div class="signal-info">
								<div class="signal-name">{signalData.name}</div>
								<div 
									class="color-indicator" 
									style="background-color: {colorToHex(signalData.color)}"
								></div>
								{#if isMeasured}
									<div class="measurement-badge">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M9 9l3 3 3-3"/>
											<line x1="12" y1="3" x2="12" y2="21"/>
										</svg>
									</div>
								{/if}
							</div>
						</label>
					{/each}
				</div>
				
				<div class="summary">
					<span class="summary-text">
						{measuredSignals.length} of {visibleSignals.length} signals selected for measurement
					</span>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.display-box {
		background: var(--bg-secondary, #f8f9fa);
		border: 1px solid var(--border-color, #dee2e6);
		border-radius: 12px;
		padding: 1.5rem;
		font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif);
		height: 100%;
		display: flex;
		flex-direction: column;
		min-height: 300px;
	}

	.display-box.dark {
		background: var(--bg-secondary-dark, #2d3748);
		border-color: var(--border-color-dark, #4a5568);
		color: var(--text-color-dark, #e2e8f0);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-shrink: 0;
		gap: 1rem;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		background: var(--bg-tertiary, #ffffff);
		border-radius: 8px;
		padding: 0.25rem;
		border: 1px solid var(--border-color, #dee2e6);
	}

	.dark .tabs {
		background: var(--bg-tertiary-dark, #4a5568);
		border-color: var(--border-color-dark, #4a5568);
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-muted, #6c757d);
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.tab-button:hover {
		color: var(--text-color, #2d3748);
		background: var(--bg-secondary, #f8f9fa);
	}

	.tab-button.active {
		background: var(--primary-color, #3182ce);
		color: white;
	}

	.dark .tab-button {
		color: var(--text-muted-dark, #a0aec0);
	}

	.dark .tab-button:hover {
		color: var(--text-color-dark, #e2e8f0);
		background: var(--bg-secondary-dark, #2d3748);
	}

	.dark .tab-button.active {
		background: var(--primary-color-dark, #63b3ed);
		color: var(--bg-primary-dark, #1a202c);
	}

	.tab-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.toggle-all-btn {
		padding: 0.5rem 1rem;
		background: var(--primary-color, #3182ce);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.toggle-all-btn:hover {
		background: var(--primary-color-hover, #2c5aa0);
		transform: translateY(-1px);
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		color: var(--text-muted, #6c757d);
		gap: 0.75rem;
	}

	.empty-icon {
		font-size: 3rem;
		opacity: 0.5;
	}

	.empty-state p {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 500;
	}

	.empty-hint {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	.dark .empty-state {
		color: var(--text-muted-dark, #a0aec0);
	}

	.signals-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
		flex: 1;
		align-content: start;
	}

	.signal-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem;
		border: 2px solid transparent;
		border-radius: 8px;
		background: var(--bg-tertiary, #ffffff);
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
	}

	.signal-item:hover {
		border-color: var(--border-color-hover, #cbd5e0);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.signal-item.visible {
		border-color: var(--primary-color, #3182ce);
		background: var(--primary-color-light, rgba(49, 130, 206, 0.05));
	}

	.dark .signal-item {
		background: var(--bg-tertiary-dark, #4a5568);
	}

	.dark .signal-item:hover {
		border-color: var(--border-color-hover-dark, #718096);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.dark .signal-item.visible {
		border-color: var(--primary-color-dark, #63b3ed);
		background: var(--primary-color-light-dark, rgba(99, 179, 237, 0.1));
	}

	.signal-checkbox {
		position: relative;
		flex-shrink: 0;
	}

	.signal-checkbox input[type="checkbox"] {
		width: 20px;
		height: 20px;
		opacity: 0;
		cursor: pointer;
		margin: 0;
	}

	.checkmark {
		position: absolute;
		top: 0;
		left: 0;
		width: 20px;
		height: 20px;
		background: var(--bg-primary, #ffffff);
		border: 2px solid var(--border-color, #dee2e6);
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.signal-checkbox input:checked + .checkmark {
		background: var(--primary-color, #3182ce);
		border-color: var(--primary-color, #3182ce);
	}

	.signal-checkbox input:checked + .checkmark::after {
		content: '';
		position: absolute;
		left: 6px;
		top: 2px;
		width: 6px;
		height: 12px;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	.dark .checkmark {
		background: var(--bg-primary-dark, #1a202c);
		border-color: var(--border-color-dark, #4a5568);
	}

	.dark .signal-checkbox input:checked + .checkmark {
		background: var(--primary-color-dark, #63b3ed);
		border-color: var(--primary-color-dark, #63b3ed);
	}

	.signal-info {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.signal-name {
		font-family: var(--font-mono, 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace);
		font-size: 0.9rem;
		font-weight: 500;
		color: inherit;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.color-indicator {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid var(--bg-primary, #ffffff);
		flex-shrink: 0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.signal-item.measured {
		border-color: var(--success-color, #10b981);
		background: var(--success-color-light, rgba(16, 185, 129, 0.05));
	}

	.dark .signal-item.measured {
		border-color: var(--success-color-dark, #34d399);
		background: var(--success-color-light-dark, rgba(52, 211, 153, 0.1));
	}

	.measurement-item {
		position: relative;
	}

	.measurement-badge {
		width: 20px;
		height: 20px;
		background: var(--success-color, #10b981);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.measurement-badge svg {
		width: 12px;
		height: 12px;
		color: white;
	}

	.dark .measurement-badge {
		background: var(--success-color-dark, #34d399);
	}

	.measurement-info {
		margin-bottom: 1rem;
		padding: 1rem;
		background: var(--bg-tertiary, #ffffff);
		border: 1px solid var(--border-color, #dee2e6);
		border-radius: 8px;
		flex-shrink: 0;
	}

	.dark .measurement-info {
		background: var(--bg-tertiary-dark, #4a5568);
		border-color: var(--border-color-dark, #4a5568);
	}

	.measurement-description {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-muted, #6c757d);
		line-height: 1.4;
	}

	.dark .measurement-description {
		color: var(--text-muted-dark, #a0aec0);
	}

	.summary {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #dee2e6);
		flex-shrink: 0;
	}

	.dark .summary {
		border-color: var(--border-color-dark, #4a5568);
	}

	.summary-text {
		font-size: 0.875rem;
		color: var(--text-muted, #6c757d);
		font-weight: 500;
	}

	.dark .summary-text {
		color: var(--text-muted-dark, #a0aec0);
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.display-box {
			padding: 1rem;
		}

		.signals-grid {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.signal-item {
			padding: 0.75rem;
		}

		.header {
			margin-bottom: 1rem;
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.tabs {
			justify-content: center;
		}

		.tab-button {
			flex: 1;
			justify-content: center;
		}

		.toggle-all-btn {
			padding: 0.375rem 0.75rem;
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.header {
			gap: 0.5rem;
		}

		.tabs {
			padding: 0.125rem;
		}

		.tab-button {
			padding: 0.375rem 0.5rem;
			font-size: 0.8rem;
			gap: 0.25rem;
		}

		.tab-icon {
			width: 14px;
			height: 14px;
		}

		.measurement-info {
			padding: 0.75rem;
		}

		.measurement-description {
			font-size: 0.8rem;
		}
	}
</style>