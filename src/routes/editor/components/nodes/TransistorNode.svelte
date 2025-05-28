<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import ComponentIcon from '../ComponentIcon.svelte';

	let { data, selected = false }: NodeProps = $props();

	let transistorType = $derived(data.parameters?.type || '2N3904');
	let configuration = $derived(data.parameters?.configuration || 'NPN');
</script>

<div class="transistor-node {selected ? 'selected' : ''}" role="button" tabindex="0">
	<Handle type="target" position={Position.Left} class="handle-base" />
	<Handle type="source" position={Position.Top} class="handle-collector" />
	<Handle type="source" position={Position.Bottom} class="handle-emitter" />
	
	<div class="component-body">
		<ComponentIcon type="transistor" class="w-12 h-8 text-emerald-600" />
		<div class="component-label">
			<div class="component-value">{transistorType}</div>
			<div class="component-type">{configuration}</div>
		</div>
	</div>
</div>

<style>
	.transistor-node {
		background: #f8fafc;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		padding: 8px;
		min-width: 80px;
		position: relative;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.transistor-node.selected {
		border-color: #10b981;
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
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

	.component-type {
		font-size: 8px;
		font-weight: 500;
		color: #6b7280;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	}

	:global(.handle-base),
	:global(.handle-collector),
	:global(.handle-emitter) {
		width: 8px;
		height: 8px;
		background: #6b7280;
		border: 2px solid white;
		border-radius: 50%;
	}

	:global(.handle-base) {
		left: -6px;
	}

	:global(.handle-collector) {
		top: -6px;
		background: #dc2626;
	}

	:global(.handle-emitter) {
		bottom: -6px;
		background: #1f2937;
	}

	/* Dark mode */
	:global(.dark) .transistor-node {
		background: #374151;
		border-color: #4b5563;
	}

	:global(.dark) .transistor-node.selected {
		border-color: #34d399;
		box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.2);
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}

	:global(.dark) .component-type {
		color: #9ca3af;
	}
</style>
