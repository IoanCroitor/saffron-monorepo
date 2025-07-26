<script lang="ts">
	import { circuitStore } from '../stores/circuit-store';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

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

	onMount(() => {
		refreshPositions();
		const unsubscribe = circuitStore.subscribe(() => refreshPositions());
		return unsubscribe;
	});
</script>

test
<div class="debug-menu">
	<h2>Node Positions Debug Menu</h2>
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
		<pre>{jsonText}</pre>
	{/if}

	<h3>Import JSON</h3>
	<textarea bind:value={importText} rows="6" cols="60" placeholder="Paste JSON here"></textarea>
	<button on:click={importJSON}>Import</button>
	{#if importError}
		<div style="color: red">{importError}</div>
	{/if}
</div>

<style>
	.debug-menu {
		padding: 1rem;
		background: #222;
		color: #eee;
		border-radius: 8px;
		max-width: 600px;
		margin: 1rem auto;
		font-family: monospace;
	}
	table {
		width: 100%;
		margin-bottom: 1rem;
		border-collapse: collapse;
	}
	th,
	td {
		border: 1px solid #444;
		padding: 0.25rem 0.5rem;
		text-align: left;
	}
	textarea {
		width: 100%;
		margin-bottom: 0.5rem;
	}
	button {
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		background: #444;
		color: #eee;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
	button:hover {
		background: #666;
	}
</style>
