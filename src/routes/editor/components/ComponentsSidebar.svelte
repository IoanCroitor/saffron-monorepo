<script lang="ts">
	import { Search } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import ComponentIcon from './ComponentIcon.svelte';
	import { circuitStore } from '../stores/circuit-store';

	let searchTerm = $state('');
	let draggedComponent = $state<string | null>(null);

	const componentCategories = [
		{
			name: 'Passive Components',
			components: [
				{ type: 'resistor', label: 'Resistor', description: 'Resistive element' },
				{ type: 'capacitor', label: 'Capacitor', description: 'Capacitive element' },
				{ type: 'inductor', label: 'Inductor', description: 'Inductive element' }
			]
		},
		{
			name: 'Sources',
			components: [
				{ type: 'voltageSource', label: 'Voltage Source', description: 'DC/AC voltage source' },
				{ type: 'currentSource', label: 'Current Source', description: 'DC/AC current source' },
				{ type: 'ground', label: 'Ground', description: 'Circuit ground reference' }
			]
		},
		{
			name: 'Semiconductors',
			components: [
				{ type: 'diode', label: 'Diode', description: 'PN junction diode' },
				{ type: 'transistor', label: 'Transistor', description: 'BJT/MOSFET transistor' },
				{ type: 'opamp', label: 'Op-Amp', description: 'Operational amplifier' }
			]
		},
		{
			name: 'Measurement',
			components: [
				{ type: 'voltmeter', label: 'Voltmeter', description: 'Voltage measurement' },
				{ type: 'ammeter', label: 'Ammeter', description: 'Current measurement' },
				{ type: 'probe', label: 'Probe', description: 'Test probe' }
			]
		}
	];

	const filteredCategories = $derived(
		componentCategories.map(category => ({
			...category,
			components: category.components.filter(component =>
				component.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
				component.description.toLowerCase().includes(searchTerm.toLowerCase())
			)
		})).filter(category => category.components.length > 0)
	);

	function handleDragStart(event: DragEvent, componentType: string) {
		if (event.dataTransfer) {
			event.dataTransfer.setData('application/reactflow', componentType);
			event.dataTransfer.effectAllowed = 'move';
			
			// Create a custom drag image to prevent layout shifts
			const dragImage = document.createElement('div');
			dragImage.style.cssText = `
				background: white;
				border: 2px solid #3b82f6;
				border-radius: 8px;
				padding: 8px;
				font-size: 12px;
				font-weight: 600;
				color: #3b82f6;
				box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
				position: absolute;
				top: -1000px;
				pointer-events: none;
			`;
			dragImage.textContent = componentType;
			document.body.appendChild(dragImage);
			
			// Set the custom drag image
			event.dataTransfer.setDragImage(dragImage, 20, 10);
			
			// Clean up after a short delay
			setTimeout(() => {
				document.body.removeChild(dragImage);
			}, 0);
		}
		draggedComponent = componentType;
	}

	function handleDragEnd() {
		draggedComponent = null;
	}

	function handleClick(componentType: string) {
		// Add component at center of viewport
		circuitStore.addComponent(componentType, { x: 400, y: 300 });
	}


</script>

<div class="w-80 h-full overflow-hidden bg-background border-r border-border flex flex-col">
	<!-- Header -->
	<div class="p-4 border-b border-border">
		<h2 class="text-lg font-semibold text-foreground mb-3">Components</h2>
		<div class="relative">
			<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
			<Input
				bind:value={searchTerm}
				placeholder="Search components..."
				class="pl-10"
			/>
		</div>
	</div>

	<!-- Components List -->
	<div class="flex-1 overflow-y-auto p-4 space-y-6">
		{#each filteredCategories as category (category.name)}
			<div class="space-y-3">
				<h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
					{category.name}
				</h3>
				<div class="grid grid-cols-2 gap-2">
					{#each category.components as component (component.type)}
						<Card class="p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border-dashed border-2 {draggedComponent === component.type ? 'opacity-50' : ''}">
							<button
								class="w-full text-left"
								draggable="true"
								ondragstart={(e) => handleDragStart(e, component.type)}
								ondragend={handleDragEnd}
								onclick={() => handleClick(component.type)}
							>
								<div class="flex flex-col items-center space-y-2">
									<ComponentIcon type={component.type} class="w-8 h-8" />
									<div class="text-center">
										<div class="text-xs font-medium">{component.label}</div>
										<div class="text-xs text-muted-foreground line-clamp-1">
											{component.description}
										</div>
									</div>
								</div>
							</button>
						</Card>
					{/each}
				</div>
			</div>
		{/each}

		{#if filteredCategories.length === 0}
			<div class="text-center text-muted-foreground py-8">
				<Search class="w-8 h-8 mx-auto mb-2 opacity-50" />
				<p>No components found</p>
				<p class="text-xs">Try a different search term</p>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<div class="p-4 border-t border-border space-y-2">
		<Button variant="outline" size="sm" class="w-full" onclick={() => circuitStore.clear()}>
			Clear Circuit
		</Button>
	</div>
</div>

<style>
	.line-clamp-1 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
	}
</style>
