<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import { fade, fly } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';

	export let data: {
		userId: string;
		name: string;
		color: string;
		action?: 'idle' | 'dragging' | 'selecting' | 'drawing';
		nodeId?: string;
		lastUpdated: number;
	};

	let isVisible = false;

	onMount(() => {
		isVisible = true;
	});

	onDestroy(() => {
		isVisible = false;
	});

	// Auto-hide cursor if it's older than 30 seconds
	$: {
		const age = Date.now() - data.lastUpdated;
		if (age > 30000) {
			isVisible = false;
		}
	}
</script>

{#if isVisible}
	<div 
		class="cursor-node"
		style="--cursor-color: {data.color}"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
	>
		<!-- Cursor triangle -->
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M1 1L8 14L10.5 7.5L15 5.5L1 1Z" fill={data.color} stroke="#ffffff" stroke-width="1"/>
		</svg>
		
		<!-- User label with action status -->
		<div class="cursor-label" in:fly={{ y: -10, duration: 150 }}>
			{data.name}
			{#if data.action === 'dragging'}
				<span class="action-status">⟳</span>
			{:else if data.action === 'selecting'}
				<span class="action-status">☑</span>
			{:else if data.action === 'drawing'}
				<span class="action-status">✏</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.cursor-node {
		position: relative;
		pointer-events: none;
		z-index: 1000;
		transform: translate(-8px, -8px); /* Center the cursor */
	}

	.cursor-label {
		position: absolute;
		top: -24px;
		left: 8px;
		background-color: var(--cursor-color);
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 12px;
		white-space: nowrap;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
		pointer-events: none;
	}

	.action-status {
		margin-left: 4px;
		font-size: 10px;
	}
</style> 