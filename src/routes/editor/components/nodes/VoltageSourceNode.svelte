<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import ComponentIcon from '../ComponentIcon.svelte';
	import { getComponentColors } from '../../utils/component-colors';

	let { data, selected = false }: NodeProps = $props();

	let voltage = $derived((data as any)?.parameters?.voltage || '5V');
	let colors = $derived(getComponentColors('voltageSource'));
</script>

<div class="voltage-source-node {selected ? 'selected' : ''}" role="button" tabindex="0" style="--component-border: {colors.border}; --component-selected-border: {colors.selectedBorder}; --component-selected-shadow: {colors.selectedShadow}; --component-handle: {colors.handle};">
	<Handle type="source" position={Position.Right} id="left" class="handle-positive" />
	<Handle type="target" position={Position.Left} id="right" class="handle-negative" />
	
	<div class="component-body">
		<ComponentIcon type="voltageSource" class="w-12 h-6" />
		<div class="component-label">
			<div class="component-value">{voltage}</div>
		</div>
	</div>
</div>

<style>
	.voltage-source-node {
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

	.voltage-source-node.selected {
		border-color: var(--component-selected-border);
		box-shadow: 0 0 0 2px var(--component-selected-shadow);
	}

	/* Dark mode */
	:global(.dark) .voltage-source-node {
		background: #374151;
		border-color: var(--component-border);
	}

	:global(.dark) .voltage-source-node.selected {
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
	:global(.handle-negative) {
		width: 8px;
		height: 8px;
		background: var(--component-handle);
		border: 2px solid white;
		border-radius: 50%;
	}

	:global(.handle-positive) {
		right: -6px;
	}

	:global(.handle-negative) {
		left: -6px;
	}

	/* Dark mode */
	:global(.dark) .voltage-source-node {
		background: #374151;
		border-color: var(--component-border);
	}

	:global(.dark) .voltage-source-node.selected {
		border-color: var(--component-selected-border);
		box-shadow: 0 0 0 2px var(--component-selected-shadow);
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}
</style>
