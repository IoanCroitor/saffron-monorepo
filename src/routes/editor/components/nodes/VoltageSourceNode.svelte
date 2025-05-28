<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import ComponentIcon from '../ComponentIcon.svelte';

	let { data, selected = false }: NodeProps = $props();

	let voltage = $derived(data.parameters?.voltage || '5V');
</script>

<div class="voltage-source-node {selected ? 'selected' : ''}" role="button" tabindex="0">
	<Handle type="source" position={Position.Right} class="handle-positive" />
	<Handle type="target" position={Position.Left} class="handle-negative" />
	
	<div class="component-body">
		<ComponentIcon type="voltageSource" class="w-12 h-6 text-orange-600" />
		<div class="component-label">
			<div class="component-value">{voltage}</div>
		</div>
	</div>
</div>

<style>
	.voltage-source-node {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 8px;
		min-width: 80px;
		position: relative;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.voltage-source-node:hover {
		border-color: #f59e0b;
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
	}

	.voltage-source-node.selected {
		border-color: #f59e0b;
		box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
	}

	.component-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.component-label {
		text-align: center;
	}

	.component-value {
		font-size: 10px;
		font-weight: 600;
		color: #374151;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	}

	:global(.handle-positive),
	:global(.handle-negative) {
		width: 8px;
		height: 8px;
		border: 2px solid white;
		border-radius: 50%;
	}

	:global(.handle-positive) {
		background: #dc2626;
		right: -6px;
	}

	:global(.handle-negative) {
		background: #1f2937;
		left: -6px;
	}

	:global(.handle-positive:hover),
	:global(.handle-negative:hover) {
		transform: scale(1.2);
	}

	/* Dark mode */
	:global(.dark) .voltage-source-node {
		background: #1f2937;
		border-color: #374151;
	}

	:global(.dark) .voltage-source-node:hover {
		border-color: #fbbf24;
	}

	:global(.dark) .voltage-source-node.selected {
		border-color: #fbbf24;
		box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}
</style>
