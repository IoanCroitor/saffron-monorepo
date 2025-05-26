<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: {
		type?: 'npn' | 'pnp' | 'nmos' | 'pmos';
		value?: string;
		rotation?: number;
		label?: string;
	} = {};

	$: type = data.type || 'npn';
	$: value = data.value || 'Q1';
	$: rotation = data.rotation || 0;
	$: label = data.label || value;

	// Calculate handle positions based on rotation
	$: handles = getHandlePositions(rotation, type);

	function getHandlePositions(rot: number, transistorType: string) {
		const isFET = transistorType.includes('mos');
		
		if (isFET) {
			// MOSFET handles: Gate, Drain, Source
			switch (rot) {
				case 90:
					return [
						{ id: 'gate', type: 'source', position: Position.Top, style: 'top: 20px; left: 10px;' },
						{ id: 'drain', type: 'source', position: Position.Right, style: 'top: 10px; right: 0px;' },
						{ id: 'source', type: 'source', position: Position.Bottom, style: 'bottom: 0px; left: 10px;' }
					];
				case 180:
					return [
						{ id: 'gate', type: 'source', position: Position.Right, style: 'top: 20px; right: 0px;' },
						{ id: 'drain', type: 'source', position: Position.Bottom, style: 'bottom: 0px; left: 20px;' },
						{ id: 'source', type: 'source', position: Position.Top, style: 'top: 0px; left: 20px;' }
					];
				case 270:
					return [
						{ id: 'gate', type: 'source', position: Position.Bottom, style: 'bottom: 0px; left: 30px;' },
						{ id: 'drain', type: 'source', position: Position.Left, style: 'top: 10px; left: 0px;' },
						{ id: 'source', type: 'source', position: Position.Top, style: 'top: 0px; left: 30px;' }
					];
				default:
					return [
						{ id: 'gate', type: 'source', position: Position.Left, style: 'top: 20px; left: 0px;' },
						{ id: 'drain', type: 'source', position: Position.Top, style: 'top: 0px; left: 20px;' },
						{ id: 'source', type: 'source', position: Position.Bottom, style: 'bottom: 0px; left: 20px;' }
					];
			}
		} else {
			// BJT handles: Base, Collector, Emitter
			switch (rot) {
				case 90:
					return [
						{ id: 'base', type: 'source', position: Position.Top, style: 'top: 0px; left: 20px;' },
						{ id: 'collector', type: 'source', position: Position.Right, style: 'top: 10px; right: 0px;' },
						{ id: 'emitter', type: 'source', position: Position.Bottom, style: 'bottom: 0px; left: 30px;' }
					];
				case 180:
					return [
						{ id: 'base', type: 'source', position: Position.Right, style: 'top: 20px; right: 0px;' },
						{ id: 'collector', type: 'source', position: Position.Bottom, style: 'bottom: 0px; left: 10px;' },
						{ id: 'emitter', type: 'source', position: Position.Top, style: 'top: 0px; left: 10px;' }
					];
				case 270:
					return [
						{ id: 'base', type: 'source', position: Position.Bottom, style: 'bottom: 0px; left: 20px;' },
						{ id: 'collector', type: 'source', position: Position.Left, style: 'top: 10px; left: 0px;' },
						{ id: 'emitter', type: 'source', position: Position.Top, style: 'top: 0px; left: 10px;' }
					];
				default:
					return [
						{ id: 'base', type: 'source', position: Position.Left, style: 'top: 20px; left: 0px;' },
						{ id: 'collector', type: 'source', position: Position.Top, style: 'top: 0px; left: 30px;' },
						{ id: 'emitter', type: 'source', position: Position.Bottom, style: 'bottom: 0px; left: 10px;' }
					];
			}
		}
	}
</script>

<div class="transistor-node" style="transform: rotate({rotation}deg);">
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

	<!-- Transistor Symbol -->
	<svg width="50" height="40" viewBox="0 0 50 40" class="transistor-symbol">
		{#if type.includes('mos')}
			<!-- MOSFET Symbol -->
			<g stroke="currentColor" stroke-width="1.5" fill="none">
				<!-- Gate -->
				<line x1="5" y1="20" x2="15" y2="20" />
				<line x1="15" y1="10" x2="15" y2="30" />
				
				<!-- Channel -->
				<line x1="20" y1="12" x2="20" y2="18" />
				<line x1="20" y1="22" x2="20" y2="28" />
				
				<!-- Drain -->
				<line x1="20" y1="15" x2="35" y2="15" />
				<line x1="35" y1="5" x2="35" y2="15" />
				
				<!-- Source -->
				<line x1="20" y1="25" x2="35" y2="25" />
				<line x1="35" y1="25" x2="35" y2="35" />
				
				<!-- Body -->
				<line x1="17" y1="15" x2="17" y2="25" />
				
				<!-- Enhancement/Depletion indicator -->
				{#if type === 'nmos'}
					<circle cx="22" cy="20" r="1" fill="currentColor" />
				{:else}
					<line x1="20" y1="18" x2="20" y2="22" stroke-width="2" />
				{/if}
				
				<!-- Arrow for P/N type -->
				{#if type === 'pmos'}
					<polygon points="22,20 18,18 18,22" fill="currentColor" />
				{:else}
					<polygon points="18,20 22,18 22,22" fill="currentColor" />
				{/if}
			</g>
		{:else}
			<!-- BJT Symbol -->
			<g stroke="currentColor" stroke-width="1.5" fill="none">
				<!-- Base -->
				<line x1="5" y1="20" x2="20" y2="20" />
				<line x1="20" y1="10" x2="20" y2="30" />
				
				<!-- Collector -->
				<line x1="20" y1="13" x2="35" y2="5" />
				<line x1="35" y1="5" x2="35" y2="5" />
				
				<!-- Emitter -->
				<line x1="20" y1="27" x2="35" y2="35" />
				<line x1="35" y1="35" x2="35" y2="35" />
				
				<!-- Arrow for NPN/PNP -->
				{#if type === 'npn'}
					<polygon points="30,30 35,35 30,35" fill="currentColor" />
				{:else}
					<polygon points="25,15 20,13 25,10" fill="currentColor" />
				{/if}
			</g>
		{/if}
	</svg>

	<!-- Component Label -->
	<div class="label">
		{label}
	</div>

	<!-- Type Indicator -->
	<div class="type-indicator">
		{type.toUpperCase()}
	</div>
</div>

<style>
	.transistor-node {
		position: relative;
		background: #2a2a2a;
		border: 2px solid #4a90e2;
		border-radius: 4px;
		padding: 8px;
		min-width: 60px;
		min-height: 50px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		transform-origin: center;
	}

	.transistor-symbol {
		color: #4a90e2;
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

	.type-indicator {
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 8px;
		color: #888;
		text-align: center;
	}

	:global(.handle) {
		width: 8px;
		height: 8px;
		background: #4a90e2;
		border: 2px solid #ffffff;
		border-radius: 50%;
	}

	:global(.handle:hover) {
		background: #66b3ff;
		transform: scale(1.2);
	}

	.transistor-node:hover {
		border-color: #66b3ff;
	}

	.transistor-node:hover .transistor-symbol {
		color: #66b3ff;
	}
</style>
