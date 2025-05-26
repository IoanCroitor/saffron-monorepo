<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: {
		value?: string;
		rotation?: number;
		label?: string;
		type?: 'air' | 'iron' | 'ferrite';
		units?: string;
	} = {};

	$: value = data.value || '10mH';
	$: rotation = data.rotation || 0;
	$: label = data.label || 'L1';
	$: type = data.type || 'air';
	$: units = data.units || 'H';

	// Calculate handle positions based on rotation
	$: handles = getHandlePositions(rotation);

	function getHandlePositions(rot: number) {
		switch (rot) {
			case 90:
				return [
					{ id: 'terminal1', type: 'source' , position: Position.Top, style: 'top: 0px; left: 25px;' },
					{ id: 'terminal2', type: 'source' , position: Position.Bottom, style: 'bottom: 0px; left: 25px;' }
				];
			case 180:
				return [
					{ id: 'terminal1', type: 'source' , position: Position.Right, style: 'top: 15px; right: 0px;' },
					{ id: 'terminal2', type: 'source' , position: Position.Left, style: 'top: 15px; left: 0px;' }
				];
			case 270:
				return [
					{ id: 'terminal1', type: 'source' , position: Position.Bottom, style: 'bottom: 0px; left: 25px;' },
					{ id: 'terminal2', type: 'source' , position: Position.Top, style: 'top: 0px; left: 25px;' }
				];
			default:
				return [
					{ id: 'terminal1', type: 'source' , position: Position.Left, style: 'top: 15px; left: 0px;' },
					{ id: 'terminal2', type: 'source' , position: Position.Right, style: 'top: 15px; right: 0px;' }
				];
		}
	}

	$: isVertical = rotation === 90 || rotation === 270;
</script>

<div class="inductor-node" style="transform: rotate({rotation}deg);">
	<!-- Connection Handles -->
	{#each handles as handle}
		<Handle
			id={handle.id}
			type={handle.type}
			position={handle.position}
			style={handle.style}
			class="handle"
		/>
	{/each}

	<!-- Inductor Symbol -->
	<svg width="60" height="30" viewBox="0 0 60 30" class="inductor-symbol">
		<g stroke="currentColor" stroke-width="1.5" fill="none">
			<!-- Lead lines -->
			<line x1="5" y1="15" x2="10" y2="15" />
			<line x1="50" y1="15" x2="55" y2="15" />
			
			<!-- Inductor coils -->
			<path d="M 10 15 C 10 10, 15 10, 15 15 C 15 20, 20 20, 20 15 C 20 10, 25 10, 25 15 C 25 20, 30 20, 30 15 C 30 10, 35 10, 35 15 C 35 20, 40 20, 40 15 C 40 10, 45 10, 45 15 C 45 20, 50 20, 50 15" />
			
			<!-- Core indicator for iron/ferrite -->
			{#if type === 'iron' || type === 'ferrite'}
				<line x1="12" y1="8" x2="48" y2="8" stroke-width="2" stroke="#ff6b6b" />
				<line x1="12" y1="22" x2="48" y2="22" stroke-width="2" stroke="#ff6b6b" />
				{#if type === 'ferrite'}
					<line x1="12" y1="6" x2="48" y2="6" stroke-width="1" stroke="#888" />
					<line x1="12" y1="24" x2="48" y2="24" stroke-width="1" stroke="#888" />
				{/if}
			{/if}
		</g>
	</svg>

	<!-- Component Label -->
	<div class="label">
		{label}
	</div>

	<!-- Value Display -->
	<div class="value">
		{value}
	</div>

	<!-- Type Indicator -->
	{#if type !== 'air'}
		<div class="type-indicator">
			{type.toUpperCase()}
		</div>
	{/if}
</div>

<style>
	.inductor-node {
		position: relative;
		background: #2a2a2a;
		border: 2px solid #9b59b6;
		border-radius: 4px;
		padding: 8px;
		min-width: 70px;
		min-height: 40px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		transform-origin: center;
	}

	.inductor-symbol {
		color: #9b59b6;
		margin-bottom: 4px;
	}

	.label {
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 10px;
		color: #ffffff;
		font-weight: bold;
		text-align: center;
		margin-bottom: 2px;
	}

	.value {
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 9px;
		color: #cccccc;
		text-align: center;
		margin-bottom: 2px;
	}

	.type-indicator {
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 7px;
		color: #888;
		text-align: center;
	}

	:global(.handle) {
		width: 8px;
		height: 8px;
		background: #9b59b6;
		border: 2px solid #ffffff;
		border-radius: 50%;
	}

	:global(.handle:hover) {
		background: #c39bd3;
		transform: scale(1.2);
	}

	.inductor-node:hover {
		border-color: #c39bd3;
	}

	.inductor-node:hover .inductor-symbol {
		color: #c39bd3;
	}
</style>
