<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: any;
	export let selected: boolean = false;
</script>

<div class="ammeter-node relative bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg min-w-[80px] min-h-[60px] p-3 {selected ? 'ring-2 ring-red-500 border-red-400' : ''}">
	<!-- Ammeter Symbol -->
	<div class="relative w-12 h-12 flex items-center justify-center mx-auto">
		<svg width="48" height="48" viewBox="0 0 48 48" class="text-red-600 dark:text-red-400">
			<circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2"/>
			<text x="24" y="28" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">A</text>
		</svg>
	</div>

	<!-- Component Label -->
	<div class="text-xs font-medium text-center text-red-700 dark:text-red-300 mt-1">
		{data.label || 'AM'}
	</div>

	<!-- Handles -->
	<Handle
		type="target"
		position={Position.Left}
		style="background: #ef4444; width: 8px; height: 8px; border: 2px solid white;"
	/>
	<Handle
		type="source"
		position={Position.Right}
		style="background: #ef4444; width: 8px; height: 8px; border: 2px solid white;"
	/>
</div>

<style>
	.ammeter-node {
		transition: all 0.2s ease;
	}
</style>
