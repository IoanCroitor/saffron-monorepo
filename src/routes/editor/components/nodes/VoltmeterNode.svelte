<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: any;
	export let selected: boolean = false;
</script>

<div class="voltmeter-node relative bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg min-w-[80px] min-h-[60px] p-3 {selected ? 'ring-2 ring-blue-500 border-blue-400' : ''}">
	<!-- Voltmeter Symbol -->
	<div class="relative w-12 h-12 flex items-center justify-center mx-auto">
		<svg width="48" height="48" viewBox="0 0 48 48" class="text-blue-600 dark:text-blue-400">
			<circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2"/>
			<text x="24" y="28" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">V</text>
		</svg>
	</div>

	<!-- Component Label -->
	<div class="text-xs font-medium text-center text-blue-700 dark:text-blue-300 mt-1">
		{data.label || 'VM'}
	</div>

	<!-- Handles -->
	<Handle
		type="target"
		position={Position.Left}
		style="background: #3b82f6; width: 8px; height: 8px; border: 2px solid white;"
	/>
	<Handle
		type="target"
		position={Position.Right}
		style="background: #3b82f6; width: 8px; height: 8px; border: 2px solid white;"
	/>
</div>

<style>
	.voltmeter-node {
		transition: all 0.2s ease;
	}
</style>
