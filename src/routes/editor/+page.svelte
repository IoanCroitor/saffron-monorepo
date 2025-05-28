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
	import SaveProjectDialog from './components/SaveProjectDialog.svelte';
	import LoadProjectDialog from './components/LoadProjectDialog.svelte';
	import CollaborationDialog from './components/CollaborationDialog.svelte';
	import { circuitStore } from './stores/circuit-store';
	import { settingsStore } from './stores/settings-store';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { initCollaboration, hasEditRights, broadcastNodeMovement, updateCursorAction, broadcastComponentAdded, broadcastComponentRemoved, generateComponentId } from './services/collaboration';
	import CollaborativeCursors from './components/CollaborativeCursors.svelte';
	
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
	let showSaveDialog = $state(false);
	let showLoadDialog = $state(false);
	let showCollaborationDialog = $state(false);
	let currentProjectId = $state<string | null>(null);
	let currentProjectName = $state<string>('Untitled Circuit');
	let hasUnsavedChanges = $state(false);
	
	// Collaboration state
	let isCollaborative = $state(false);
	let isSaving = $state(false);
	let isReadOnlyMode = $state(false);
	let collaboratorCount = $state(0);
	let collaborationCleanupFn: (() => void) | null = null;

	// Force refresh key for reactive updates
	const flowKey = $derived(JSON.stringify(edges.map(e => ({ id: e.id, data: e.data }))));

	// Force refresh function to trigger wire updates
	function forceRefreshWires() {
		// Create a new array reference to trigger reactivity
		edges = [...edges];
		// Also update the selected wire if it exists
		if (selectedWire?.id) {
			const updatedWire = edges.find(edge => edge.id === selectedWire!.id);
			if (updatedWire) {
				selectedWire = { ...updatedWire };
			}
		}
	}

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
		
		// Force sync edges with deep equality check for reactivity
		const newEdges = [...store.edges];
		if (JSON.stringify(edges) !== JSON.stringify(newEdges)) {
			edges = newEdges;
		}
		
		// If a wire is selected, update it to match the store's version
		if (selectedWire && selectedWire.id) {
			const updatedEdge = store.edges.find(edge => edge.id === selectedWire!.id);
			if (updatedEdge && JSON.stringify(updatedEdge) !== JSON.stringify(selectedWire)) {
				selectedWire = updatedEdge;
			}
		}
	});

	// Keep selectedWire synchronized with store changes
	$effect(() => {
		if (selectedWire?.id && edges.length > 0) {
			const updatedWire = edges.find(edge => edge.id === selectedWire!.id);
			if (updatedWire && updatedWire !== selectedWire) {
				selectedWire = updatedWire;
			}
		}
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
			// Check if the user is typing in an input field
			const target = event.target as HTMLElement;
			const isInputField = target.tagName === 'INPUT' || 
							   target.tagName === 'TEXTAREA' || 
							   target.isContentEditable ||
							   target.closest('input') ||
							   target.closest('textarea');
			
			if (event.key === 'Escape') {
				selectedWire = null;
				selectedNode = null;
			} else if ((event.key === 'Delete' || event.key === 'Backspace') && !isInputField) {
				// Only delete components if not typing in an input field
				if (selectedWire) {
					circuitStore.removeConnection(selectedWire.id);
					selectedWire = null;
				} else if (selectedNode) {
					const nodeId = selectedNode.id;
					circuitStore.removeComponent(nodeId);
					
					// Broadcast component removal to collaborators
					if (isCollaborative && !isReadOnlyMode) {
						broadcastComponentRemoved(nodeId);
					}
					
					selectedNode = null;
				}
			} else if (event.ctrlKey || event.metaKey) {
				// Handle Ctrl/Cmd shortcuts
				if (event.key === 's') {
					event.preventDefault();
					handleSave();
				} else if (event.key === 'o') {
					event.preventDefault();
					handleLoad();
				} else if (event.key === 'n') {
					event.preventDefault();
					handleNew();
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
	
	// Initialize collaboration when project ID is available
	$effect(() => {
		if (currentProjectId) {
			// Enable collaboration in the store
			circuitStore.enableCollaboration(currentProjectId);
			isCollaborative = true;
			
			// Initialize real-time collaboration asynchronously
			(async () => {
				// Check for edit permissions
				const canEdit = await hasEditRights(currentProjectId);
				isReadOnlyMode = !canEdit;
				
				// Initialize real-time collaboration
				if (collaborationCleanupFn) {
					collaborationCleanupFn();
				}
				
				collaborationCleanupFn = await initCollaboration(currentProjectId) || null;
			})();
		} else {
			// Disable collaboration when no project is loaded
			circuitStore.disableCollaboration();
			isCollaborative = false;
			isReadOnlyMode = false;
			
			// Clean up any existing collaboration
			if (collaborationCleanupFn) {
				collaborationCleanupFn();
				collaborationCleanupFn = null;
			}
		}
	});
	
	// Set up auto-save for collaborative editing
	let autoSaveInterval: ReturnType<typeof setInterval>;
	
	onMount(() => {
		// Check if we have a project ID in the URL
		const urlParams = new URLSearchParams(window.location.search);
		const projectId = urlParams.get('project');
		
		if (projectId) {
			// Load the project
			currentProjectId = projectId;
			loadProject(projectId);
		}
		
		// Set up auto-save interval for collaborative editing
		autoSaveInterval = setInterval(() => {
			if (isCollaborative && !isReadOnlyMode && $circuitStore.pendingChanges) {
				saveChanges();
			}
		}, 10000); // Auto-save every 10 seconds if changes
	});
	
	onDestroy(() => {
		// Clean up auto-save interval
		if (autoSaveInterval) {
			clearInterval(autoSaveInterval);
		}
		
		// Clean up collaboration
		if (collaborationCleanupFn) {
			collaborationCleanupFn();
		}
		
		// Update the store with all current positions before unmounting
		syncAllPositionsToStore();
	});

	function onNodeClick(event: any) {
		selectedNode = event.node;
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
			data: { color: '#64748b', wireShape: 'smoothstep', wireStyle: 'solid' }
		};
		circuitStore.addConnection(newEdge);
	}

	function onNodeDragStart(params: any) {
		// Update cursor action to show dragging state
		if (isCollaborative) {
			updateCursorAction('dragging', params.node.id);
		}
	}

	function onNodeDragStop(params: any) {
		// Update the circuitStore with the final position when drag stops
		const { node } = params;
		if (node && node.position) {
			circuitStore.updateNodePosition(node.id, node.position);
			
			// Broadcast position update to collaborators
			if (isCollaborative && !isReadOnlyMode) {
				broadcastNodeMovement(node.id, node.position);
			}
		}
		
		// Reset cursor action to idle
		if (isCollaborative) {
			updateCursorAction('idle');
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

		// Generate component ID that includes user info for uniqueness
		const userId = $page.data.session?.user?.id;
		const componentId = generateComponentId(componentType, userId);
		
		// Add component to store with the generated ID
		const actualId = circuitStore.addComponent(componentType, position, componentId);
		
		// Broadcast component addition to collaborators
		if (isCollaborative && !isReadOnlyMode) {
			broadcastComponentAdded(componentType, position, actualId || componentId);
		}
		
		// Clear drag state
		isDragOver = false;
		dragPosition = null;
	}

	// Track collaborator count
	import { activeCollaborators } from './services/collaboration';
	
	$effect(() => {
		collaboratorCount = Object.keys($activeCollaborators).length;
	});

	// Track changes for unsaved state
	$effect(() => {
		if (nodes.length > 0 || edges.length > 0) {
			hasUnsavedChanges = true;
		}
	});

	// Load circuit on page load if project ID is provided
	$effect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const projectId = urlParams.get('id');
		if (projectId && !currentProjectId) {
			loadProject(projectId);
		}
	});

	// Toolbar functions
	async function handleSave() {
		showSaveDialog = true;
	}

	async function handleNew() {
		if (hasUnsavedChanges) {
			const confirmed = confirm('You have unsaved changes. Are you sure you want to create a new circuit?');
			if (!confirmed) return;
		}
		
		// Clear the circuit
		circuitStore.clear();
		currentProjectId = null;
		currentProjectName = 'Untitled Circuit';
		hasUnsavedChanges = false;
		
		// Remove project ID from URL
		goto('/editor', { replaceState: true });
	}

	function handleLoad() {
		// Show load dialog to select a circuit
		showLoadDialog = true;
	}

	// Function to manually save changes for collaborative editing
	async function saveChanges() {
		if (!isCollaborative || isReadOnlyMode) return;
		
		isSaving = true;
		try {
			await circuitStore.saveChanges();
			hasUnsavedChanges = false;
		} catch (error) {
			console.error('Error saving changes:', error);
		} finally {
			isSaving = false;
		}
	}

	async function loadProject(projectId: string) {
		try {
			const result = await circuitStore.loadCircuit(projectId);
			if (result.success) {
				currentProjectId = projectId;
				currentProjectName = result.name;
				hasUnsavedChanges = false;
				
				// Enable collaboration for this project
				circuitStore.enableCollaboration(projectId);
				isCollaborative = true;
				
				// Check if user has edit rights
				const canEdit = await hasEditRights(projectId);
				isReadOnlyMode = !canEdit;
				
				// Update URL with project ID
				const url = new URL(window.location.toString());
				url.searchParams.set('project', projectId);
				history.replaceState({}, '', url.toString());
			} else {
				alert(`Failed to load project: ${result.error}`);
			}
		} catch (error) {
			console.error('Error loading project:', error);
			alert('Failed to load the project. Please try again.');
		}
	}

	async function onProjectSaved(event: CustomEvent) {
		const { projectId, name } = event.detail;
		currentProjectId = projectId;
		currentProjectName = name;
		hasUnsavedChanges = false;
		showSaveDialog = false;
		
		// Update URL with project ID
		goto(`/editor?id=${projectId}`, { replaceState: true });
	}

	async function onProjectSelected(event: CustomEvent) {
		const { projectId, name, description } = event.detail;
		
		if (hasUnsavedChanges) {
			const confirmed = confirm('You have unsaved changes. Are you sure you want to load a different circuit?');
			if (!confirmed) return;
		}
		
		showLoadDialog = false;
		await loadProject(projectId);
	}

	async function onJoinCollaboration(event: CustomEvent) {
		const { projectId } = event.detail;
		
		try {
			// Load the project
			await loadProject(projectId);
			
			// Initialize collaboration
			await initCollaboration(projectId);
			
			console.log('Successfully joined collaborative session:', projectId);
		} catch (error) {
			console.error('Failed to join collaboration:', error);
			alert('Failed to join the collaborative session. Please check the join code.');
		}
	}

	onMount(() => {
		// Check if we have a project ID in the URL
		const urlParams = new URLSearchParams(window.location.search);
		const projectId = urlParams.get('project');
		
		if (projectId) {
			// Load the project
			currentProjectId = projectId;
			loadProject(projectId);
		}
		
		// Set up auto-save interval for collaborative editing
		autoSaveInterval = setInterval(() => {
			if (isCollaborative && !isReadOnlyMode && $circuitStore.pendingChanges) {
				saveChanges();
			}
		}, 10000); // Auto-save every 10 seconds if changes
	});

	onDestroy(() => {
		// Clean up collaboration features if needed
	});
</script>

<svelte:head>
	<title>Circuit Simulator - Saffron</title>
</svelte:head>	<div class="h-[calc(100vh-4rem)] w-full flex flex-col bg-background overflow-hidden">
	<!-- Toolbar -->
	<div class="bg-card border-b border-border px-4 py-2 flex items-center justify-between flex-shrink-0">
		<div class="flex items-center space-x-4">
			<h1 class="text-lg font-semibold text-card-foreground flex items-center">
				{currentProjectName}
				{#if hasUnsavedChanges}
					<span class="ml-2 text-destructive text-sm">●</span>
				{/if}
			</h1>
		</div>
		
		<div class="flex items-center space-x-2">
			<button
				onclick={handleNew}
				class="flex items-center px-3 py-1.5 text-sm font-medium text-muted-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 transition-colors"
				title="New Circuit (Ctrl+N)"
			>
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				New
			</button>
			
			<button
				onclick={handleLoad}
				class="flex items-center px-3 py-1.5 text-sm font-medium text-muted-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 transition-colors"
				title="Load Circuit (Ctrl+O)"
			>
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
				</svg>
				Load
			</button>
			
			<button
				onclick={handleSave}
				class="flex items-center px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors"
				title="Save Circuit (Ctrl+S)"
			>
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
				</svg>
				{currentProjectId ? 'Update' : 'Save'}
			</button>
			
			<button
				onclick={() => showCollaborationDialog = true}
				class="flex items-center px-3 py-1.5 text-sm font-medium text-muted-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 transition-colors"
				title="Collaborative Editing"
			>
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
				</svg>
				Collaborate
				{#if collaboratorCount > 0}
					<span class="ml-1 bg-chart-2 text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
						{collaboratorCount}
					</span>
				{/if}
			</button>
		</div>
	</div>

	<div class="flex-1 flex bg-background min-h-0 overflow-hidden" class:colored-handles={$settingsStore.coloredHandles}>
	<!-- Left Sidebar - Components -->
	<ComponentsSidebar />
	
	<!-- Main Canvas -->
	<div class="flex-1 relative overflow-hidden" ondragover={onDragOver} ondrop={onDrop} ondragleave={onDragLeave} role="application" aria-label="Circuit canvas - drag components here">
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
			class="bg-background"
		>
		
			<Background variant={BackgroundVariant.Dots} gap={20} size={1} />
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
			<Panel position="bottom-right" class="bg-card border border-border rounded-lg p-3 text-sm">
				{#if selectedWire}
					<div class="text-primary font-medium">
						Wire Selected: {selectedWire.id}
					</div>
					<div class="text-muted-foreground text-xs mt-1">
						Shape: {selectedWire.data?.wireShape || 'straight'} | Style: {selectedWire.data?.wireStyle || 'solid'}
					</div>
				{:else if selectedNode}
					<div class="text-chart-2 font-medium">
						{selectedNode.type} Selected
					</div>
					<div class="text-muted-foreground text-xs mt-1">
						ID: {selectedNode.id}
					</div>
				{:else if isDragOver}
					<div class="text-chart-3 font-medium animate-pulse">
						Drop component here
					</div>
				{:else if isCollaborative}
					<div class="flex items-center gap-2">
						<span class="relative flex h-2 w-2">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-2 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-chart-2"></span>
						</span>
						<span class="text-muted-foreground">
							{isReadOnlyMode ? 'Read-only' : 'Collaborative'} mode
							{#if collaboratorCount > 0}
								· {collaboratorCount} {collaboratorCount === 1 ? 'person' : 'people'} editing
							{/if}
							{#if isSaving}
								<span class="ml-1 text-chart-3">· Saving...</span>
							{:else if $circuitStore.throttledSave}
								<span class="ml-1 text-chart-3">· Saving...</span>
							{:else if $circuitStore.pendingChanges}
								<span class="ml-1 text-chart-3">· Unsaved changes</span>
							{/if}
						</span>
					</div>
				{:else}
					<div class="text-muted-foreground">
						{currentProjectName}
						{#if hasUnsavedChanges}
							<span class="text-chart-3 ml-1">· Unsaved changes</span>
						{/if}
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

			<!-- Collaborative Cursors -->
			{#if isCollaborative}
				<CollaborativeCursors />
			{/if}
		</SvelteFlow>
	</div>
	
	<!-- Right Sidebar - Properties & Analysis -->
	<PropertiesSidebar {selectedNode} />
	</div>

	<!-- Wire Properties Panel (Modal) -->
	<WirePropertiesPanel bind:selectedWire bind:edges onRefresh={forceRefreshWires} />
	
	<!-- Save Project Dialog -->
	{#if showSaveDialog}
		<SaveProjectDialog 
			bind:show={showSaveDialog}
			{currentProjectId}
			currentName={currentProjectName}
			on:projectSaved={onProjectSaved}
		/>
	{/if}
	
	<!-- Load Project Dialog -->
	{#if showLoadDialog}
		<LoadProjectDialog 
			bind:show={showLoadDialog}
			on:projectSelected={onProjectSelected}
		/>
	{/if}
	
	<!-- Collaboration Dialog -->
	<CollaborationDialog 
		bind:isOpen={showCollaborationDialog}
		projectId={currentProjectId || ''}
		{collaboratorCount}
		on:join={onJoinCollaboration}
	/>
</div>

<style>
	:global(.svelte-flow) {
		background: hsl(var(--background)) !important;
	}
	
	:global(.svelte-flow .svelte-flow__node) {
		background: hsl(var(--card));
		border-color: hsl(var(--border));
		color: hsl(var(--card-foreground));
	}
	
	:global(.svelte-flow .svelte-flow__edge) {
		stroke: hsl(var(--muted-foreground));
	}
	
	:global(.svelte-flow .svelte-flow__edge.selected) {
		stroke: hsl(var(--primary));
	}
	
	:global(.svelte-flow .svelte-flow__handle) {
		background: hsl(var(--muted-foreground));
		border-color: hsl(var(--border));
	}
	
	:global(.svelte-flow .svelte-flow__handle.connectable) {
		background: hsl(var(--primary));
	}
	
	:global(.svelte-flow .svelte-flow__handle.connecting) {
		background: hsl(var(--chart-2));
	}
	
	/* MiniMap styling */
	:global(.svelte-flow .svelte-flow__minimap) {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
	}
	
	:global(.svelte-flow .svelte-flow__minimap-mask) {
		fill: hsl(var(--muted) / 0.6);
	}
	
	:global(.svelte-flow .svelte-flow__minimap-node) {
		fill: hsl(var(--muted-foreground));
		stroke: hsl(var(--border));
	}
	
	/* Controls styling */
	:global(.svelte-flow .svelte-flow__controls) {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
	}
	
	:global(.svelte-flow .svelte-flow__controls-button) {
		background: hsl(var(--card));
		border-bottom: 1px solid hsl(var(--border));
		color: hsl(var(--card-foreground));
	}
	
	:global(.svelte-flow .svelte-flow__controls-button:hover) {
		background: hsl(var(--accent));
	}
	
	/* Background pattern */
	:global(.svelte-flow .svelte-flow__background) {
		background: hsl(var(--background));
	}
	
	:global(.svelte-flow .svelte-flow__background .svelte-flow__background-pattern) {
		fill: hsl(var(--muted-foreground) / 0.08);
	}
	
	:global(.dark .svelte-flow .svelte-flow__background .svelte-flow__background-pattern) {
		fill: hsl(var(--muted-foreground) / 0.2);
	}
	
	/* Panel styling */
	:global(.svelte-flow .svelte-flow__panel) {
		background: hsl(var(--card));
		color: hsl(var(--card-foreground));
		border: 1px solid hsl(var(--border));
	}

	/* Hide SvelteFlow attribution */
	:global(.svelte-flow__panel.svelte-flow__attribution) {
		display: none !important;
	}

	:global(.svelte-flow .react-flow__attribution) {
		display: none !important;
	}

	.drag-preview {
		position: absolute;
		pointer-events: none;
		z-index: 1000;
		opacity: 0.8;
	}

	.drag-preview-content {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
		border: 2px dashed hsl(var(--primary-foreground));
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
