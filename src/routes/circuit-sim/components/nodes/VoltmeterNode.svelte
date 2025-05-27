<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: any;
	export let selected: boolean = false;
</script>

<div class="voltmeter-node relative bg-white border-2 border-blue-400 rounded-lg shadow-lg min-w-[80px] min-h-[60px] p-3 {selected ? 'ring-2 ring-blue-500' : ''}">
	<!-- Voltmeter Symbol -->
	<div class="relative w-12 h-12 flex items-center justify-center mx-auto">
		<svg width="48" height="48" viewBox="0 0 48 48" class="text-blue-600">
			<circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2"/>
			<text x="24" y="28" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">V</text>
		</svg>
	</div>

	<!-- Component Label -->
	<div class="text-xs font-medium text-center text-blue-700 mt-1">
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
	
	.voltmeter-node:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
</style>
