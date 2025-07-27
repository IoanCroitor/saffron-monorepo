<script lang="ts">
	import DebugNodeMenu from './components/DebugNodeMenu.svelte';
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
	import {
		initCollaboration,
		hasEditRights,
		broadcastNodeMovement,
		updateCursorAction,
		broadcastComponentAdded,
		broadcastComponentRemoved,
		broadcastConnectionAdded,
		broadcastConnectionRemoved,
		generateComponentId
	} from './services/collaboration';
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

	$effect(() => {
		console.log('Nodes:', nodes);
		console.log('Edges:', edges);
	});

	let selectedNode = $state<Node | null>(null);
	let selectedWire = $state<Edge | null>(null);
	let isDragOver = $state(false);
	let dragPosition = $state<{ x: number; y: number } | null>(null);
	let svelteFlowInstance = $state<any>(null);
	let showSaveDialog = $state(false);
	let showLoadDialog = $state(false);
	let showCollaborationDialog = $state(false);
	let showDebugMenu = $state(false);
	let currentProjectId = $state<string | null>(null);
	let currentProjectName = $state<string>('Untitled Circuit');
	let hasUnsavedChanges = $state(false);
	let dragUpdateTimeout: ReturnType<typeof setTimeout>;

	// Collaboration state
	let isCollaborative = $state(false);
	let isSaving = $state(false);
	let isReadOnlyMode = $state(false);
	let collaboratorCount = $state(0);
	let collaborationCleanupFn: (() => void) | null = null;

	// Force refresh key for reactive updates
	const flowKey = $derived(JSON.stringify(edges.map((e) => ({ id: e.id, data: e.data }))));

	// Force refresh function to trigger wire updates
	function forceRefreshWires() {
		// Create a new array reference to trigger reactivity
		edges = [...edges];
		// Also update the selected wire if it exists
		if (selectedWire?.id) {
			const updatedWire = edges.find((edge) => edge.id === selectedWire!.id);
			if (updatedWire) {
				selectedWire = { ...updatedWire };
			}
		}
	}

	// Enhanced reactive effect for bulletproof position handling
	$effect(() => {
		const store = $circuitStore;

		// Skip updates if store is empty during initialization
		if (!store.nodes || store.nodes.length === 0) {
			return;
		}

		// Check for structural changes (components added/removed)
		const currentNodeIds = new Set(nodes.map((n) => n.id));
		const storeNodeIds = new Set(store.nodes.map((n) => n.id));
		const structuralChange =
			currentNodeIds.size !== storeNodeIds.size ||
			!Array.from(currentNodeIds).every((id) => storeNodeIds.has(id)) ||
			!Array.from(storeNodeIds).every((id) => currentNodeIds.has(id));

		// Check for data/parameter changes in existing nodes
		const dataChange =
			!structuralChange &&
			store.nodes.some((storeNode) => {
				const currentNode = nodes.find((n) => n.id === storeNode.id);
				return currentNode && JSON.stringify(currentNode.data) !== JSON.stringify(storeNode.data);
			});

		if (structuralChange || dataChange) {
			// Create a robust position tracking system
			const currentPositions = new Map(nodes.map((node) => [node.id, { ...node.position }]));

			// Track newly added components with bulletproof detection
			const newNodeIds = new Set(
				store.nodes.filter((storeNode) => !currentNodeIds.has(storeNode.id)).map((node) => node.id)
			);

			// Enhanced position update logic with multiple fallbacks
			nodes = store.nodes.map((storeNode) => {
				const currentPos = currentPositions.get(storeNode.id);

				// Priority 1: New components always use store position (prevents center reversion)
				const isNewComponent = newNodeIds.has(storeNode.id);
				if (isNewComponent) {
					return { ...storeNode };
				}

				// Priority 2: No current position means fresh load - use store
				if (!currentPos) {
					return { ...storeNode };
				}

				// Priority 3: Detect collaborator updates with enhanced threshold
				const positionDelta = {
					x: Math.abs(storeNode.position.x - currentPos.x),
					y: Math.abs(storeNode.position.y - currentPos.y)
				};

				const isCollaboratorUpdate =
					isCollaborative && (positionDelta.x > 15 || positionDelta.y > 15); // Increased threshold for reliability

				if (isCollaboratorUpdate) {
					return { ...storeNode };
				}

				// Priority 4: Handle zero positions (default center) - use store position
				const isZeroPosition = storeNode.position.x === 0 && storeNode.position.y === 0;
				if (isZeroPosition) {
					return { ...storeNode };
				}

				// Priority 5: Handle invalid positions
				const isInvalidPosition =
					!isFinite(currentPos.x) ||
					!isFinite(currentPos.y) ||
					currentPos.x < -10000 ||
					currentPos.x > 10000 ||
					currentPos.y < -10000 ||
					currentPos.y > 10000;

				if (isInvalidPosition) {
					return { ...storeNode };
				}

				// Default: Preserve current position for local changes
				return { ...storeNode, position: currentPos };
			});
		}

		// Bulletproof edge synchronization
		const newEdges = [...store.edges];
		const edgesChanged =
			JSON.stringify(edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))) !==
			JSON.stringify(newEdges.map((e) => ({ id: e.id, source: e.source, target: e.target })));

		if (edgesChanged) {
			edges = newEdges;
		}

		// Sync selected wire with enhanced error checking
		if (selectedWire?.id) {
			const updatedEdge = store.edges.find((edge) => edge.id === selectedWire!.id);
			if (updatedEdge && JSON.stringify(updatedEdge) !== JSON.stringify(selectedWire)) {
				selectedWire = { ...updatedEdge };
			} else if (!updatedEdge) {
				// Wire was deleted
				selectedWire = null;
			}
		}
	});

	// Keep selectedWire synchronized with store changes
	$effect(() => {
		if (selectedWire?.id && edges.length > 0) {
			const updatedWire = edges.find((edge) => edge.id === selectedWire!.id);
			if (updatedWire && updatedWire !== selectedWire) {
				selectedWire = updatedWire;
			}
		}
	});

	// Keep selectedNode synchronized with store changes
	$effect(() => {
		if (selectedNode?.id && nodes.length > 0) {
			const updatedNode = nodes.find((node) => node.id === selectedNode!.id);
			if (
				updatedNode &&
				JSON.stringify(updatedNode.data?.parameters) !==
					JSON.stringify(selectedNode.data?.parameters)
			) {
				selectedNode = updatedNode;
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
			const isInputField =
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable ||
				target.closest('input') ||
				target.closest('textarea');

			if (event.key === 'Escape') {
				selectedWire = null;
				selectedNode = null;
			} else if (event.key === 'd' && !isInputField) {
				// Toggle debug menu with 'D' key
				event.preventDefault();
				showDebugMenu = !showDebugMenu;
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

				collaborationCleanupFn = (await initCollaboration(currentProjectId)) || null;
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

		// Broadcast connection addition to collaborators
		if (isCollaborative && !isReadOnlyMode) {
			broadcastConnectionAdded(newEdge);
		}
	}

	function onNodeDrag(params: any) {
		// Enhanced real-time position updates during drag with bulletproof error handling
		const { node } = params;
		if (!node?.position || !node.id) return;

		try {
			// Validate position values
			const position = {
				x: isFinite(node.position.x) ? node.position.x : 0,
				y: isFinite(node.position.y) ? node.position.y : 0
			};

			// Clamp positions to reasonable bounds
			position.x = Math.max(-5000, Math.min(5000, position.x));
			position.y = Math.max(-5000, Math.min(5000, position.y));

			// Always update store with throttling for performance
			clearTimeout(dragUpdateTimeout);
			dragUpdateTimeout = setTimeout(() => {
				try {
					circuitStore.updateNodePosition(node.id, position);

					// Broadcast to collaborators if in collaborative mode
					if (isCollaborative && !isReadOnlyMode) {
						broadcastNodeMovement(node.id, position);
					}
				} catch (error) {
					console.warn('Error updating node position during drag:', error);
				}
			}, 50); // Faster updates for better real-time feel
		} catch (error) {
			console.error('Error in onNodeDrag:', error);
		}
	}

	function onNodeDragStart(params: any) {
		try {
			// Enhanced cursor state tracking
			if (isCollaborative && params.node?.id) {
				updateCursorAction('dragging', params.node.id);
			}
		} catch (error) {
			console.warn('Error updating cursor action on drag start:', error);
		}
	}

	function onNodeDragStop(params: any) {
		try {
			// Clear any pending throttled updates
			clearTimeout(dragUpdateTimeout);

			// Final position update with validation
			const { node } = params;
			if (node?.position && node.id) {
				const position = {
					x: isFinite(node.position.x) ? node.position.x : 0,
					y: isFinite(node.position.y) ? node.position.y : 0
				};

				// Clamp to reasonable bounds
				position.x = Math.max(-5000, Math.min(5000, position.x));
				position.y = Math.max(-5000, Math.min(5000, position.y));

				// Update store with final position
				circuitStore.updateNodePosition(node.id, position);

				// Broadcast final position to collaborators
				if (isCollaborative && !isReadOnlyMode) {
					broadcastNodeMovement(node.id, position);
				}
			}

			// Reset cursor action
			if (isCollaborative) {
				updateCursorAction('idle');
			}
		} catch (error) {
			console.error('Error in onNodeDragStop:', error);
		}
	}

	// Function to sync all current node positions to the store
	function syncAllPositionsToStore() {
		nodes.forEach((node) => {
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

		try {
			if (!event.dataTransfer) return;

			const componentType = event.dataTransfer.getData('application/reactflow');
			if (!componentType) return;

			// Enhanced position calculation with multiple fallbacks
			let position = { x: 100, y: 100 }; // Safe default

			if (svelteFlowInstance) {
				try {
					const canvasPosition = svelteFlowInstance.screenToFlowPosition({
						x: event.clientX,
						y: event.clientY
					});

					// Validate the calculated position
					if (isFinite(canvasPosition.x) && isFinite(canvasPosition.y)) {
						position = {
							x: Math.max(-5000, Math.min(5000, canvasPosition.x)),
							y: Math.max(-5000, Math.min(5000, canvasPosition.y))
						};
					}
				} catch (positionError) {
					console.warn('Error calculating drop position, using fallback:', positionError);
					// Use mouse position relative to viewport as fallback
					position = {
						x: Math.max(0, event.clientX - 200),
						y: Math.max(0, event.clientY - 100)
					};
				}
			}

			// Generate bulletproof component ID
			const userId = $page.data.session?.user?.id || 'anonymous';
			const componentId = generateComponentId(componentType, userId);

			// Add component with enhanced error handling
			try {
				const actualId = circuitStore.addComponent(componentType, position, componentId);

				// Broadcast to collaborators with retry logic
				if (isCollaborative && !isReadOnlyMode) {
					const finalId = actualId || componentId;
					setTimeout(() => {
						// Small delay to ensure local state is updated first
						broadcastComponentAdded(componentType, position, finalId);
					}, 10);
				}

				console.log(`Successfully added ${componentType} at position:`, position);
			} catch (addError) {
				console.error('Error adding component to store:', addError);
				// Try with fallback position
				const fallbackPosition = { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 };
				circuitStore.addComponent(componentType, fallbackPosition, componentId);
			}
		} catch (error) {
			console.error('Error in onDrop:', error);
		} finally {
			// Always clean up drag state
			isDragOver = false;
			dragPosition = null;
		}
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
			const confirmed = confirm(
				'You have unsaved changes. Are you sure you want to create a new circuit?'
			);
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
			const confirmed = confirm(
				'You have unsaved changes. Are you sure you want to load a different circuit?'
			);
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
</svelte:head>
<DebugNodeMenu bind:isVisible={showDebugMenu} on:close={() => (showDebugMenu = false)} />
<div class="bg-background flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden">
	<!-- Toolbar -->
	<div
		class="bg-card border-border flex flex-shrink-0 items-center justify-between border-b px-4 py-2"
	>
		<div class="flex items-center space-x-4">
			<h1 class="text-card-foreground flex items-center text-lg font-semibold">
				{currentProjectName}
				{#if hasUnsavedChanges}
					<span class="text-destructive ml-2 text-sm">●</span>
				{/if}
			</h1>
		</div>

		<div class="flex items-center space-x-2">
			<button
				onclick={handleNew}
				class="text-muted-foreground bg-secondary border-border hover:bg-secondary/80 flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
				title="New Circuit (Ctrl+N)"
			>
				<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				New
			</button>

			<button
				onclick={handleLoad}
				class="text-muted-foreground bg-secondary border-border hover:bg-secondary/80 flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
				title="Load Circuit (Ctrl+O)"
			>
				<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
					/>
				</svg>
				Load
			</button>

			<button
				onclick={handleSave}
				class="text-primary-foreground bg-primary border-primary hover:bg-primary/90 flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
				title="Save Circuit (Ctrl+S)"
			>
				<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
					/>
				</svg>
				{currentProjectId ? 'Update' : 'Save'}
			</button>

			<button
				onclick={() => (showCollaborationDialog = true)}
				class="text-muted-foreground bg-secondary border-border hover:bg-secondary/80 flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
				title="Collaborative Editing"
			>
				<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
				Collaborate
				{#if collaboratorCount > 0}
					<span
						class="bg-chart-2 text-primary-foreground ml-1 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs"
					>
						{collaboratorCount}
					</span>
				{/if}
			</button>
		</div>
	</div>

	<div
		class="bg-background flex min-h-0 flex-1 overflow-hidden"
		class:colored-handles={$settingsStore.coloredHandles}
	>
		<!-- Left Sidebar - Components -->
		<ComponentsSidebar />

		<!-- Main Canvas -->
		<div
			class="relative flex-1 overflow-hidden"
			ondragover={onDragOver}
			ondrop={onDrop}
			ondragleave={onDragLeave}
			role="application"
			aria-label="Circuit canvas - drag components here"
		>
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
				onnodedrag={onNodeDrag}
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
							case 'resistor':
								return '#ef4444';
							case 'capacitor':
								return '#3b82f6';
							case 'inductor':
								return '#10b981';
							case 'voltageSource':
								return '#f59e0b';
							default:
								return '#6b7280';
						}
					}}
				/>

				<!-- Status Panel -->
				<Panel position="bottom-right" class="bg-card border-border rounded-lg border p-3 text-sm">
					{#if selectedWire}
						<div class="text-primary font-medium">
							Wire Selected: {selectedWire.id}
						</div>
						<div class="text-muted-foreground mt-1 text-xs">
							Shape: {selectedWire.data?.wireShape || 'straight'} | Style: {selectedWire.data
								?.wireStyle || 'solid'}
						</div>
					{:else if selectedNode}
						<div class="text-chart-2 font-medium">
							{selectedNode.type} Selected
						</div>
						<div class="text-muted-foreground mt-1 text-xs">
							ID: {selectedNode.id}
						</div>
					{:else if isDragOver}
						<div class="text-chart-3 animate-pulse font-medium">Drop component here</div>
					{:else if isCollaborative}
						<div class="flex items-center gap-2">
							<span class="relative flex h-2 w-2">
								<span
									class="bg-chart-2 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
								></span>
								<span class="bg-chart-2 relative inline-flex h-2 w-2 rounded-full"></span>
							</span>
							<span class="text-muted-foreground">
								{isReadOnlyMode ? 'Read-only' : 'Collaborative'} mode
								{#if collaboratorCount > 0}
									· {collaboratorCount} {collaboratorCount === 1 ? 'person' : 'people'} editing
								{/if}
								{#if isSaving}
									<span class="text-chart-3 ml-1">· Saving...</span>
								{:else if $circuitStore.throttledSave}
									<span class="text-chart-3 ml-1">· Saving...</span>
								{:else if $circuitStore.pendingChanges}
									<span class="text-chart-3 ml-1">· Unsaved changes</span>
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
						<div class="drag-preview-content">Drop Here</div>
					</div>
				{/if}

				<!-- Collaborative Cursors -->
				{#if isCollaborative}
					<CollaborativeCursors />
				{/if}
			</SvelteFlow>
		</div>

		<!-- Right Sidebar - Properties & Analysis -->
		<PropertiesSidebar bind:selectedNode bind:nodes />
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
		<LoadProjectDialog bind:show={showLoadDialog} on:projectSelected={onProjectSelected} />
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
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>
