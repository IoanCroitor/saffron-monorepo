<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import ComponentIcon from '../ComponentIcon.svelte';
	import { getComponentColors } from '../../utils/component-colors';

	let { data, selected = false }: NodeProps = $props();

	let opampType = $derived((data as any)?.parameters?.type || 'LM741');
	let colors = $derived(getComponentColors('opamp'));
</script>

<div class="op-amp-node {selected ? 'selected' : ''}" role="button" tabindex="0" style="--component-border: {colors.border}; --component-selected-border: {colors.selectedBorder}; --component-selected-shadow: {colors.selectedShadow}; --component-handle: {colors.handle};">
	<Handle type="target" position={Position.Left} id="positive" class="handle-positive" />
	<Handle type="target" position={Position.Left} id="negative" class="handle-negative" />
	<Handle type="source" position={Position.Right} id="output" class="handle-output" />
	<Handle type="target" position={Position.Top} id="vcc" class="handle-vcc" />
	<Handle type="target" position={Position.Bottom} id="vee" class="handle-vee" />
	
	<div class="component-body">
		<ComponentIcon type="opamp" class="w-12 h-6" />
		<div class="component-label">
			<div class="component-value">{opampType}</div>
		</div>
	</div>
</div>

<style>
	.op-amp-node {
		background: #f8fafc;
		border: 2px solid var(--component-border);
		border-radius: 8px;
		padding: 8px;
		min-width: 80px;
		position: relative;
		transition: all 0.2s ease;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.op-amp-node.selected {
		border-color: var(--component-selected-border);
		box-shadow: 0 0 0 2px var(--component-selected-shadow);
	}

	/* Dark mode */
	:global(.dark) .op-amp-node {
		background: #374151;
		border-color: var(--component-border);
	}

	:global(.dark) .op-amp-node.selected {
		border-color: var(--component-selected-border);
		box-shadow: 0 0 0 2px var(--component-selected-shadow);
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
	:global(.handle-negative),
	:global(.handle-output),
	:global(.handle-vcc),
	:global(.handle-vee) {
		width: 8px;
		height: 8px;
		background: var(--component-handle);
		border: 2px solid white;
		border-radius: 50%;
	}

	:global(.handle-positive) {
		top: 30%;
		left: -6px;
	}

	:global(.handle-negative) {
		top: 70%;
		left: -6px;
	}

	:global(.handle-output) {
		top: 50%;
		right: -6px;
	}

	:global(.handle-vcc) {
		left: 50%;
		top: -6px;
	}

	:global(.handle-vee) {
		left: 50%;
		bottom: -6px;
	}

	/* Dark mode */
	:global(.dark) .op-amp-node {
		background: #374151;
		border-color: var(--component-border);
	}

	:global(.dark) .op-amp-node.selected {
		border-color: var(--component-selected-border);
		box-shadow: 0 0 0 2px var(--component-selected-shadow);
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}
</style>
