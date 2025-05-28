<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import ComponentIcon from '../ComponentIcon.svelte';

	let { data, selected = false }: NodeProps = $props();

	let capacitance = $derived(data.parameters?.capacitance || '1μ');
</script>

<div class="capacitor-node {selected ? 'selected' : ''}" role="button" tabindex="0">
	<Handle type="target" position={Position.Left} class="handle-left" />
	<Handle type="source" position={Position.Right} class="handle-right" />
	
	<div class="component-body">
		<ComponentIcon type="capacitor" class="w-12 h-6 text-green-600" />
		<div class="component-label">
			<div class="component-value">{capacitance}</div>
		</div>
	</div>
</div>

<style>
	.capacitor-node {
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



	.capacitor-node.selected {
		border-color: #16a34a;
		box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
		background: #f1f5f9;
	}

	/* Dark mode */
	:global(.dark) .capacitor-node {
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
	:global(.dark) .capacitor-node {
		background: #1f2937;
		border-color: #374151;
	}

	:global(.dark) .capacitor-node.selected {
		border-color: #60a5fa;
		box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}
</style>
