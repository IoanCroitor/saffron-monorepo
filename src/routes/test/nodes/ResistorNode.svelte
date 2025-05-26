<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';

	export let data: {
		value?: string;
		name?: string;
		orientation?: 'horizontal' | 'vertical';
		rotation?: number;
		tolerance?: string;
		power?: string;
	} = {};

	$: isVertical = data.orientation === 'vertical';
	$: rotation = data.rotation || 0;
	$: displayValue = data.value || '1kΩ';
	$: componentName = data.name || 'R1';
</script>

<div 
	class="resistor-node" 
	class:vertical={isVertical}
	style="transform: rotate({rotation}deg)"
>
	<!-- Connection Handles -->
	{#if isVertical}
		<Handle
			type="source"
			position={Position.Top}
			id="A"
			style="background: #00ff00; width: 8px; height: 8px;"
		/>
		<Handle
			type="target"
			position={Position.Bottom}
			id="B"
			style="background: #00ff00; width: 8px; height: 8px;"
		/>
	{:else}
		<Handle
			type="source"
			position={Position.Left}
			id="A"
			style="background: #00ff00; width: 8px; height: 8px;"
		/>
		<Handle
			type="target"
			position={Position.Right}
			id="B"
			style="background: #00ff00; width: 8px; height: 8px;"
		/>
	{/if}

	<!-- Resistor Symbol -->
	<div class="component-body">
		<svg 
			width={isVertical ? "20" : "60"} 
			height={isVertical ? "60" : "20"} 
			viewBox={isVertical ? "0 0 20 60" : "0 0 60 20"}
			class="resistor-symbol"
		>
			{#if isVertical}
				<!-- Vertical resistor -->
				<path 
					d="M10,0 L10,10 L6,12 L14,16 L6,20 L14,24 L6,28 L14,32 L6,36 L14,40 L6,44 L14,48 L10,50 L10,60" 
					stroke="currentColor" 
					fill="none" 
					stroke-width="2"
				/>
				<!-- Connection lines -->
				<circle cx="10" cy="0" r="2" fill="#00ff00" opacity="0.7"/>
				<circle cx="10" cy="60" r="2" fill="#00ff00" opacity="0.7"/>
			{:else}
				<!-- Horizontal resistor -->
				<path 
					d="M0,10 L10,10 L12,6 L16,14 L20,6 L24,14 L28,6 L32,14 L36,6 L40,14 L44,6 L48,14 L50,10 L60,10" 
					stroke="currentColor" 
					fill="none" 
					stroke-width="2"
				/>
				<!-- Connection points -->
				<circle cx="0" cy="10" r="2" fill="#00ff00" opacity="0.7"/>
				<circle cx="60" cy="10" r="2" fill="#00ff00" opacity="0.7"/>
			{/if}
		</svg>
	</div>

	<!-- Component Labels -->
	<div class="component-labels">
		<div class="component-name">{componentName}</div>
		<div class="component-value">{displayValue}</div>
		{#if data.tolerance}
			<div class="component-tolerance">±{data.tolerance}</div>
		{/if}
		{#if data.power}
			<div class="component-power">{data.power}</div>
		{/if}
	</div>
</div>

<style>
	.resistor-node {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: transparent;
		cursor: pointer;
		user-select: none;
		transition: all 0.2s ease;
	}

	.resistor-node:hover {
		transform: scale(1.05);
	}

	.resistor-node.vertical {
		flex-direction: row;
		align-items: center;
	}

	.component-body {
		position: relative;
		z-index: 1;
	}

	.resistor-symbol {
		color: #ffffff;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.component-labels {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		pointer-events: none;
		z-index: 2;
	}

	.vertical .component-labels {
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-left: 8px;
		align-items: flex-start;
	}

	.component-name {
		font-size: 10px;
		font-weight: 600;
		color: #ffffff;
		background: rgba(0, 0, 0, 0.7);
		padding: 1px 3px;
		border-radius: 2px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}

	.component-value {
		font-size: 9px;
		font-weight: 500;
		color: #00ff88;
		background: rgba(0, 0, 0, 0.7);
		padding: 1px 3px;
		border-radius: 2px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}

	.component-tolerance,
	.component-power {
		font-size: 8px;
		color: #cccccc;
		background: rgba(0, 0, 0, 0.7);
		padding: 1px 2px;
		border-radius: 2px;
	}

	/* Handle styling improvements */
	:global(.resistor-node .svelte-flow__handle) {
		border: 2px solid #ffffff;
		background: #00ff00 !important;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;
	}

	:global(.resistor-node .svelte-flow__handle:hover) {
		background: #00ff88 !important;
		transform: scale(1.2);
		box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
	}

	:global(.resistor-node.selected) {
		filter: drop-shadow(0 0 8px rgba(0, 128, 255, 0.8));
	}

	:global(.resistor-node.selected .component-name) {
		background: rgba(0, 128, 255, 0.8);
		color: #ffffff;
	}
</style>
