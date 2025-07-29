<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import ComponentIcon from '../ComponentIcon.svelte';
	import { getComponentColors } from '../../utils/component-colors';

	let { data, selected = false }: NodeProps = $props();

	let range = $derived((data as any)?.parameters?.range || '10V');
	let colors = $derived(getComponentColors('voltmeter'));
</script>

<div class="voltmeter-node {selected ? 'selected' : ''}" role="button" tabindex="0" style="--component-border: {colors.border}; --component-selected-border: {colors.selectedBorder}; --component-selected-shadow: {colors.selectedShadow}; --component-handle: {colors.handle};">
	<Handle
		type="target"
		position={Position.Left}
		id="left"
		style="background: var(--component-handle); width: 8px; height: 8px; border: 2px solid white;"
	/>
	<Handle
		type="target"
		position={Position.Right}
		id="right"
		style="background: var(--component-handle); width: 8px; height: 8px; border: 2px solid white;"
	/>
	
	<div class="component-body">
		<ComponentIcon type="voltmeter" class="w-12 h-6" />
		<div class="component-label">
			<div class="component-value">{range}</div>
		</div>
	</div>
</div>

<style>
	.voltmeter-node {
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

	.voltmeter-node.selected {
		border-color: var(--component-selected-border);
		box-shadow: 0 0 0 2px var(--component-selected-shadow);
	}

	/* Dark mode */
	:global(.dark) .voltmeter-node {
		background: #374151;
		border-color: var(--component-border);
	}

	:global(.dark) .voltmeter-node.selected {
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

	/* Dark mode */
	:global(.dark) .voltmeter-node {
		background: #374151;
		border-color: var(--component-border);
	}

	:global(.dark) .voltmeter-node.selected {
		border-color: var(--component-selected-border);
		box-shadow: 0 0 0 2px var(--component-selected-shadow);
	}

	:global(.dark) .component-value {
		color: #d1d5db;
	}
</style>
