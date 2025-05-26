<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';

	export let data: {
		voltage?: string;
		name?: string;
		powerType?: 'vcc' | 'vdd' | 'vss';
		rotation?: number;
		current?: string;
	} = {};

	$: rotation = data.rotation || 0;
	$: displayVoltage = data.voltage || '5V';
	$: componentName = data.name || 'VCC';
	$: powerType = data.powerType || 'vcc';
	$: isNegative = powerType === 'vss';
</script>

<div 
	class="power-node" 
	class:negative={isNegative}
	style="transform: rotate({rotation}deg)"
>
	<!-- Connection Handle -->
	<Handle
		type="source"
		position={Position.Bottom}
		id="OUT"
		style="background: #ff6b00; width: 10px; height: 10px;"
	/>

	<!-- Power Symbol -->
	<div class="component-body">
		<svg width="24" height="32" viewBox="0 0 24 32" class="power-symbol">
			{#if isNegative}
				<!-- VSS/Negative supply symbol -->
				<g transform="translate(12, 16)">
					<!-- Downward arrow -->
					<path 
						d="M0,-8 L0,8 M-6,2 L0,8 L6,2" 
						stroke="currentColor" 
						fill="none" 
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<!-- Negative signs -->
					<line x1="-8" y1="-4" x2="-3" y2="-4" stroke="currentColor" stroke-width="2"/>
					<line x1="3" y1="-4" x2="8" y2="-4" stroke="currentColor" stroke-width="2"/>
				</g>
			{:else}
				<!-- VCC/VDD positive supply symbol -->
				<g transform="translate(12, 16)">
					<!-- Upward arrow -->
					<path 
						d="M0,8 L0,-8 M-6,-2 L0,-8 L6,-2" 
						stroke="currentColor" 
						fill="none" 
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<!-- Positive signs -->
					<line x1="-8" y1="4" x2="-3" y2="4" stroke="currentColor" stroke-width="2"/>
					<line x1="-5.5" y1="2.5" x2="-5.5" y2="5.5" stroke="currentColor" stroke-width="2"/>
					<line x1="3" y1="4" x2="8" y2="4" stroke="currentColor" stroke-width="2"/>
					<line x1="5.5" y1="2.5" x2="5.5" y2="5.5" stroke="currentColor" stroke-width="2"/>
				</g>
			{/if}
			
			<!-- Connection point -->
			<circle cx="12" cy="32" r="2" fill="#ff6b00" opacity="0.7"/>
		</svg>
	</div>

	<!-- Component Labels -->
	<div class="component-labels">
		<div class="component-name">{componentName}</div>
		<div class="component-voltage">{displayVoltage}</div>
		{#if data.current}
			<div class="component-current">{data.current}</div>
		{/if}
	</div>
</div>

<style>
	.power-node {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: transparent;
		cursor: pointer;
		user-select: none;
		transition: all 0.2s ease;
	}

	.power-node:hover {
		transform: scale(1.05);
	}

	.component-body {
		position: relative;
		z-index: 1;
	}

	.power-symbol {
		color: #ff6b00;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.negative .power-symbol {
		color: #ff3366;
	}

	.component-labels {
		position: absolute;
		top: -25px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		pointer-events: none;
		z-index: 2;
	}

	.component-name {
		font-size: 10px;
		font-weight: 700;
		color: #ffffff;
		background: rgba(0, 0, 0, 0.8);
		padding: 2px 4px;
		border-radius: 3px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
		border: 1px solid #ff6b00;
	}

	.negative .component-name {
		border-color: #ff3366;
	}

	.component-voltage {
		font-size: 9px;
		font-weight: 600;
		color: #ff6b00;
		background: rgba(0, 0, 0, 0.8);
		padding: 1px 3px;
		border-radius: 2px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}

	.negative .component-voltage {
		color: #ff3366;
	}

	.component-current {
		font-size: 8px;
		color: #cccccc;
		background: rgba(0, 0, 0, 0.7);
		padding: 1px 2px;
		border-radius: 2px;
	}

	/* Handle styling improvements */
	:global(.power-node .svelte-flow__handle) {
		border: 2px solid #ffffff;
		background: #ff6b00 !important;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;
	}

	:global(.power-node.negative .svelte-flow__handle) {
		background: #ff3366 !important;
	}

	:global(.power-node .svelte-flow__handle:hover) {
		transform: scale(1.2);
		box-shadow: 0 0 8px rgba(255, 107, 0, 0.6);
	}

	:global(.power-node.negative .svelte-flow__handle:hover) {
		box-shadow: 0 0 8px rgba(255, 51, 102, 0.6);
	}

	:global(.power-node.selected) {
		filter: drop-shadow(0 0 8px rgba(0, 128, 255, 0.8));
	}

	:global(.power-node.selected .component-name) {
		background: rgba(0, 128, 255, 0.8);
		color: #ffffff;
		border-color: #0080ff;
	}
</style>
