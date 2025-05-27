<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import type { Edge } from '@xyflow/svelte';
	import { circuitStore } from '../stores/circuit-store';

	let { selectedWire = $bindable() }: { selectedWire: Edge | null } = $props();

	const wireShapes = [
		{ value: 'straight', label: 'Straight', icon: '─' },
		{ value: 'bezier', label: 'Curved', icon: '⌒' },
		{ value: 'smoothstep', label: 'Step', icon: '┐' }
	];

	const wireStyles = [
		{ value: 'solid', label: 'Solid', pattern: '────' },
		{ value: 'dashed', label: 'Dashed', pattern: '- - -' },
		{ value: 'dotted', label: 'Dotted', pattern: '····' }
	];

	const wireColors = [
		{ value: '#64748b', label: 'Gray', color: '#64748b' },
		{ value: '#ef4444', label: 'Red', color: '#ef4444' },
		{ value: '#3b82f6', label: 'Blue', color: '#3b82f6' },
		{ value: '#10b981', label: 'Green', color: '#10b981' },
		{ value: '#f59e0b', label: 'Orange', color: '#f59e0b' },
		{ value: '#8b5cf6', label: 'Purple', color: '#8b5cf6' }
	];

	function updateWireShape(shape: string) {
		if (selectedWire) {
			circuitStore.updateWireStyle(selectedWire.id, shape);
		}
	}

	function updateWireStyle(style: string) {
		if (selectedWire) {
			circuitStore.updateWireStyle(
				selectedWire.id,
				(selectedWire.data as any)?.wireShape || 'straight',
				style
			);
		}
	}

	function updateWireColor(color: string) {
		if (selectedWire) {
			circuitStore.updateWireStyle(
				selectedWire.id,
				(selectedWire.data as any)?.wireShape || 'straight',
				(selectedWire.data as any)?.wireStyle || 'solid',
				color
			);
		}
	}

	function deleteWire() {
		if (selectedWire) {
			circuitStore.removeConnection(selectedWire.id);
			selectedWire = null;
		}
	}
</script>

{#if selectedWire}
	<div class="wire-properties-panel bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
		<div class="mb-4">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
				Wire Properties
			</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				ID: {selectedWire.id}
			</p>
		</div>

		<!-- Wire Shape Selection -->
		<div class="mb-4">
			<Label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				Shape
			</Label>
			<div class="grid grid-cols-3 gap-2">
				{#each wireShapes as shape}
					<Button
						variant={selectedWire.data?.wireShape === shape.value ? 'default' : 'outline'}
						size="sm"
						class="flex flex-col items-center p-2 h-auto"
						onclick={() => updateWireShape(shape.value)}
					>
						<span class="text-lg mb-1">{shape.icon}</span>
						<span class="text-xs">{shape.label}</span>
					</Button>
				{/each}
			</div>
		</div>

		<!-- Wire Style Selection -->
		<div class="mb-4">
			<Label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				Style
			</Label>
			<div class="grid grid-cols-3 gap-2">
				{#each wireStyles as style}
					<Button
						variant={selectedWire.data?.wireStyle === style.value ? 'default' : 'outline'}
						size="sm"
						class="flex flex-col items-center p-2 h-auto"
						onclick={() => updateWireStyle(style.value)}
					>
						<span class="text-xs font-mono mb-1">{style.pattern}</span>
						<span class="text-xs">{style.label}</span>
					</Button>
				{/each}
			</div>
		</div>

		<!-- Wire Color Selection -->
		<div class="mb-4">
			<Label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				Color
			</Label>
			<div class="grid grid-cols-3 gap-2">
				{#each wireColors as color}
					<Button
						variant={selectedWire.data?.color === color.value ? 'default' : 'outline'}
						size="sm"
						class="flex items-center justify-center p-2 h-8"
						onclick={() => updateWireColor(color.value)}
					>
						<div 
							class="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
							style="background-color: {color.color}"
						></div>
					</Button>
				{/each}
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-2">
			<Button
				variant="destructive"
				size="sm"
				onclick={deleteWire}
				class="flex-1"
			>
				Delete Wire
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => selectedWire = null}
				class="flex-1"
			>
				Close
			</Button>
		</div>
	</div>
{/if}

<style>
	.wire-properties-panel {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1000;
		min-width: 280px;
		max-width: 320px;
	}
</style>
