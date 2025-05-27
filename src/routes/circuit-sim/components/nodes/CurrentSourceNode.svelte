<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: any;
	export let selected: boolean = false;
</script>

<div class="current-source-node relative bg-white border-2 border-yellow-400 rounded-lg shadow-lg min-w-[100px] min-h-[60px] p-3 {selected ? 'ring-2 ring-blue-500' : ''}">
	<!-- Current Source Symbol -->
	<div class="relative w-16 h-12 flex items-center justify-center">
		<svg width="64" height="48" viewBox="0 0 64 48" class="text-yellow-600">
			<circle cx="32" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="2"/>
			<!-- Arrow indicating current direction -->
			<path d="M24 24 L40 24" stroke="currentColor" stroke-width="2" marker-end="url(#arrow-current)"/>
			<path d="M28 20 L32 24 L28 28" stroke="currentColor" stroke-width="2" fill="none"/>
		</svg>
		
		<!-- Arrow marker definition -->
		<svg style="position: absolute; width: 0; height: 0;">
			<defs>
				<marker id="arrow-current" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
					<path d="M0,0 L0,6 L9,3 z" fill="currentColor"/>
				</marker>
			</defs>
		</svg>
	</div>

	<!-- Component Label -->
	<div class="text-xs font-medium text-center text-yellow-700 mt-1">
		{data.label || 'I'}
	</div>

	<!-- Value Display -->
	<div class="text-xs text-center text-yellow-600">
		{data.parameters?.current || '1A'}
	</div>

	<!-- Handles -->
	<Handle
		type="source"
		position={Position.Left}
		style="background: #eab308; width: 8px; height: 8px; border: 2px solid white;"
	/>
	<Handle
		type="target"
		position={Position.Right}
		style="background: #eab308; width: 8px; height: 8px; border: 2px solid white;"
	/>
</div>

<style>
	.current-source-node {
		transition: all 0.2s ease;
	}
	
	.current-source-node:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
</style>
