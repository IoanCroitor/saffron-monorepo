<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import ComponentIcon from '../ComponentIcon.svelte';

	let { data, selected = false }: NodeProps = $props();

	let diodeType = $derived(data.parameters?.type || '1N4148');
</script>

<div class="diode-node {selected ? 'selected' : ''}" role="button" tabindex="0">
	<Handle type="target" position={Position.Left} class="handle-left" />
	<Handle type="source" position={Position.Right} class="handle-right" />
	
	<div class="component-body">
		<ComponentIcon type="diode" class="w-12 h-6 text-orange-500" />
		<div class="component-label">
			<div class="component-value">{diodeType}</div>
		</div>
	</div>
</div>

<style>
	.diode-node {
		background: #f8fafc;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		padding: 8px;
		min-width: 80px;
		position: relative;
		transition: all 0.2s ease;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}



	.diode-node.selected {
		border-color: #f97316;
		box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
	}

	/* Dark mode */
	:global(.dark) .diode-node {
		background: #374151;
		border-color: #4b5563;
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
		font-size: 9px;
		font-weight: 600;
		color: #374151;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}

	:global(.handle-left),
	:global(.handle-right) {
		width: 8px;
		height: 8px;
		background: #6b7280;
		border: 2px solid #ffffff;
		border-radius: 50%;
	}

	:global(.dark) :global(.handle-left),
	:global(.dark) :global(.handle-right) {
		background: #9ca3af;
		border-color: #1f2937;
	}

	:global(.dark) .diode-node.selected {
		border-color: #f97316;
		box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
	}

	:global(.handle-left) {
		left: -6px;
	}

	:global(.handle-right) {
		right: -6px;
	}
</style>
