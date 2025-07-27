<script lang="ts">
	import { circuitStore } from '../stores/circuit-store';
	import { onMount, createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';

	export let isVisible = false;

	const dispatch = createEventDispatcher();

	let nodePositions: { id: string; x: number; y: number }[] = [];
	let jsonText = '';
	let importText = '';
	let importError = '';

	function refreshPositions() {
		const store = get(circuitStore);
		nodePositions = store.nodes.map((n) => ({
			id: n.id,
			x: n.position.x,
			y: n.position.y
		}));
		jsonText = circuitStore.exportJSON();
	}

	function exportJSON() {
		jsonText = circuitStore.exportJSON();
	}

	function importJSON() {
		try {
			const data = JSON.parse(importText);
			circuitStore.loadFromJson(data);
			importError = '';
			refreshPositions();
		} catch (e) {
			importError = 'Invalid JSON';
		}
	}

	function closeOverlay() {
		isVisible = false;
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeOverlay();
		}
	}

	onMount(() => {
		refreshPositions();
		const unsubscribe = circuitStore.subscribe(() => refreshPositions());
		return unsubscribe;
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if isVisible}
	<div class="debug-overlay" on:click={closeOverlay} on:keydown={handleKeydown} tabindex="-1">
		<div class="debug-menu" on:click|stopPropagation>
			<div class="debug-header">
				<h2>Debug Menu</h2>
				<button class="close-button" on:click={closeOverlay} aria-label="Close debug menu">×</button
				>
			</div>

			<div class="debug-content">
				<h3>Node Positions</h3>
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>X</th>
							<th>Y</th>
						</tr>
					</thead>
					<tbody>
						{#each nodePositions as node}
							<tr>
								<td>{node.id}</td>
								<td>{node.x}</td>
								<td>{node.y}</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<button on:click={exportJSON}>Export JSON</button>
				{#if jsonText}
					<pre class="json-output">{jsonText}</pre>
				{/if}

				<h3>Import JSON</h3>
				<textarea bind:value={importText} rows="6" cols="60" placeholder="Paste JSON here"
				></textarea>
				<button on:click={importJSON}>Import</button>
				{#if importError}
					<div class="error">{importError}</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.debug-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.debug-menu {
		background: #1a1a1a;
		color: #e5e5e5;
		border-radius: 12px;
		max-width: 90vw;
		max-height: 90vh;
		overflow: hidden;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		border: 1px solid #333;
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: scale(0.95) translateY(-10px);
			opacity: 0;
		}
		to {
			transform: scale(1) translateY(0);
			opacity: 1;
		}
	}

	.debug-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #333;
		background: #111;
	}

	.debug-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		color: #999;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: #333;
		color: #fff;
	}

	.debug-content {
		padding: 1.5rem;
		overflow-y: auto;
		max-height: calc(90vh - 80px);
	}

	.debug-content h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		color: #ccc;
		font-weight: 500;
	}

	table {
		width: 100%;
		margin-bottom: 1.5rem;
		border-collapse: collapse;
		background: #222;
		border-radius: 6px;
		overflow: hidden;
	}

	th,
	td {
		border: 1px solid #444;
		padding: 0.5rem 0.75rem;
		text-align: left;
		font-size: 0.875rem;
	}

	th {
		background: #333;
		font-weight: 600;
		color: #ddd;
	}

	td {
		color: #aaa;
	}

	textarea {
		width: 100%;
		margin-bottom: 0.75rem;
		padding: 0.75rem;
		background: #222;
		border: 1px solid #444;
		border-radius: 6px;
		color: #e5e5e5;
		font-family: inherit;
		font-size: 0.875rem;
		resize: vertical;
		min-height: 120px;
	}

	textarea:focus {
		outline: none;
		border-color: #555;
		background: #2a2a2a;
	}

	button {
		margin-top: 0.5rem;
		margin-right: 0.5rem;
		padding: 0.5rem 1rem;
		background: #444;
		color: #e5e5e5;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	button:hover {
		background: #555;
	}

	button:active {
		transform: translateY(1px);
	}

	.json-output {
		background: #111;
		border: 1px solid #333;
		border-radius: 6px;
		padding: 1rem;
		margin: 0.75rem 0;
		font-size: 0.75rem;
		line-height: 1.4;
		max-height: 200px;
		overflow-y: auto;
		color: #ccc;
	}

	.error {
		color: #ff6b6b;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		padding: 0.5rem;
		background: rgba(255, 107, 107, 0.1);
		border: 1px solid rgba(255, 107, 107, 0.2);
		border-radius: 4px;
	}

	/* Dark mode compatibility */
	:global(.dark) .debug-menu {
		background: #0f0f0f;
		border-color: #2a2a2a;
	}

	:global(.dark) .debug-header {
		background: #080808;
		border-color: #2a2a2a;
	}
</style>
