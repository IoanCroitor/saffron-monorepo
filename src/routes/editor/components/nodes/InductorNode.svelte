<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import ComponentIcon from '../ComponentIcon.svelte';

	let { data, selected = false }: NodeProps = $props();

	let inductance = $derived(data.parameters?.inductance || '1m');
</script>

<div class="inductor-node {selected ? 'selected' : ''}" role="button" tabindex="0">
	<Handle type="target" position={Position.Left} class="handle-left" />
	<Handle type="source" position={Position.Right} class="handle-right" />
	
	<div class="component-body">
		<ComponentIcon type="inductor" class="w-12 h-6 text-purple-600" />
		<div class="component-label">
			<div class="component-value">{inductance}</div>
		</div>
	</div>
</div>

<style>
	.inductor-node {
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

	.inductor-node.selected {
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
		font-size: 10px;
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

	:global(.handle-left) {
		left: -6px;
	}

	:global(.handle-right) {
		right: -6px;
	}

	/* Dark mode */
	:global(.dark) .inductor-node {
		background: #374151;
		border-color: #4b5563;
	}

	:global(.dark) .inductor-node.selected {
		border-color: #8b5cf6;
		box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}
</style>
