<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';

	export let data: {
		value?: string;
		name?: string;
		orientation?: 'horizontal' | 'vertical';
		rotation?: number;
		voltage?: string;
		type?: 'ceramic' | 'electrolytic' | 'tantalum' | 'film';
	} = {};

	$: isVertical = data.orientation === 'vertical';
	$: rotation = data.rotation || 0;
	$: displayValue = data.value || '100nF';
	$: componentName = data.name || 'C1';
	$: isElectrolytic = data.type === 'electrolytic';
</script>

<div 
	class="capacitor-node" 
	class:vertical={isVertical}
	class:electrolytic={isElectrolytic}
	style="transform: rotate({rotation}deg)"
>
	<!-- Connection Handles -->
	{#if isVertical}
		<Handle
			type="source"
			position={Position.Top}
			id="A"
			style="background: #00aaff; width: 8px; height: 8px;"
		/>
		<Handle
			type="target"
			position={Position.Bottom}
			id="B"
			style="background: #00aaff; width: 8px; height: 8px;"
		/>
	{:else}
		<Handle
			type="source"
			position={Position.Left}
			id="A"
			style="background: #00aaff; width: 8px; height: 8px;"
		/>
		<Handle
			type="target"
			position={Position.Right}
			id="B"
			style="background: #00aaff; width: 8px; height: 8px;"
		/>
	{/if}

	<!-- Capacitor Symbol -->
	<div class="component-body">
		<svg 
			width={isVertical ? "20" : "40"} 
			height={isVertical ? "40" : "20"} 
			viewBox={isVertical ? "0 0 20 40" : "0 0 40 20"}
			class="capacitor-symbol"
		>
			{#if isVertical}
				<!-- Vertical capacitor -->
				{#if isElectrolytic}
					<!-- Electrolytic capacitor with polarity -->
					<line x1="10" y1="0" x2="10" y2="15" stroke="currentColor" stroke-width="2"/>
					<line x1="5" y1="15" x2="15" y2="15" stroke="currentColor" stroke-width="3"/>
					<path d="M5,17 Q10,25 15,17" fill="none" stroke="currentColor" stroke-width="3"/>
					<line x1="10" y1="25" x2="10" y2="40" stroke="currentColor" stroke-width="2"/>
					<!-- Polarity indicator -->
					<text x="16" y="12" fill="currentColor" font-size="8" font-weight="bold">+</text>
				{:else}
					<!-- Standard capacitor -->
					<line x1="10" y1="0" x2="10" y2="15" stroke="currentColor" stroke-width="2"/>
					<line x1="5" y1="15" x2="15" y2="15" stroke="currentColor" stroke-width="3"/>
					<line x1="5" y1="25" x2="15" y2="25" stroke="currentColor" stroke-width="3"/>
					<line x1="10" y1="25" x2="10" y2="40" stroke="currentColor" stroke-width="2"/>
				{/if}
				<!-- Connection points -->
				<circle cx="10" cy="0" r="2" fill="#00aaff" opacity="0.7"/>
				<circle cx="10" cy="40" r="2" fill="#00aaff" opacity="0.7"/>
			{:else}
				<!-- Horizontal capacitor -->
				{#if isElectrolytic}
					<!-- Electrolytic capacitor with polarity -->
					<line x1="0" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="2"/>
					<line x1="15" y1="5" x2="15" y2="15" stroke="currentColor" stroke-width="3"/>
					<path d="M17,5 Q25,10 17,15" fill="none" stroke="currentColor" stroke-width="3"/>
					<line x1="25" y1="10" x2="40" y2="10" stroke="currentColor" stroke-width="2"/>
					<!-- Polarity indicator -->
					<text x="12" y="5" fill="currentColor" font-size="8" font-weight="bold">+</text>
				{:else}
					<!-- Standard capacitor -->
					<line x1="0" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="2"/>
					<line x1="15" y1="5" x2="15" y2="15" stroke="currentColor" stroke-width="3"/>
					<line x1="25" y1="5" x2="25" y2="15" stroke="currentColor" stroke-width="3"/>
					<line x1="25" y1="10" x2="40" y2="10" stroke="currentColor" stroke-width="2"/>
				{/if}
				<!-- Connection points -->
				<circle cx="0" cy="10" r="2" fill="#00aaff" opacity="0.7"/>
				<circle cx="40" cy="10" r="2" fill="#00aaff" opacity="0.7"/>
			{/if}
		</svg>
	</div>

	<!-- Component Labels -->
	<div class="component-labels">
		<div class="component-name">{componentName}</div>
		<div class="component-value">{displayValue}</div>
		{#if data.voltage}
			<div class="component-voltage">{data.voltage}</div>
		{/if}
		{#if data.type}
			<div class="component-type">{data.type}</div>
		{/if}
	</div>
</div>

<style>
	.capacitor-node {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: transparent;
		cursor: pointer;
		user-select: none;
		transition: all 0.2s ease;
	}

	.capacitor-node:hover {
		transform: scale(1.0);
	}

	.capacitor-node.vertical {
		flex-direction: row;
		align-items: center;
	}

	.component-body {
		position: relative;
		z-index: 1;
	}

	.capacitor-symbol {
		color: #00aaff;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.electrolytic .capacitor-symbol {
		color: #ffaa00;
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
		color: #00aaff;
		background: rgba(0, 0, 0, 0.7);
		padding: 1px 3px;
		border-radius: 2px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}

	.electrolytic .component-value {
		color: #ffaa00;
	}

	.component-voltage,
	.component-type {
		font-size: 8px;
		color: #cccccc;
		background: rgba(0, 0, 0, 0.7);
		padding: 1px 2px;
		border-radius: 2px;
	}

	/* Handle styling improvements */
	:global(.capacitor-node .svelte-flow__handle) {
		border: 2px solid #ffffff;
		background: #00aaff !important;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;
	}

	:global(.capacitor-node.electrolytic .svelte-flow__handle) {
		background: #ffaa00 !important;
	}

	:global(.capacitor-node .svelte-flow__handle:hover) {
		background: #0088cc !important;
		transform: scale(1.2);
		box-shadow: 0 0 8px rgba(0, 170, 255, 0.6);
	}

	:global(.capacitor-node.electrolytic .svelte-flow__handle:hover) {
		background: #dd8800 !important;
		box-shadow: 0 0 8px rgba(255, 170, 0, 0.6);
	}

	:global(.capacitor-node.selected) {
		filter: drop-shadow(0 0 8px rgba(0, 128, 255, 0.8));
	}

	:global(.capacitor-node.selected .component-name) {
		background: rgba(0, 128, 255, 0.8);
		color: #ffffff;
	}
</style>
