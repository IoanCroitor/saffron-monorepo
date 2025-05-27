<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { circuitStore } from '../stores/circuit-store';
	
	let { selectedWire = $bindable() }: { selectedWire: any } = $props();

	const wireShapes = [
		{ value: 'straight', label: '─', tooltip: 'Straight' },
		{ value: 'bezier', label: '⌒', tooltip: 'Curved' },
		{ value: 'smoothstep', label: '┐', tooltip: 'Step' }
	];

	const wireStyles = [
		{ value: 'solid', label: '━━', tooltip: 'Solid' },
		{ value: 'dashed', label: '┅┅', tooltip: 'Dashed' },
		{ value: 'dotted', label: '┈┈', tooltip: 'Dotted' }
	];

	function updateAllWires(property: string, value: string) {
		// Get current store state
		let currentState: any;
		circuitStore.subscribe(state => currentState = state)();
		
		// Update all wire edges
		currentState.edges.forEach((edge: any) => {
			if (edge.type === 'wire') {
				const updates: any = { [property]: value };
				circuitStore.updateWireStyle(
					edge.id,
					property === 'wireShape' ? value : edge.data?.wireShape || 'straight',
					property === 'wireStyle' ? value : edge.data?.wireStyle || 'solid',
					property === 'color' ? value : edge.data?.color || '#64748b'
				);
			}
		});
	}
</script>

<div class="wire-toolbar bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
	<div class="flex items-center gap-4">
		<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Wire Tools:</span>
		
		<!-- Shape controls -->
		<div class="flex gap-1">
			{#each wireShapes as shape}
				<Button
					variant="outline"
					size="sm"
					class="w-8 h-8 p-0 text-lg"
					title={shape.tooltip}
					onclick={() => updateAllWires('wireShape', shape.value)}
				>
					{shape.label}
				</Button>
			{/each}
		</div>

		<div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

		<!-- Style controls -->
		<div class="flex gap-1">
			{#each wireStyles as style}
				<Button
					variant="outline"
					size="sm"
					class="w-10 h-8 p-0 text-sm font-mono"
					title={style.tooltip}
					onclick={() => updateAllWires('wireStyle', style.value)}
				>
					{style.label}
				</Button>
			{/each}
		</div>

		<div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

		<!-- Quick color options -->
		<div class="flex gap-1">
			{#each ['#64748b', '#ef4444', '#3b82f6', '#10b981'] as color}
				<Button
					variant="outline"
					size="sm"
					class="w-8 h-8 p-0"
					title="Change all wire colors"
					onclick={() => updateAllWires('color', color)}
				>
					<div class="w-4 h-4 rounded border border-gray-300 dark:border-gray-600" style="background-color: {color}"></div>
				</Button>
			{/each}
		</div>
	</div>
</div>

<style>
	.wire-toolbar {
		position: fixed;
		top: 80px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		backdrop-filter: blur(8px);
		background: rgba(255, 255, 255, 0.95);
	}

	:global(.dark) .wire-toolbar {
		background: rgba(31, 41, 55, 0.95);
	}
</style>
