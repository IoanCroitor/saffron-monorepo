<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: any;
	export let selected: boolean = false;
</script>

<div class="probe-node relative bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg min-w-[60px] min-h-[40px] p-2 {selected ? 'ring-2 ring-purple-500 border-purple-400' : ''}">
	<!-- Probe Symbol -->
	<div class="relative w-8 h-6 flex items-center justify-center mx-auto">
		<svg width="32" height="24" viewBox="0 0 32 24" class="text-purple-600 dark:text-purple-400">
			<circle cx="24" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
			<line x1="8" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/>
			<polygon points="8,8 8,16 12,12" fill="currentColor"/>
		</svg>
	</div>

	<!-- Component Label -->
	<div class="text-xs font-medium text-center text-purple-700 dark:text-purple-300 mt-1">
		{data.label || 'PROBE'}
	</div>

	<!-- Handle -->
	<Handle
		type="target"
		position={Position.Left}
		style="background: #a855f7; width: 8px; height: 8px; border: 2px solid white;"
	/>
</div>

<style>
	.probe-node {
		transition: all 0.2s ease;
	}
</style>
