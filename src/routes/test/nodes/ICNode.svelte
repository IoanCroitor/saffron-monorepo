<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: {
		type?: 'opamp' | 'logic' | 'microcontroller' | 'regulator' | 'comparator' | 'custom';
		value?: string;
		rotation?: number;
		label?: string;
		pinCount?: number;
		pins?: { id: string; label: string; side: 'left' | 'right' | 'top' | 'bottom' }[];
		package?: 'dip' | 'soic' | 'qfp' | 'bga';
	} = {};

	$: type = data.type || 'opamp';
	$: value = data.value || 'U1';
	$: rotation = data.rotation || 0;
	$: label = data.label || value;
	$: pinCount = data.pinCount || getPinCountForType(type);
	$: package_type = data.package || 'dip';

	// Default pin configurations for common IC types
	function getPinCountForType(icType: string): number {
		switch (icType) {
			case 'opamp': return 8;
			case 'comparator': return 8;
			case 'logic': return 14;
			case 'regulator': return 3;
			case 'microcontroller': return 20;
			default: return 8;
		}
	}

	function getDefaultPins(icType: string) {
		switch (icType) {
			case 'opamp':
				return [
					{ id: 'in-', label: 'IN-', side: 'left' },
					{ id: 'in+', label: 'IN+', side: 'left' },
					{ id: 'vcc', label: 'VCC', side: 'top' },
					{ id: 'vee', label: 'VEE', side: 'bottom' },
					{ id: 'out', label: 'OUT', side: 'right' }
				];
			case 'regulator':
				return [
					{ id: 'in', label: 'IN', side: 'left' },
					{ id: 'gnd', label: 'GND', side: 'bottom' },
					{ id: 'out', label: 'OUT', side: 'right' }
				];
			case 'comparator':
				return [
					{ id: 'in-', label: 'IN-', side: 'left' },
					{ id: 'in+', label: 'IN+', side: 'left' },
					{ id: 'vcc', label: 'VCC', side: 'top' },
					{ id: 'gnd', label: 'GND', side: 'bottom' },
					{ id: 'out', label: 'OUT', side: 'right' }
				];
			default:
				return [
					{ id: 'pin1', label: '1', side: 'left' },
					{ id: 'pin2', label: '2', side: 'left' },
					{ id: 'pin3', label: '3', side: 'right' },
					{ id: 'pin4', label: '4', side: 'right' }
				];
		}
	}

	$: pins = data.pins || getDefaultPins(type);

	// Calculate handle positions based on rotation and pins
	$: handles = getHandlePositions(rotation, pins);

	function getHandlePositions(rot: number, pinList: typeof pins) {
		const handles: Array<{
			id: string;
			position: Position;
			style: string;
			label: string;
		}> = [];
		const width = 80;
		const height = 60;
		
		pinList.forEach((pin, index) => {
			let position: Position = Position.Left;
			let style: string = '';
			
			// Adjust for rotation
			let side = pin.side;
			if (rot === 90) {
				side = side === 'left' ? 'bottom' : side === 'right' ? 'top' : side === 'top' ? 'left' : 'right';
			} else if (rot === 180) {
				side = side === 'left' ? 'right' : side === 'right' ? 'left' : side === 'top' ? 'bottom' : 'top';
			} else if (rot === 270) {
				side = side === 'left' ? 'top' : side === 'right' ? 'bottom' : side === 'top' ? 'right' : 'left';
			}
			
			switch (side) {
				case 'left':
					position = Position.Left;
					style = `top: ${20 + index * 15}px; left: 0px;`;
					break;
				case 'right':
					position = Position.Right;
					style = `top: ${20 + index * 15}px; right: 0px;`;
					break;
				case 'top':
					position = Position.Top;
					style = `top: 0px; left: ${20 + index * 15}px;`;
					break;
				case 'bottom':
					position = Position.Bottom;
					style = `bottom: 0px; left: ${20 + index * 15}px;`;
					break;
			}
			
			handles.push({
				id: pin.id,
				position,
				style,
				label: pin.label
			});
		});
		
		return handles;
	}

	function getICSymbol(icType: string) {
		switch (icType) {
			case 'opamp':
				return `
					<polygon points="15,30 50,45 50,15" stroke="currentColor" stroke-width="2" fill="none" />
					<text x="30" y="32" font-size="8" fill="currentColor" text-anchor="middle">+</text>
					<text x="30" y="22" font-size="8" fill="currentColor" text-anchor="middle">-</text>
				`;
			case 'regulator':
				return `
					<rect x="15" y="20" width="40" height="20" stroke="currentColor" stroke-width="2" fill="none" />
					<text x="35" y="32" font-size="8" fill="currentColor" text-anchor="middle">REG</text>
				`;
			default:
				return `
					<rect x="15" y="15" width="40" height="30" stroke="currentColor" stroke-width="2" fill="none" />
					<circle cx="20" cy="20" r="2" fill="currentColor" />
					<text x="35" y="32" font-size="8" fill="currentColor" text-anchor="middle">${type.toUpperCase()}</text>
				`;
		}
	}
</script>

<div class="ic-node" style="transform: rotate({rotation}deg);">
	<!-- Connection Handles -->
	{#each handles as handle}
		<Handle
			id={handle.id}
			type="source"
			position={handle.position}
			style={handle.style}
			class="handle"
		/>
	{/each}

	<!-- IC Symbol -->
	<svg width="80" height="60" viewBox="0 0 80 60" class="ic-symbol">
		<g stroke="currentColor" stroke-width="1.5" fill="none">
			{@html getICSymbol(type)}
		</g>
	</svg>

	<!-- Pin Labels -->
	<div class="pin-labels">
		{#each pins as pin, index}
			<div class="pin-label pin-{pin.side}" style="--index: {index}">
				{pin.label}
			</div>
		{/each}
	</div>

	<!-- Component Label -->
	<div class="label">
		{label}
	</div>

	<!-- Type Display -->
	<div class="type-indicator">
		{type.toUpperCase()}
	</div>

	<!-- Package Indicator -->
	<div class="package-indicator">
		{package_type.toUpperCase()}-{pinCount}
	</div>
</div>

<style>
	.ic-node {
		position: relative;
		background: #2a2a2a;
		border: 2px solid #f39c12;
		border-radius: 4px;
		padding: 8px;
		min-width: 90px;
		min-height: 70px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		transform-origin: center;
	}

	.ic-symbol {
		color: #f39c12;
		margin-bottom: 4px;
	}

	.pin-labels {
		position: absolute;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.pin-label {
		position: absolute;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 7px;
		color: #ffffff;
		background: rgba(0, 0, 0, 0.7);
		padding: 1px 2px;
		border-radius: 2px;
		white-space: nowrap;
	}

	.pin-label.pin-left {
		left: 8px;
		top: calc(20px + var(--index) * 15px);
		transform: translateY(-50%);
	}

	.pin-label.pin-right {
		right: 8px;
		top: calc(20px + var(--index) * 15px);
		transform: translateY(-50%);
	}

	.pin-label.pin-top {
		top: 8px;
		left: calc(20px + var(--index) * 15px);
		transform: translateX(-50%);
	}

	.pin-label.pin-bottom {
		bottom: 8px;
		left: calc(20px + var(--index) * 15px);
		transform: translateX(-50%);
	}

	.label {
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 10px;
		color: #ffffff;
		font-weight: bold;
		text-align: center;
		margin-bottom: 2px;
	}

	.type-indicator {
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 8px;
		color: #cccccc;
		text-align: center;
		margin-bottom: 1px;
	}

	.package-indicator {
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 7px;
		color: #888;
		text-align: center;
	}

	:global(.handle) {
		width: 8px;
		height: 8px;
		background: #f39c12;
		border: 2px solid #ffffff;
		border-radius: 50%;
	}

	:global(.handle:hover) {
		background: #f4d03f;
		transform: scale(1.2);
	}

	.ic-node:hover {
		border-color: #f4d03f;
	}

	.ic-node:hover .ic-symbol {
		color: #f4d03f;
	}
</style>
