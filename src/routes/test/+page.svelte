<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { SvelteFlow, Controls, Background, BackgroundVariant, type Node, type Edge } from '@xyflow/svelte';
	
	// Import custom components
	import ComponentPalette from './components/ComponentPalette.svelte';
	import PropertyEditor from './components/PropertyEditor.svelte';
	import CircuitExporter from './components/CircuitExporter.svelte';
	
	// Import custom node types
	import ResistorNode from './nodes/ResistorNode.svelte';
	import TransistorNode from './nodes/TransistorNode.svelte';
	import PowerNode from './nodes/PowerNode.svelte';
	import GroundNode from './nodes/GroundNode.svelte';
	import CapacitorNode from './nodes/CapacitorNode.svelte';
	import InductorNode from './nodes/InductorNode.svelte';
	import DiodeNode from './nodes/DiodeNode.svelte';
	import ICNode from './nodes/ICNode.svelte';

	// Define interfaces for node data
	interface NodeData {
		[key: string]: any;
		rotation?: number;
	}

	// Custom node type definitions
	const nodeTypes = {
		resistor: ResistorNode,
		transistor: TransistorNode,
		power: PowerNode,
		ground: GroundNode,
		capacitor: CapacitorNode,
		inductor: InductorNode,
		diode: DiodeNode,
		ic: ICNode
	};

	// Circuit state
	let nodes: Writable<Node[]> = writable([]);
	let edges: Writable<Edge[]> = writable([]);
	$: nodesValue = $nodes;
	$: edgesValue = $edges;
	let selectedNode: Node | null = null;
	let showPropertyEditor = false;
	let showExporter = false;

	// Dev mode state
	let devMode = false;
	let showDebugInfo = false;
	let connectionMode = false;

	// Grid and flow configuration
	const flowConfig = {
		snapToGrid: true,
		snapGrid: [10, 10] as [number, number],
		defaultViewport: { x: 0, y: 0, zoom: 1 },
		maxZoom: 5,
		minZoom: 0.1,
		panOnDrag: !connectionMode, // Disable pan when in connection mode
		selectNodesOnDrag: false,
		multiSelectionKeyCode: 'Control',
		proOptions: { hideAttribution: true },
		// Improve drag and drop performance
		nodesDraggable: !connectionMode, // Disable dragging when connecting
		nodesConnectable: true,
		elementsSelectable: true,
		// Reduce hover interference
		connectionRadius: connectionMode ? 30 : 20,
		nodeOrigin: [0.5, 0.5] as [number, number],
		// Better connection handling
		connectionMode: connectionMode ? 'strict' : 'loose',
		// Prevent overlapping issues
		zoomOnScroll: true,
		preventScrolling: false,
		// Improve performance
		onlyRenderVisibleElements: true
	};

	// Component ID counter
	let componentIdCounter = 1;

	// Handle node selection
	function handleNodeClick(event: { node: Node; event: MouseEvent | TouchEvent }) {
		const { node } = event;
		
		// Prevent selection when in connection mode to avoid interference
		if (connectionMode) {
			if (devMode) console.log('Node click ignored in connection mode');
			return;
		}
		
		selectedNode = node;
		showPropertyEditor = true;
		if (devMode) console.log('Node selected:', node.id);
	}

	// Handle new connections
	function handleConnection(connection: any) {
		console.log('Creating connection:', connection);
		
		// Generate unique net ID for this connection
		const netId = `net_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		const newEdge = {
			...connection,
			id: netId,
			type: 'default',
			style: 'stroke: #00ff00; stroke-width: 2px;',
			animated: false,
			markerEnd: {
				type: 'arrow',
				color: '#00ff00'
			},
			// Set proper z-index for edges
			zIndex: 500 // Lower than nodes but above background
		};
		
		edges.update(currentEdges => {
			console.log('Adding edge:', newEdge);
			return [...currentEdges, newEdge];
		});
	}

	// Handle drag and drop from palette
	function handleDrop(event: DragEvent) {
		event.preventDefault();
		
		if (!event.dataTransfer) return;
		
		try {
			const componentData = JSON.parse(event.dataTransfer.getData('application/json'));
			
			// Get drop position relative to the canvas
			const canvasRect = (event.target as HTMLElement).getBoundingClientRect();
			const x = event.clientX - canvasRect.left;
			const y = event.clientY - canvasRect.top;
			
			// Calculate z-index for the new node
			const baseZIndex = 1000;
			const componentZIndex = baseZIndex + $nodes.length;
			
			const newNode: Node = {
				id: `${componentData.type}_${componentIdCounter++}`,
				type: componentData.type,
				position: { x: x - 50, y: y - 25 }, // Center on drop point
				data: {
					...componentData,
					name: `${componentData.type.toUpperCase()}${componentIdCounter - 1}`,
					connections: {}
					// Removed zIndex from data
				},
				draggable: !connectionMode,
				selectable: true,
				style: 'position: relative;', // Keep position: relative for internal node styling
				zIndex: componentZIndex // SvelteFlow zIndex for node stacking
			};
			
			nodes.update(currentNodes => [...currentNodes, newNode]);
			if (devMode) console.log('Component dropped at:', { x, y }, newNode);
		} catch (error) {
			console.error('Failed to handle drop:', error);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
	}

	// Add component to canvas
	function addComponent(componentData: any) {
		if (devMode) console.log('Adding component:', componentData);
		
		// Improved positioning to prevent overlapping
		const gridSize = 150; // Larger grid for better spacing
		const nodesPerRow = 4;
		const currentNodeCount = $nodes.length;
		
		const col = currentNodeCount % nodesPerRow;
		const row = Math.floor(currentNodeCount / nodesPerRow);
		
		// Calculate z-index for the new node
		const baseZIndex = 1000;
		const componentZIndex = baseZIndex + currentNodeCount;
		
		const newNode: Node = {
			id: `${componentData.type}_${componentIdCounter++}`,
			type: componentData.type,
			position: { 
				x: 100 + col * gridSize,
				y: 100 + row * gridSize
			},
			data: {
				...componentData,
				name: `${componentData.type.toUpperCase()}${componentIdCounter - 1}`,
				connections: {}
				// Removed zIndex from data
			},
			// Ensure proper dragging and selection
			draggable: !connectionMode, // Disable dragging when in connection mode
			selectable: true,
			// Proper z-index styling
			style: 'position: relative;', // Keep position: relative for internal node styling
			zIndex: componentZIndex // SvelteFlow zIndex for node stacking
		};

		if (devMode) console.log('Created node:', newNode);
		nodes.update(currentNodes => {
			const updatedNodes = [...currentNodes, newNode];
			if (devMode) console.log('Updated nodes:', updatedNodes);
			return updatedNodes;
		});
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.target && (event.target as HTMLElement).tagName === 'INPUT') return;
		
		switch (event.key) {
			case 'Delete':
			case 'Backspace':
				if (selectedNode) {
					deleteSelectedNode();
				}
				break;
			case 'r':
			case 'R':
				if (selectedNode) {
					rotateSelectedNode();
				}
				break;
			case 'd':
			case 'D':
				if (event.ctrlKey || event.metaKey) {
					event.preventDefault();
					devMode = !devMode;
					console.log('Dev mode:', devMode ? 'ON' : 'OFF');
				}
				break;
			case 'i':
			case 'I':
				if (devMode && (event.ctrlKey || event.metaKey)) {
					event.preventDefault();
					showDebugInfo = !showDebugInfo;
				}
				break;
			case 'c':
			case 'C':
				if (event.ctrlKey || event.metaKey) {
					event.preventDefault();
					connectionMode = !connectionMode;
					console.log('Connection mode:', connectionMode ? 'ON' : 'OFF');
					
					// Update all nodes' draggable state when connection mode changes
					nodes.update(currentNodes => 
						currentNodes.map(node => ({
							...node,
							draggable: !connectionMode
						}))
					);
				}
				break;
			case '=':
			case '+':
				event.preventDefault();
				// Zoom in
				break;
			case '-':
				event.preventDefault();
				// Zoom out
				break;
		}
	}

	function deleteSelectedNode() {
		if (!selectedNode) return;
		
		nodes.update(currentNodes => 
			currentNodes.filter(node => node.id !== selectedNode!.id)
		);
		edges.update(currentEdges =>
			currentEdges.filter(edge => 
				edge.source !== selectedNode!.id && edge.target !== selectedNode!.id
			)
		);
		selectedNode = null;
		showPropertyEditor = false;
	}

	function rotateSelectedNode() {
		if (!selectedNode) return;
		
		nodes.update(currentNodes =>
			currentNodes.map(node => {
				if (node.id === selectedNode!.id) {
					const currentRotation = (node.data?.rotation as number) || 0;
					return {
						...node,
						data: {
							...node.data,
							rotation: (currentRotation + 90) % 360
						}
					};
				}
				return node;
			})
		);
	}

	// Update node properties
	function updateNodeProperties(nodeId: string, newData: any) {
		nodes.update(currentNodes =>
			currentNodes.map(node => {
				if (node.id === nodeId) {
					return {
						...node,
						data: { ...node.data, ...newData }
					};
				}
				return node;
			})
		);
	}

	onMount(() => {
		// Add some demo components
		setTimeout(() => {
			addComponent({ 
				type: 'resistor', 
				value: '10k', 
				orientation: 'horizontal',
				componentType: 'r_h'
			});
			
			addComponent({ 
				type: 'power', 
				voltage: '5V', 
				powerType: 'vcc',
				componentType: 'vcc'
			});
			
			addComponent({ 
				type: 'ground', 
				groundType: 'gnd',
				componentType: 'gnd'
			});
		}, 100);
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="circuit-editor">
	<div class="editor-header">
		<h1>{m.circuit_editor_title()}</h1>
		<div class="header-controls">
			<button 
				class="btn"
				class:btn-primary={!devMode}
				class:btn-dev={devMode}
				on:click={() => devMode = !devMode}
				title="Toggle dev mode (Ctrl+D)"
			>
				{devMode ? `🔧 ${m.circuit_editor_dev_mode()}` : '🔧'}
			</button>
			{#if devMode}
				<button 
					class="btn btn-secondary"
					on:click={() => showDebugInfo = !showDebugInfo}
					title="Toggle debug info (Ctrl+I)"
				>
					{showDebugInfo ? `📊 ${m.circuit_editor_debug_info()}` : '📊'}
				</button>
				<button 
					class="btn"
					class:btn-primary={!connectionMode}
					class:btn-success={connectionMode}
					on:click={() => connectionMode = !connectionMode}
					title="Toggle connection mode (Ctrl+C)"
				>
					{connectionMode ? `🔗 ${m.circuit_editor_connection_mode()}` : '🔗'}
				</button>
			{/if}
			<button 
				class="btn btn-primary"
				on:click={() => showExporter = true}
			>
				{m.circuit_editor_export_json()}
			</button>
			<button 
				class="btn btn-secondary"
				on:click={() => nodes.set([])}
			>
				{m.circuit_editor_clear_all()}
			</button>
			{#if devMode}
				<button 
					class="btn btn-primary"
					on:click={() => addComponent({ type: 'resistor', value: '1k', orientation: 'horizontal', componentType: 'r_h' })}
					title="Test add component functionality"
				>
					{m.circuit_editor_test_add()}
				</button>
			{/if}
		</div>
	</div>

	<div class="editor-content">
		<!-- Component Palette -->
		<ComponentPalette on:add-component={(e) => addComponent(e.detail)} />

		<!-- Main Canvas -->
		<div class="canvas-container" class:connection-mode={connectionMode}>
			{#if devMode && showDebugInfo}
				<div class="debug-overlay">
					<div class="debug-info">
						<h4>Debug Info</h4>
						<p>Nodes: {$nodes.length}</p>
						<p>Edges: {$edges.length}</p>
						<p>Selected: {selectedNode?.id || 'None'}</p>
						<p>Connection Mode: {connectionMode ? 'ON' : 'OFF'}</p>
						<p>Dev Mode: {devMode ? 'ON' : 'OFF'}</p>
					</div>
				</div>
			{/if}
			<SvelteFlow 
				nodes={nodesValue} 
				edges={edgesValue} 
				{nodeTypes}
				{...flowConfig}
				onnodeclick={handleNodeClick}
				onconnect={handleConnection}
				fitView={false}
				style="width: 100%; height: 100%;"
			>
				<Controls />
				<Background 
					variant={BackgroundVariant.Dots}
					gap={20}
				/>
			</SvelteFlow>
		</div>

		<!-- Property Editor -->
		{#if showPropertyEditor && selectedNode}
			<PropertyEditor 
				node={selectedNode}
				on:update={(e) => updateNodeProperties(selectedNode?.id || '', e.detail)}
				on:close={() => showPropertyEditor = false}
			/>
		{/if}
	</div>

	<!-- Circuit Exporter Modal -->
	{#if showExporter}
		<CircuitExporter 
			nodes={nodes}
			edges={edges}
			on:close={() => showExporter = false}
		/>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', system-ui, sans-serif;
	}

	.circuit-editor {
		height: calc(100vh - 56px); /* Account for navbar height */
		display: flex;
		flex-direction: column;
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: #f8f9fa;
		border-bottom: 1px solid #e9ecef;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.editor-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #212529;
	}

	.header-controls {
		display: flex;
		gap: 0.75rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.btn-primary {
		background: #0d6efd;
		color: white;
		border: 1px solid #0d6efd;
	}

	.btn-primary:hover {
		background: #0b5ed7;
		border-color: #0a58ca;
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
		border: 1px solid #6c757d;
	}

	.btn-secondary:hover {
		background: #5c636a;
		border-color: #565e64;
	}

	.btn-dev {
		background: #fd7e14;
		color: white;
		border: 1px solid #fd7e14;
	}

	.btn-dev:hover {
		background: #e76c00;
		border-color: #d63200;
	}

	.btn-success {
		background: #198754;
		color: white;
		border: 1px solid #198754;
	}

	.btn-success:hover {
		background: #157347;
		border-color: #146c43;
	}

	.editor-content {
		flex: 1;
		display: flex;
		position: relative;
		min-height: 0; /* Allows proper flex shrinking */
		gap: 1rem;
		padding: 1rem;
	}

	.canvas-container {
		flex: 1;
		position: relative;
		min-height: 0; /* Allow flex shrinking */
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		background: #ffffff;
		border: 1px solid #e9ecef;
		min-height: 500px; /* Ensure minimum height */
	}

	/* Ensure Svelte Flow takes full space */
	.canvas-container :global(.svelte-flow) {
		width: 100% !important;
		height: 100% !important;
	}

	/* Hide any attribution that might still show */
	.canvas-container :global(.svelte-flow__attribution) {
		display: none !important;
	}

	/* Improve edge styling */
	.canvas-container :global(.svelte-flow__edge) {
		stroke: #00ff00;
		stroke-width: 2px;
	}

	.canvas-container :global(.svelte-flow__edge.selected) {
		stroke: #ff6b35;
		stroke-width: 3px;
	}
</style>