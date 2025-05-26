<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Simple icon components
	const iconMap: Record<string, () => string> = {
		minus: () => '─',
		circle: () => '○',
		triangle: () => '△',
		square: () => '□',
		battery: () => '🔋',
		cpu: () => '⚡',
		zap: () => '⚡',
		move: () => '↔'
	};

	interface ComponentDefinition {
		id: string;
		name: string;
		type: string;
		icon: string;
		category: string;
		defaultProps: Record<string, any>;
	}

	const componentLibrary: ComponentDefinition[] = [
		// Passive Components
		{
			id: 'resistor-h',
			name: 'Resistor (H)',
			type: 'resistor',
			icon: 'minus',
			category: 'Passive',
			defaultProps: {
				value: '1k',
				orientation: 'horizontal',
				componentType: 'r_h',
				tolerance: '5%'
			}
		},
		{
			id: 'resistor-v',
			name: 'Resistor (V)',
			type: 'resistor',
			icon: 'minus',
			category: 'Passive',
			defaultProps: {
				value: '1k',
				orientation: 'vertical',
				componentType: 'r_v',
				tolerance: '5%'
			}
		},
		{
			id: 'capacitor-h',
			name: 'Capacitor (H)',
			type: 'capacitor',
			icon: 'circle',
			category: 'Passive',
			defaultProps: {
				value: '100nF',
				orientation: 'horizontal',
				componentType: 'c_h',
				voltage: '50V'
			}
		},
		{
			id: 'capacitor-v',
			name: 'Capacitor (V)',
			type: 'capacitor',
			icon: 'circle',
			category: 'Passive',
			defaultProps: {
				value: '100nF',
				orientation: 'vertical',
				componentType: 'c_v',
				voltage: '50V'
			}
		},
		{
			id: 'inductor-h',
			name: 'Inductor (H)',
			type: 'inductor',
			icon: 'circle',
			category: 'Passive',
			defaultProps: {
				value: '10µH',
				orientation: 'horizontal',
				componentType: 'l_h',
				current: '1A'
			}
		},
		{
			id: 'inductor-v',
			name: 'Inductor (V)',
			type: 'inductor',
			icon: 'circle',
			category: 'Passive',
			defaultProps: {
				value: '10µH',
				orientation: 'vertical',
				componentType: 'l_v',
				current: '1A'
			}
		},

		// Semiconductors
		{
			id: 'diode-h',
			name: 'Diode (H)',
			type: 'diode',
			icon: 'triangle',
			category: 'Semiconductors',
			defaultProps: {
				type: 'standard',
				value: 'D1',
				componentType: 'd_h',
				rotation: 0
			}
		},
		{
			id: 'diode-v',
			name: 'Diode (V)',
			type: 'diode',
			icon: 'triangle',
			category: 'Semiconductors',
			defaultProps: {
				type: 'standard',
				value: 'D1',
				componentType: 'd_v',
				rotation: 90
			}
		},
		{
			id: 'led-red',
			name: 'LED (Red)',
			type: 'diode',
			icon: 'triangle',
			category: 'Semiconductors',
			defaultProps: {
				type: 'led',
				value: 'LED1',
				color: 'red',
				componentType: 'led_red'
			}
		},
		{
			id: 'zener',
			name: 'Zener Diode',
			type: 'diode',
			icon: 'triangle',
			category: 'Semiconductors',
			defaultProps: {
				type: 'zener',
				value: 'Z1',
				voltage: '5.1V',
				componentType: 'zener'
			}
		},
		{
			id: 'transistor-npn',
			name: 'NPN Transistor',
			type: 'transistor',
			icon: 'triangle',
			category: 'Semiconductors',
			defaultProps: {
				type: 'npn',
				value: 'Q1',
				componentType: 'q_npn',
				model: '2N2222'
			}
		},
		{
			id: 'transistor-pnp',
			name: 'PNP Transistor',
			type: 'transistor',
			icon: 'triangle',
			category: 'Semiconductors',
			defaultProps: {
				type: 'pnp',
				value: 'Q1',
				componentType: 'q_pnp',
				model: '2N2907'
			}
		},
		{
			id: 'transistor-nmos',
			name: 'NMOS',
			type: 'transistor',
			icon: 'triangle',
			category: 'Semiconductors',
			defaultProps: {
				type: 'nmos',
				value: 'M1',
				componentType: 'q_nmos',
				model: 'BSS138'
			}
		},
		{
			id: 'transistor-pmos',
			name: 'PMOS',
			type: 'transistor',
			icon: 'triangle',
			category: 'Semiconductors',
			defaultProps: {
				type: 'pmos',
				value: 'M1',
				componentType: 'q_pmos',
				model: 'BSS84'
			}
		},

		// Power & Ground
		{
			id: 'vcc',
			name: 'VCC',
			type: 'power',
			icon: 'battery',
			category: 'Power',
			defaultProps: {
				powerType: 'vcc',
				voltage: '5V',
				componentType: 'vcc'
			}
		},
		{
			id: 'vdd',
			name: 'VDD',
			type: 'power',
			icon: 'battery',
			category: 'Power',
			defaultProps: {
				powerType: 'vdd',
				voltage: '3.3V',
				componentType: 'vdd'
			}
		},
		{
			id: 'vss',
			name: 'VSS',
			type: 'power',
			icon: 'battery',
			category: 'Power',
			defaultProps: {
				powerType: 'vss',
				voltage: '0V',
				componentType: 'vss'
			}
		},
		{
			id: 'gnd',
			name: 'Ground',
			type: 'ground',
			icon: 'minus',
			category: 'Power',
			defaultProps: {
				groundType: 'gnd',
				componentType: 'gnd'
			}
		},
		{
			id: 'dgnd',
			name: 'Digital Ground',
			type: 'ground',
			icon: 'minus',
			category: 'Power',
			defaultProps: {
				groundType: 'dgnd',
				componentType: 'dgnd'
			}
		},
		{
			id: 'agnd',
			name: 'Analog Ground',
			type: 'ground',
			icon: 'minus',
			category: 'Power',
			defaultProps: {
				groundType: 'agnd',
				componentType: 'agnd'
			}
		},

		// Integrated Circuits
		{
			id: 'opamp',
			name: 'Op-Amp',
			type: 'ic',
			icon: 'cpu',
			category: 'ICs',
			defaultProps: {
				type: 'opamp',
				value: 'U1',
				componentType: 'opamp',
				model: 'LM358'
			}
		},
		{
			id: 'regulator',
			name: 'Voltage Regulator',
			type: 'ic',
			icon: 'cpu',
			category: 'ICs',
			defaultProps: {
				type: 'regulator',
				value: 'U1',
				componentType: 'regulator',
				model: 'LM7805'
			}
		},
		{
			id: 'ic-custom',
			name: 'Custom IC',
			type: 'ic',
			icon: 'cpu',
			category: 'ICs',
			defaultProps: {
				type: 'custom',
				value: 'U1',
				pinCount: 8,
				componentType: 'ic',
				model: 'Custom'
			}
		}
	];

	const categories = Array.from(new Set(componentLibrary.map(comp => comp.category)));
	let selectedCategory = 'Passive';

	function handleComponentClick(component: ComponentDefinition) {
		console.log('Component clicked:', component);
		dispatch('add-component', component.defaultProps);
		console.log('Dispatched add-component event with:', component.defaultProps);
	}

	function handleKeydown(event: KeyboardEvent, component: ComponentDefinition) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleComponentClick(component);
		}
	}

	function handleDragStart(event: DragEvent, component: ComponentDefinition) {
		if (event.dataTransfer) {
			event.dataTransfer.setData('application/json', JSON.stringify(component.defaultProps));
			event.dataTransfer.effectAllowed = 'copy';
		}
	}

	$: filteredComponents = componentLibrary.filter(comp => comp.category === selectedCategory);
</script>

<div class="component-palette">
	<div class="palette-header">
		<h3>Components</h3>
	</div>

	<!-- Category Tabs -->
	<div class="category-tabs">
		{#each categories as category}
			<button 
				class="category-tab"
				class:active={selectedCategory === category}
				on:click={() => selectedCategory = category}
			>
				{category}
			</button>
		{/each}
	</div>

	<!-- Component Grid -->
	<div class="component-grid">
		{#each filteredComponents as component}
			<div 
				class="component-item"
				draggable="true"
				on:dragstart={(e) => handleDragStart(e, component)}
				on:click={() => handleComponentClick(component)}
				on:keydown={(e) => handleKeydown(e, component)}
				role="button"
				tabindex="0"
				title={component.name}
			>
				<div class="component-icon">
					<span class="icon-symbol">{iconMap[component.icon]?.() || '?'}</span>
				</div>
				<div class="component-name">
					{component.name}
				</div>
			</div>
		{/each}
	</div>

	<!-- Instructions -->
	<div class="palette-footer">
		<div class="instruction">
			<span>↔</span>
			<span>Click or drag to add</span>
		</div>
	</div>
</div>

<style>
	.component-palette {
		width: 280px;
		background: #2a2a2a;
		border-right: 1px solid #404040;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.palette-header {
		padding: 1rem;
		border-bottom: 1px solid #404040;
	}

	.palette-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #ffffff;
	}

	.category-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.75rem;
		border-bottom: 1px solid #404040;
	}

	.category-tab {
		padding: 0.375rem 0.75rem;
		border: 1px solid #505050;
		background: #404040;
		color: #cccccc;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.category-tab:hover {
		background: #505050;
		color: #ffffff;
	}

	.category-tab.active {
		background: #0080ff;
		color: #ffffff;
		border-color: #0080ff;
	}

	.component-grid {
		flex: 1;
		padding: 0.75rem;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		overflow-y: auto;
	}

	.component-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 0.5rem;
		background: #404040;
		border: 1px solid #505050;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
		gap: 0.5rem;
		min-height: 70px;
	}

	.component-item:hover {
		background: #505050;
		border-color: #606060;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.component-item:active {
		transform: translateY(0);
	}

	.component-icon {
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.component-name {
		font-size: 0.75rem;
		color: #cccccc;
		text-align: center;
		line-height: 1.2;
	}

	.palette-footer {
		padding: 0.75rem;
		border-top: 1px solid #404040;
		background: #1a1a1a;
	}

	.instruction {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #888888;
	}

	/* Scrollbar styling */
	.component-grid::-webkit-scrollbar {
		width: 6px;
	}

	.component-grid::-webkit-scrollbar-track {
		background: #1a1a1a;
	}

	.component-grid::-webkit-scrollbar-thumb {
		background: #404040;
		border-radius: 3px;
	}

	.component-grid::-webkit-scrollbar-thumb:hover {
		background: #505050;
	}
</style>
