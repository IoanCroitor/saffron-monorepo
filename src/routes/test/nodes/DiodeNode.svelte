<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: {
		type?: 'standard' | 'zener' | 'led' | 'schottky' | 'photodiode' | 'varactor';
		value?: string;
		rotation?: number;
		label?: string;
		color?: string; // For LEDs
		voltage?: string; // For Zener diodes
	} = {};

	$: type = data.type || 'standard';
	$: value = data.value || 'D1';
	$: rotation = data.rotation || 0;
	$: label = data.label || value;
	$: color = data.color || 'red'; // For LEDs
	$: voltage = data.voltage || '5.1V'; // For Zener diodes

	// Calculate handle positions based on rotation
	$: handles = getHandlePositions(rotation);

	function getHandlePositions(rot: number) {
		switch (rot) {
			case 90:
				return [
					{ id: 'anode', type: 'source' , position: Position.Top, style: 'top: 0px; left: 20px;' },
					{ id: 'cathode', type: 'source' , position: Position.Bottom, style: 'bottom: 0px; left: 20px;' }
				];
			case 180:
				return [
					{ id: 'anode', type: 'source' , position: Position.Right, style: 'top: 15px; right: 0px;' },
					{ id: 'cathode', type: 'source' , position: Position.Left, style: 'top: 15px; left: 0px;' }
				];
			case 270:
				return [
					{ id: 'anode', type: 'source' , position: Position.Bottom, style: 'bottom: 0px; left: 20px;' },
					{ id: 'cathode', type: 'source' , position: Position.Top, style: 'top: 0px; left: 20px;' }
				];
			default:
				return [
					{ id: 'anode', type: 'source' , position: Position.Left, style: 'top: 15px; left: 0px;' },
					{ id: 'cathode', type: 'source' , position: Position.Right, style: 'top: 15px; right: 0px;' }
				];
		}
	}

	function getLEDColor(colorName: string): string {
		const colors: Record<string, string> = {
			red: '#ff4444',
			green: '#44ff44',
			blue: '#4444ff',
			yellow: '#ffff44',
			orange: '#ff8844',
			white: '#ffffff',
			infrared: '#aa0000',
			ultraviolet: '#8800ff'
		};
		return colors[colorName] || '#ff4444';
	}
</script>

<div class="diode-node" style="transform: rotate({rotation}deg);">
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

	<!-- Diode Symbol -->
	<svg width="50" height="30" viewBox="0 0 50 30" class="diode-symbol">
		<g stroke="currentColor" stroke-width="1.5" fill="none">
			<!-- Lead lines -->
			<line x1="5" y1="15" x2="15" y2="15" />
			<line x1="35" y1="15" x2="45" y2="15" />
			
			<!-- Diode triangle (anode) -->
			<polygon points="15,15 25,10 25,20" fill="currentColor" />
			
			<!-- Cathode line -->
			<line x1="25" y1="10" x2="25" y2="20" stroke-width="2" />
			
			<!-- Connect cathode to lead -->
			<line x1="25" y1="15" x2="35" y2="15" />
			
			<!-- Special diode types -->
			{#if type === 'zener'}
				<!-- Zener bend -->
				<line x1="25" y1="10" x2="27" y2="8" stroke-width="1.5" />
				<line x1="25" y1="20" x2="23" y2="22" stroke-width="1.5" />
			{:else if type === 'led'}
				<!-- LED arrows -->
				<g stroke={getLEDColor(color)} stroke-width="1">
					<line x1="20" y1="8" x2="25" y2="3" />
					<polygon points="25,3 23,3 23,5" fill={getLEDColor(color)} />
					<line x1="17" y1="6" x2="22" y2="1" />
					<polygon points="22,1 20,1 20,3" fill={getLEDColor(color)} />
				</g>
			{:else if type === 'schottky'}
				<!-- Schottky bars -->
				<line x1="23" y1="10" x2="25" y2="10" stroke-width="1.5" />
				<line x1="25" y1="20" x2="27" y2="20" stroke-width="1.5" />
			{:else if type === 'photodiode'}
				<!-- Light arrows -->
				<g stroke="currentColor" stroke-width="1">
					<line x1="12" y1="5" x2="17" y2="10" />
					<polygon points="17,10 15,10 15,8" fill="currentColor" />
					<line x1="9" y1="3" x2="14" y2="8" />
					<polygon points="14,8 12,8 12,6" fill="currentColor" />
				</g>
			{:else if type === 'varactor'}
				<!-- Variable capacitance lines -->
				<line x1="27" y1="12" x2="30" y2="12" stroke-width="1" />
				<line x1="27" y1="18" x2="30" y2="18" stroke-width="1" />
			{/if}
		</g>
	</svg>

	<!-- Component Label -->
	<div class="label">
		{label}
	</div>

	<!-- Type/Value Display -->
	<div class="value">
		{#if type === 'led'}
			{color.toUpperCase()} LED
		{:else if type === 'zener'}
			{voltage}
		{:else}
			{type.toUpperCase()}
		{/if}
	</div>
</div>

<style>
	.diode-node {
		position: relative;
		background: #2a2a2a;
		border: 2px solid #e74c3c;
		border-radius: 4px;
		padding: 8px;
		min-width: 60px;
		min-height: 40px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		transform-origin: center;
	}

	.diode-symbol {
		color: #e74c3c;
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
		font-size: 8px;
		color: #cccccc;
		text-align: center;
	}

	:global(.handle) {
		width: 8px;
		height: 8px;
		background: #e74c3c;
		border: 2px solid #ffffff;
		border-radius: 50%;
	}

	:global(.handle:hover) {
		background: #ff6b6b;
		transform: scale(1);
	}

	.diode-node:hover {
		border-color: #ff6b6b;
	}

	.diode-node:hover .diode-symbol {
		color: #ff6b6b;
	}
</style>
