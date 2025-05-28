<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import ComponentIcon from '../ComponentIcon.svelte';

	let { data, selected = false }: NodeProps = $props();
</script>

<div class="ground-node {selected ? 'selected' : ''}" role="button" tabindex="0">
	<Handle type="target" position={Position.Top} class="handle-top" />
	
	<div class="component-body">
		<ComponentIcon type="ground" class="w-8 h-8 text-gray-700" />
		<div class="component-label">
			<div class="component-value">GND</div>
		</div>
	</div>
</div>

<style>
	.ground-node {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 6px;
		min-width: 60px;
		position: relative;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.ground-node:hover {
		border-color: #6b7280;
		box-shadow: 0 4px 12px rgba(107, 114, 128, 0.15);
	}

	.ground-node.selected {
		border-color: #6b7280;
		box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.2);
	}

	.component-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.component-label {
		text-align: center;
	}

	.component-value {
		font-size: 9px;
		font-weight: 700;
		color: #374151;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	}

	:global(.handle-top) {
		width: 8px;
		height: 8px;
		background: #6b7280;
		border: 2px solid white;
		border-radius: 50%;
		top: -6px;
	}

	:global(.handle-top:hover) {
		background: #374151;
		transform: scale(1.2);
	}

	/* Dark mode */
	:global(.dark) .ground-node {
		background: #1f2937;
		border-color: #374151;
	}

	:global(.dark) .ground-node:hover {
		border-color: #9ca3af;
	}

	:global(.dark) .ground-node.selected {
		border-color: #9ca3af;
		box-shadow: 0 0 0 2px rgba(156, 163, 175, 0.2);
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}
</style>
