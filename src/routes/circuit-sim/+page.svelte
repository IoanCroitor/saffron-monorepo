<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		Panel,
		type NodeTypes,
		type EdgeTypes,
		type Node,
		type Edge,
		Position
	} from '@xyflow/svelte';
	
	import ComponentsSidebar from './components/ComponentsSidebar.svelte';
	import PropertiesSidebar from './components/PropertiesSidebar.svelte';
	import WirePropertiesPanel from './components/WirePropertiesPanel.svelte';
	import WireToolbar from './components/WireToolbar.svelte';
	import ResistorNode from './components/nodes/ResistorNode.svelte';
	import CapacitorNode from './components/nodes/CapacitorNode.svelte';
	import InductorNode from './components/nodes/InductorNode.svelte';
	import VoltageSourceNode from './components/nodes/VoltageSourceNode.svelte';
	import CurrentSourceNode from './components/nodes/CurrentSourceNode.svelte';
	import GroundNode from './components/nodes/GroundNode.svelte';
	import DiodeNode from './components/nodes/DiodeNode.svelte';
	import TransistorNode from './components/nodes/TransistorNode.svelte';
	import OpAmpNode from './components/nodes/OpAmpNode.svelte';
	import VoltmeterNode from './components/nodes/VoltmeterNode.svelte';
	import AmmeterNode from './components/nodes/AmmeterNode.svelte';
	import ProbeNode from './components/nodes/ProbeNode.svelte';
	import WireEdge from './components/edges/WireEdge.svelte';
	import { circuitStore } from './stores/circuit-store';
	
	import '@xyflow/svelte/dist/style.css';

	// Node types mapping
	const nodeTypes: NodeTypes = {
		resistor: ResistorNode,
		capacitor: CapacitorNode,
		inductor: InductorNode,
		voltageSource: VoltageSourceNode,
		currentSource: CurrentSourceNode,
		ground: GroundNode,
		diode: DiodeNode,
		transistor: TransistorNode,
		opamp: OpAmpNode,
		voltmeter: VoltmeterNode,
		ammeter: AmmeterNode,
		probe: ProbeNode
	};

	const edgeTypes: EdgeTypes = {
		wire: WireEdge
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);
	let selectedNode = $state<Node | null>(null);
	let selectedWire = $state<Edge | null>(null);
	let isDragOver = $state(false);
	let dragPosition = $state<{ x: number; y: number } | null>(null);
	let svelteFlowInstance = $state<any>(null);

	// Initialize from store and sync changes
	$effect(() => {
		const store = $circuitStore;
		
		// When nodes are added/removed, merge with existing positions
		if (nodes.length !== store.nodes.length) {
			// Create a map of current positions
			const currentPositions = new Map(
				nodes.map(node => [node.id, node.position])
			);
			
			// Update nodes while preserving current positions
			nodes = store.nodes.map(storeNode => {
				const currentPos = currentPositions.get(storeNode.id);
				return currentPos 
					? { ...storeNode, position: currentPos }
					: storeNode;
			});
		}
		
		// Always sync edges
		edges = [...store.edges];
	});

	// Listen for wire selection events
	$effect(() => {
		function handleWireSelection(event: Event) {
			const customEvent = event as CustomEvent;
			const wireData = customEvent.detail;
			selectedWire = {
				...wireData,
				source: wireData.source,
				target: wireData.target,
				sourceHandle: wireData.sourceHandle,
				targetHandle: wireData.targetHandle
			};
			selectedNode = null; // Clear node selection
		}

		// Keyboard shortcuts
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				selectedWire = null;
				selectedNode = null;
			} else if (event.key === 'Delete' || event.key === 'Backspace') {
				if (selectedWire) {
					circuitStore.removeConnection(selectedWire.id);
					selectedWire = null;
				} else if (selectedNode) {
					circuitStore.removeComponent(selectedNode.id);
					selectedNode = null;
				}
			}
		}

		document.addEventListener('wireSelected', handleWireSelection);
		document.addEventListener('keydown', handleKeyDown);
		
		return () => {
			document.removeEventListener('wireSelected', handleWireSelection);
			document.removeEventListener('keydown', handleKeyDown);
		};
	});

	function onNodeClick(event: any) {
		selectedNode = event.detail.node;
	}

	function onPaneClick() {
		selectedNode = null;
		selectedWire = null;
	}

	function onConnect(params: any) {
		const newEdge = {
			id: `edge-${params.source}-${params.target}`,
			source: params.source,
			target: params.target,
			sourceHandle: params.sourceHandle,
			targetHandle: params.targetHandle,
			type: 'wire',
			data: { color: '#64748b', wireShape: 'straight', wireStyle: 'solid' }
		};
		circuitStore.addConnection(newEdge);
	}

	function onNodeDragStart({ event, node }: any) {
		// Node drag started - no action needed
		console.log('Drag started for node:', node.id);
	}

	function onNodeDragStop({ event, node }: any) {
		// Update the circuitStore with the final position when drag stops
		if (node && node.position) {
			circuitStore.updateNodePosition(node.id, node.position);
			console.log('Updated position for node:', node.id, node.position);
		}
	}

	// Function to sync all current node positions to the store
	function syncAllPositionsToStore() {
		nodes.forEach(node => {
			circuitStore.updateNodePosition(node.id, node.position);
		});
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		
		// Update drag position for visual feedback
		isDragOver = true;
		if (svelteFlowInstance) {
			const position = svelteFlowInstance.screenToFlowPosition({
				x: event.clientX,
				y: event.clientY
			});
			dragPosition = position;
		}
	}

	function onDragLeave(event: DragEvent) {
		// Only hide if we're leaving the main canvas area
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		if (
			event.clientX < rect.left ||
			event.clientX > rect.right ||
			event.clientY < rect.top ||
			event.clientY > rect.bottom
		) {
			isDragOver = false;
			dragPosition = null;
		}
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		
		const componentType = event.dataTransfer?.getData('application/reactflow');
		if (!componentType) return;

		// Use SvelteFlow's coordinate transformation to get the correct position
		let position = { x: event.clientX - 300, y: event.clientY - 100 }; // Fallback positioning
		
		if (svelteFlowInstance) {
			position = svelteFlowInstance.screenToFlowPosition({
				x: event.clientX,
				y: event.clientY
			});
		}

		circuitStore.addComponent(componentType, position);
		
		// Clear drag state
		isDragOver = false;
		dragPosition = null;
	}
</script>

<svelte:head>
	<title>Circuit Simulator - Saffron</title>
</svelte:head>

<div class="h-screen w-full flex bg-background">
	<!-- Left Sidebar - Components -->
	<ComponentsSidebar />
	
	<!-- Main Canvas -->
	<div class="flex-1 relative" ondragover={onDragOver} ondrop={onDrop} ondragleave={onDragLeave} role="application" aria-label="Circuit canvas - drag components here">
		<SvelteFlow
			bind:nodes
			bind:edges
			bind:this={svelteFlowInstance}
			{nodeTypes}
			{edgeTypes}
			fitView
			snapGrid={[10, 10]}
			onnodeclick={onNodeClick}
			onpaneclick={onPaneClick}
			onconnect={onConnect}
			onnodedragstart={onNodeDragStart}
			onnodedragstop={onNodeDragStop}
			onedgeclick={(event) => {
				const edge = event.edge;
				selectedWire = edge;
				selectedNode = null;
			}}
			class="bg-white dark:bg-gray-900"
		>
			<Controls position="top-left" />
			<Background variant={BackgroundVariant.Dots} />
			<MiniMap 
				position="bottom-left"
				nodeColor={(node) => {
					switch (node.type) {
						case 'resistor': return '#ef4444';
						case 'capacitor': return '#3b82f6';
						case 'inductor': return '#10b981';
						case 'voltageSource': return '#f59e0b';
						default: return '#6b7280';
					}
				}}
			/>

			<!-- Status Panel -->
			<Panel position="bottom-right" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm">
				{#if selectedWire}
					<div class="text-blue-600 dark:text-blue-400 font-medium">
						Wire Selected: {selectedWire.id}
					</div>
					<div class="text-gray-600 dark:text-gray-400 text-xs mt-1">
						Shape: {selectedWire.data?.wireShape || 'straight'} | Style: {selectedWire.data?.wireStyle || 'solid'}
					</div>
				{:else if selectedNode}
					<div class="text-green-600 dark:text-green-400 font-medium">
						{selectedNode.type} Selected
					</div>
					<div class="text-gray-600 dark:text-gray-400 text-xs mt-1">
						ID: {selectedNode.id}
					</div>
				{:else if isDragOver}
					<div class="text-orange-600 dark:text-orange-400 font-medium animate-pulse">
						Drop component here
					</div>
				{:else}
					<div class="text-gray-600 dark:text-gray-400">
						Drag components from sidebar • Click wires to style • ESC to deselect
					</div>
				{/if}
			</Panel>
			
			<!-- Drag preview overlay -->
			{#if isDragOver && dragPosition}
				<div 
					class="drag-preview"
					style="transform: translate({dragPosition.x - 40}px, {dragPosition.y - 20}px)"
				>
					<div class="drag-preview-content">
						Drop Here
					</div>
				</div>
			{/if}
		</SvelteFlow>
	</div>
	
	<!-- Right Sidebar - Properties & Analysis -->
	<PropertiesSidebar {selectedNode} />

	<!-- Wire Properties Panel (Modal) -->
	<WirePropertiesPanel bind:selectedWire />

	<!-- Wire Toolbar -->
	<WireToolbar {selectedWire} />
</div>

<style>
	:global(.svelte-flow) {
		background: white;
	}
	
	:global(.dark .svelte-flow) {
		background: #111827;
	}

	.drag-preview {
		position: absolute;
		pointer-events: none;
		z-index: 1000;
		opacity: 0.8;
	}

	.drag-preview-content {
		background: #3b82f6;
		color: white;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		border: 2px dashed white;
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>
