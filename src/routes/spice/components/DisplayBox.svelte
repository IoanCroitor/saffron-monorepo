<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ResultArrayType } from '../lib/simulationArray';
	import type { DisplayDataType } from '../lib/displayData';

	export let resultArray: ResultArrayType | undefined = undefined;
	export let displayData: DisplayDataType[] = [];
	export let theme: 'light' | 'dark' = 'dark';

	// Use theme for styling
	const themeClass = theme;

	const dispatch = createEventDispatcher<{ displayDataChange: DisplayDataType[] }>();

	function toggleVisibility(name: string, visible: boolean) {
		displayData = displayData.map(dd => 
			dd.name === name ? { ...dd, visible } : dd
		);
		dispatch('displayDataChange', displayData);
	}

	function selectAll() {
		displayData = displayData.map(dd => ({ ...dd, visible: true }));
		dispatch('displayDataChange', displayData);
	}

	function selectNone() {
		displayData = displayData.map(dd => ({ ...dd, visible: false }));
		dispatch('displayDataChange', displayData);
	}

	function getColorString(color: { r: number; g: number; b: number } | undefined): string {
		if (!color) return 'rgb(200, 200, 200)';
		return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
	}
</script>

<div class="display-box">
	<div class="display-header">
		<h3>Signal Visibility</h3>
		<div class="header-controls">
			<button class="control-btn" on:click={selectAll} title="Show All">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="9,11 12,14 22,4"></polyline>
					<path d="m21,11.5v6a2,2 0 0,1 -2,2H5a2,2 0 0,1 -2,-2V5a2,2 0 0,1 2,-2h11"></path>
				</svg>
				All
			</button>
			<button class="control-btn" on:click={selectNone} title="Hide All">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
				</svg>
				None
			</button>
		</div>
	</div>

	<div class="signal-list">
		{#if displayData.length > 0}
			{#each displayData as dd (dd.name)}
				<label class="signal-item">
					<input
						type="checkbox"
						bind:checked={dd.visible}
						on:change={(e) => toggleVisibility(dd.name, e.currentTarget.checked)}
					/>
					<span 
						class="signal-indicator"
						style:background-color={getColorString(dd.color)}
					></span>
					<span class="signal-name" title={dd.name}>{dd.name}</span>
				</label>
			{/each}
		{:else}
			<div class="no-signals">
				<p>No signals available</p>
				<p class="hint">Run a simulation to see signals here</p>
			</div>
		{/if}
	</div>

	{#if resultArray}
		<div class="simulation-info">
			<div class="info-item">
				<span class="info-label">Results:</span>
				<span class="info-value">{resultArray.results.length}</span>
			</div>
			<div class="info-item">
				<span class="info-label">Variables:</span>
				<span class="info-value">{resultArray.results[0]?.variableNames.length || 0}</span>
			</div>
			{#if resultArray.sweep.length > 0}
				<div class="info-item">
					<span class="info-label">Sweep:</span>
					<span class="info-value">{resultArray.sweep.length} points</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.display-box {
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		height: 100%;
		min-height: 200px;
	}

	.display-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		border-radius: 4px 4px 0 0;
	}

	.display-header h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.header-controls {
		display: flex;
		gap: 0.5rem;
	}

	.control-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		border-radius: 3px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.control-btn:hover {
		background: var(--accent-color);
		color: white;
	}

	.signal-list {
		flex: 1;
		padding: 0.5rem;
		overflow-y: auto;
		min-height: 0;
	}

	.signal-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 3px;
		cursor: pointer;
		transition: background-color 0.2s;
		user-select: none;
	}

	.signal-item:hover {
		background: var(--bg-secondary);
	}

	.signal-item input[type="checkbox"] {
		margin: 0;
		cursor: pointer;
	}

	.signal-indicator {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
		border: 1px solid var(--border-color);
	}

	.signal-name {
		flex: 1;
		font-size: 0.875rem;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.no-signals {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-secondary);
		text-align: center;
		padding: 2rem 1rem;
	}

	.no-signals p {
		margin: 0.25rem 0;
	}

	.hint {
		font-size: 0.75rem;
		opacity: 0.7;
	}

	.simulation-info {
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-color);
		border-radius: 0 0 4px 4px;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
		font-size: 0.75rem;
	}

	.info-item:last-child {
		margin-bottom: 0;
	}

	.info-label {
		color: var(--text-secondary);
		font-weight: 500;
	}

	.info-value {
		color: var(--text-primary);
		font-weight: 600;
	}

	/* Scrollbar styling */
	.signal-list::-webkit-scrollbar {
		width: 6px;
	}

	.signal-list::-webkit-scrollbar-track {
		background: var(--bg-primary);
	}

	.signal-list::-webkit-scrollbar-thumb {
		background: var(--border-color);
		border-radius: 3px;
	}

	.signal-list::-webkit-scrollbar-thumb:hover {
		background: var(--text-secondary);
	}
</style>
