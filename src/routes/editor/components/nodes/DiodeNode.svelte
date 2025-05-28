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
		<ComponentIcon type="diode" class="w-12 h-6 text-purple-600" />
		<div class="component-label">
			<div class="component-value">{diodeType}</div>
		</div>
	</div>
</div>

<style>
	.diode-node {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 8px;
		min-width: 80px;
		position: relative;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.diode-node:hover {
		border-color: #8b5cf6;
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
	}

	.diode-node.selected {
		border-color: #8b5cf6;
		box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
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

	:global(.handle-left),
	:global(.handle-right) {
		width: 8px;
		height: 8px;
		background: #6b7280;
		border: 2px solid white;
		border-radius: 50%;
	}

	:global(.handle-left:hover),
	:global(.handle-right:hover) {
		background: #8b5cf6;
		transform: scale(1.2);
	}

	:global(.handle-left) {
		left: -6px;
	}

	:global(.handle-right) {
		right: -6px;
	}

	/* Dark mode */
	:global(.dark) .diode-node {
		background: #1f2937;
		border-color: #374151;
	}

	:global(.dark) .diode-node:hover {
		border-color: #a78bfa;
	}

	:global(.dark) .diode-node.selected {
		border-color: #a78bfa;
		box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.2);
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}
</style>
