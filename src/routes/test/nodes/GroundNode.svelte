<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';

	export let data: {
		name?: string;
		groundType?: 'gnd' | 'dgnd' | 'agnd';
		rotation?: number;
	} = {};

	$: rotation = data.rotation || 0;
	$: componentName = data.name || 'GND';
	$: groundType = data.groundType || 'gnd';
</script>

<div 
	class="ground-node" 
	class:digital={groundType === 'dgnd'}
	class:analog={groundType === 'agnd'}
	style="transform: rotate({rotation}deg)"
>
	<!-- Connection Handle -->
	<Handle
		type="target"
		position={Position.Top}
		id="IN"
		style="background: #666666; width: 10px; height: 10px;"
	/>

	<!-- Ground Symbol -->
	<div class="component-body">
		<svg width="24" height="28" viewBox="0 0 24 28" class="ground-symbol">
			<g transform="translate(12, 8)">
				<!-- Connection line -->
				<line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" stroke-width="2"/>
				
				{#if groundType === 'dgnd'}
					<!-- Digital Ground - Rectangle -->
					<rect 
						x="-8" y="8" width="16" height="3" 
						fill="currentColor" 
						stroke="currentColor" 
						stroke-width="1"
					/>
					<rect 
						x="-6" y="11" width="12" height="2" 
						fill="currentColor" 
						stroke="currentColor" 
						stroke-width="1"
					/>
					<rect 
						x="-4" y="13" width="8" height="2" 
						fill="currentColor" 
						stroke="currentColor" 
						stroke-width="1"
					/>
				{:else if groundType === 'agnd'}
					<!-- Analog Ground - Circle -->
					<circle cx="0" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
					<circle cx="0" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
				{:else}
					<!-- Standard Ground - Lines -->
					<line x1="-8" y1="8" x2="8" y2="8" stroke="currentColor" stroke-width="2"/>
					<line x1="-6" y1="11" x2="6" y2="11" stroke="currentColor" stroke-width="2"/>
					<line x1="-4" y1="14" x2="4" y2="14" stroke="currentColor" stroke-width="2"/>
					<line x1="-2" y1="17" x2="2" y2="17" stroke="currentColor" stroke-width="2"/>
				{/if}
			</g>
			
			<!-- Connection point -->
			<circle cx="12" cy="0" r="2" fill="#666666" opacity="0.7"/>
		</svg>
	</div>

	<!-- Component Labels -->
	<div class="component-labels">
		<div class="component-name">{componentName}</div>
		<div class="component-type">
			{#if groundType === 'dgnd'}
				DGND
			{:else if groundType === 'agnd'}
				AGND
			{:else}
				GND
			{/if}
		</div>
	</div>
</div>

<style>
	.ground-node {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: transparent;
		cursor: pointer;
		user-select: none;
		transition: all 0.2s ease;
	}

	.ground-node:hover {
		transform: scale(1.05);
	}

	.component-body {
		position: relative;
		z-index: 1;
	}

	.ground-symbol {
		color: #666666;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.digital .ground-symbol {
		color: #4da6ff;
	}

	.analog .ground-symbol {
		color: #ff8c42;
	}

	.component-labels {
		position: absolute;
		bottom: -25px;
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
		border: 1px solid #666666;
	}

	.digital .component-name {
		border-color: #4da6ff;
	}

	.analog .component-name {
		border-color: #ff8c42;
	}

	.component-type {
		font-size: 8px;
		font-weight: 600;
		color: #666666;
		background: rgba(0, 0, 0, 0.8);
		padding: 1px 3px;
		border-radius: 2px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}

	.digital .component-type {
		color: #4da6ff;
	}

	.analog .component-type {
		color: #ff8c42;
	}

	/* Handle styling improvements */
	:global(.ground-node .svelte-flow__handle) {
		border: 2px solid #ffffff;
		background: #666666 !important;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;
	}

	:global(.ground-node.digital .svelte-flow__handle) {
		background: #4da6ff !important;
	}

	:global(.ground-node.analog .svelte-flow__handle) {
		background: #ff8c42 !important;
	}

	:global(.ground-node .svelte-flow__handle:hover) {
		transform: scale(1);
		box-shadow: 0 0 8px rgba(102, 102, 102, 0.6);
	}

	:global(.ground-node.digital .svelte-flow__handle:hover) {
		box-shadow: 0 0 8px rgba(77, 166, 255, 0.6);
	}

	:global(.ground-node.analog .svelte-flow__handle:hover) {
		box-shadow: 0 0 8px rgba(255, 140, 66, 0.6);
	}

	:global(.ground-node.selected) {
		filter: drop-shadow(0 0 8px rgba(0, 128, 255, 0.8));
	}

	:global(.ground-node.selected .component-name) {
		background: rgba(0, 128, 255, 0.8);
		color: #ffffff;
		border-color: #0080ff;
	}
</style>
