<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: any;
	export let selected: boolean = false;
</script>

<div class="op-amp-node relative bg-slate-50 border-2 border-slate-300 rounded-lg shadow-lg min-w-[80px] min-h-[60px] p-2 {selected ? 'ring-2 ring-slate-500 border-slate-400' : ''}">
	<!-- Op-Amp Triangle Shape -->
	<div class="relative w-16 h-12 flex items-center justify-center">
		<svg width="64" height="48" viewBox="0 0 64 48" class="text-slate-700">
			<!-- Triangle -->
			<path d="M8 4 L56 24 L8 44 Z" fill="none" stroke="currentColor" stroke-width="2"/>
			
			<!-- + symbol -->
			<text x="18" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="currentColor">+</text>
			
			<!-- - symbol -->
			<text x="18" y="32" font-size="14" font-weight="bold" text-anchor="middle" fill="currentColor">−</text>
		</svg>
	</div>

	<!-- Component Label -->
	<div class="text-xs font-medium text-center text-slate-700 mt-1">
		{data.label || 'OpAmp'}
	</div>

	<!-- Value Display -->
	<div class="text-xs text-center text-slate-500">
		Gain: {data.parameters?.gain || '100k'}
	</div>

	<!-- Handles -->
	<!-- Non-inverting input (+) -->
	<Handle
		type="target"
		position={Position.Left}
		id="positive"
		style="top: 30%; background: #10b981; width: 8px; height: 8px; border: 2px solid white;"
	/>
	
	<!-- Inverting input (-) -->
	<Handle
		type="target"
		position={Position.Left}
		id="negative"
		style="top: 70%; background: #ef4444; width: 8px; height: 8px; border: 2px solid white;"
	/>
	
	<!-- Output -->
	<Handle
		type="source"
		position={Position.Right}
		id="output"
		style="top: 50%; background: #3b82f6; width: 8px; height: 8px; border: 2px solid white;"
	/>
	
	<!-- VCC (Power Supply +) -->
	<Handle
		type="target"
		position={Position.Top}
		id="vcc"
		style="left: 50%; background: #f59e0b; width: 8px; height: 8px; border: 2px solid white;"
	/>
	
	<!-- VEE (Power Supply -) -->
	<Handle
		type="target"
		position={Position.Bottom}
		id="vee"
		style="left: 50%; background: #8b5cf6; width: 8px; height: 8px; border: 2px solid white;"
	/>
</div>

<style>
	.op-amp-node {
		transition: all 0.2s ease;
	}
	
	/* Dark mode */
	:global(.dark) .op-amp-node {
		background: #374151 !important;
		border-color: #4b5563 !important;
	}
	
	:global(.dark) .op-amp-node svg {
		color: #d1d5db !important;
	}
	
	:global(.dark) .op-amp-node .text-slate-700 {
		color: #d1d5db !important;
	}
	
	:global(.dark) .op-amp-node .text-slate-500 {
		color: #9ca3af !important;
	}
</style>
