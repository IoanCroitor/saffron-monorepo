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
	import CursorNode from './components/nodes/CursorNode.svelte';
	import WireEdge from './components/edges/WireEdge.svelte';
	import SaveProjectDialog from './components/SaveProjectDialog.svelte';
	import LoadProjectDialog from './components/LoadProjectDialog.svelte';
	import CollaborationDialog from './components/CollaborationDialog.svelte';
	import SaveIndicator from './components/SaveIndicator.svelte';
	import { settingsStore } from './stores/settings-store';
	import { circuitAPI } from './services/circuit-api';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	let session = $derived($page.data.session);
	let user = $derived($page.data.user);
	import {
		initCollaboration,
		broadcastNodeMovement,
		updateCursorAction,
		updateCursorPosition,
		broadcastComponentAdded,
		broadcastComponentRemoved,
		broadcastConnectionAdded,
		broadcastConnectionRemoved,
		generateComponentId
	} from './services/collaboration';
	// Removed CollaborativeCursors - now using SvelteFlow cursor nodes

	import '@xyflow/svelte/dist/style.css';

	// Default parameters for different component types
	function getDefaultParameters(type: string): any {
		switch (type) {
			case 'resistor':
				return {
					resistance: '1k',
					tolerance: '5%',
					power: '0.25W',
					temperature_coefficient: '100'
				};
			case 'capacitor':
				return {
					capacitance: '1μ',
					voltage: '25V',
					type: 'Ceramic',
					esr: '0.1'
				};
			case 'inductor':
				return {
					inductance: '1m',
					current: '1A',
					dcr: '1',
					core_material: 'Ferrite'
				};
			case 'voltageSource':
				return {
					voltage: '5V',
					type: 'DC',
					frequency: '60',
					phase: 0
				};
			case 'currentSource':
				return {
					current: '1A',
					type: 'DC'
				};
			case 'diode':
				return {
					type: '1N4148',
					forwardVoltage: '0.7',
					current: '200m',
					reverse_voltage: '100'
				};
			case 'transistor':
				return {
					type: '2N3904',
					configuration: 'NPN',
					beta: 100,
					vce_sat: '0.2'
				};
			case 'opamp':
				return {
					type: 'LM741',
					gain: '100k',
					supply: '±15V',
					gainBandwidth: '1M',
					slew_rate: '0.5'
				};
			case 'ground':
				return {
					type: 'Earth',
					impedance: '0',
					plane_area: 'Large',
					via_count: 4
				};
			case 'voltmeter':
				return {
					range: '10V',
					impedance: '10M',
					accuracy: '1%'
				};
			case 'ammeter':
				return {
					range: '1A',
					resistance: '0.1'
				};
			case 'probe':
				return {
					impedance: '1M',
					capacitance: '10p',
					attenuation: '1x'
				};
			default:
				return {};
		}
	}

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
		probe: ProbeNode,
		cursor: CursorNode
	};

	const edgeTypes: EdgeTypes = {
		wire: WireEdge
	};

	// Simple local state - no complex syncing!
	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);
	let isDragging = $state(false);
	let hasUnsavedChanges = $state(false);
	let isAutoSaving = $state(false);
	let isLoadingProject = $state(false);

	// Track the initial state to detect actual changes
	let initialNodes: Node[] = [];
	let initialEdges: Edge[] = [];

	// Track changes for auto-save
	$effect(() => {
		// Don't mark as unsaved if we're currently loading a project
		if (isLoadingProject) return;
		
		// Don't mark as unsaved for empty circuits
		if (nodes.length === 0 && edges.length === 0) {
			hasUnsavedChanges = false;
			return;
		}
		
		// Check if current state differs from initial state
		const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(initialNodes);
		const edgesChanged = JSON.stringify(edges) !== JSON.stringify(initialEdges);
		
		if (nodesChanged || edgesChanged) {
			hasUnsavedChanges = true;
		}
		
		console.log('[EDITOR] Circuit state:', {
			nodes: nodes.length,
			edges: edges.length,
			hasUnsavedChanges,
			nodesChanged,
			edgesChanged
		});
	});

	// Auto-save in collaborative mode (debounced)
	let autoSaveTimeout: ReturnType<typeof setTimeout>;
	$effect(() => {
		if (isCollaborative && currentProjectId && hasUnsavedChanges && !isDragging) {
			clearTimeout(autoSaveTimeout);
			autoSaveTimeout = setTimeout(async () => {
				await performAutoSave();
			}, 10000); // Auto-save after 10 seconds of inactivity
		}
	});

	async function performAutoSave() {
		if (!currentProjectId || !hasUnsavedChanges || isAutoSaving) return;
		
		isAutoSaving = true;
		try {
			// Add a small delay to allow the progress animation to start
			await new Promise(resolve => setTimeout(resolve, 50));
			
			const success = await circuitAPI.autoSave(currentProjectId, nodes, edges);
			if (success) {
				// Ensure minimum animation time for better UX
				await new Promise(resolve => setTimeout(resolve, 500));
				
				hasUnsavedChanges = false;
				// Update initial state to current state since it's now saved
				initialNodes = JSON.parse(JSON.stringify(nodes));
				initialEdges = JSON.parse(JSON.stringify(edges));
				console.log('[EDITOR] Auto-saved successfully');
			}
		} catch (error) {
			console.error('[EDITOR] Auto-save failed:', error);
		} finally {
			isAutoSaving = false;
		}
	}

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
	let dragUpdateTimeout: ReturnType<typeof setTimeout>;

	// Collaboration state
	let isCollaborative = $state(false);
	let isSaving = $state(false);
	let isReadOnlyMode = $state(false);
	let collaboratorCount = $state(0);
	let collaborationCleanupFn: (() => void) | null = null;

	// Removed flowKey - no longer needed with improved reactivity
	// Function to add component from sidebar
	function addComponent(type: string, position: { x: number; y: number }) {
		const componentId = generateComponentId(type, session?.user?.id || 'anonymous');
		const newNode = {
			id: componentId,
			type,
			position: {
				x: Math.round(position.x / 10) * 10,
				y: Math.round(position.y / 10) * 10
			},
			data: {
				label: type,
				parameters: getDefaultParameters(type)
			}
		};
		
		nodes = [...nodes, newNode];
		console.log('[EDITOR] Component added from sidebar:', { type, id: componentId, position });

		// Broadcast to collaborators if in collaborative mode
		if (isCollaborative && !isReadOnlyMode) {
			broadcastComponentAdded(type, position, componentId);
		}
	}

	// Function to clear circuit
	function clearCircuit() {
		if (hasUnsavedChanges) {
			const confirmed = confirm('You have unsaved changes. Are you sure you want to clear the circuit?');
			if (!confirmed) return;
		}
		
		nodes = [];
		edges = [];
		
		// Reset initial state
		initialNodes = [];
		initialEdges = [];
		
		selectedNode = null;
		selectedWire = null;
		hasUnsavedChanges = false;
		console.log('[EDITOR] Circuit cleared');
	}

	// Component operations for PropertiesSidebar
	function updateComponent(id: string, parameters: any) {
		const nodeIndex = nodes.findIndex(node => node.id === id);
		if (nodeIndex !== -1) {
			nodes[nodeIndex] = {
				...nodes[nodeIndex],
				data: {
					...nodes[nodeIndex].data,
					parameters
				}
			};
			console.log('[EDITOR] Component updated:', { id, parameters });
		}
	}

	function removeComponent(id: string) {
		// Remove node and connected edges
		nodes = nodes.filter(node => node.id !== id);
		edges = edges.filter(edge => edge.source !== id && edge.target !== id);
		
		// Broadcast component removal to collaborators
		if (isCollaborative && !isReadOnlyMode) {
			broadcastComponentRemoved(id);
		}
		
		console.log('[EDITOR] Component removed:', { id });
	}

	// Export functions for PropertiesSidebar
	function exportNetlist(): string {
		// Simplified netlist export - can be moved to a separate utility file
		const netlist: string[] = [];
		netlist.push('* Circuit Netlist Generated by Saffron Circuit Simulator');
		
		// Add components
		nodes.forEach((node, index) => {
			const { id, type, data } = node;
			const params = (data?.parameters as any) || {};
			const compId = `${type?.charAt(0).toUpperCase()}${index + 1}`;
			
			switch (type) {
				case 'resistor':
					netlist.push(`${compId} n1 n2 ${params.resistance || '1k'}`);
					break;
				case 'capacitor':
					netlist.push(`${compId} n1 n2 ${params.capacitance || '1u'}`);
					break;
				case 'voltageSource':
					netlist.push(`${compId} n1 0 ${params.voltage || '5V'}`);
					break;
				// Add more component types as needed
			}
		});
		
		netlist.push('.end');
		return netlist.join('\n');
	}

	function exportJSON(): string {
		return JSON.stringify({
			version: '1.0',
			nodes,
			edges,
			created_at: new Date().toISOString()
		}, null, 2);
	}

	// Load from JSON function for debug menu
	function loadFromJson(data: any) {
		if (data.nodes && data.edges) {
			nodes = data.nodes || [];
			edges = data.edges || [];
			console.log('[EDITOR] Circuit loaded from JSON:', { nodes: nodes.length, edges: edges.length });
		}
	}

	// Wire operations for WirePropertiesPanel
	function updateWireStyle(edgeId: string, wireShape: string, wireStyle?: string, color?: string) {
		console.log('[EDITOR] updateWireStyle called:', { edgeId, wireShape, wireStyle, color });
		
		const edgeIndex = edges.findIndex(edge => edge.id === edgeId);
		if (edgeIndex !== -1) {
			const oldEdge = edges[edgeIndex];
			console.log('[EDITOR] Found edge to update:', { oldData: oldEdge.data });
			
			// Create the updated edge with proper data merging
			const updatedEdge = {
				...oldEdge,
				data: {
					...oldEdge.data,
					wireShape,
					...(wireStyle !== undefined && { wireStyle }),
					...(color !== undefined && { color })
				}
			};
			
			console.log('[EDITOR] Updated edge data:', { newData: updatedEdge.data });
			
			// Force reactivity by creating new edges array
			edges = edges.map((edge, index) => 
				index === edgeIndex ? updatedEdge : edge
			);
			
			// Update selectedWire if it's the same edge
			if (selectedWire?.id === edgeId) {
				selectedWire = updatedEdge;
			}
			
			console.log('[EDITOR] Wire style updated successfully');
		} else {
			console.warn('[EDITOR] Edge not found:', edgeId);
		}
	}

	function removeConnection(edgeId: string) {
		edges = edges.filter(edge => edge.id !== edgeId);
		
		// Broadcast connection removal to collaborators
		if (isCollaborative && !isReadOnlyMode) {
			broadcastConnectionRemoved(edgeId);
		}
		
		console.log('[EDITOR] Connection removed:', { edgeId });
	}

	// Removed forceRefreshWires function - no longer needed with improved reactivity

	// Keep selected elements in sync with store changes
	$effect(() => {
		// Check if selected wire was deleted
		if (selectedWire?.id && !edges.find((edge) => edge.id === selectedWire!.id)) {
			selectedWire = null;
		}

		// Check if selected node was deleted
		if (selectedNode?.id && !nodes.find((node) => node.id === selectedNode!.id)) {
			selectedNode = null;
		}
	});



	// Listen for wire selection events
	$effect(() => {
		// Removed wireSelected event listener - using SvelteFlow's onedgeclick instead
		
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
					// Remove edge from local state
					edges = edges.filter(edge => edge.id !== selectedWire!.id);
					selectedWire = null;
				} else if (selectedNode) {
					const nodeId = selectedNode.id;
					// Remove node and connected edges from local state
					nodes = nodes.filter(node => node.id !== nodeId);
					edges = edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);

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

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	});

	// Initialize collaboration when project ID is available
	$effect(() => {
		if (currentProjectId) {
			isCollaborative = true;

			// Initialize real-time collaboration asynchronously
			(async () => {
				// Since we're using direct YJS collaboration, everyone has edit rights
				isReadOnlyMode = false;

				// Initialize real-time collaboration with callbacks
				if (collaborationCleanupFn) {
					collaborationCleanupFn();
				}

				// Define collaboration callbacks for handling updates from other users
				const collaborationCallbacks = {
					onNodeUpdate: (nodeId: string, nodeData: any) => {
						// Update node position from collaborator
						const nodeIndex = nodes.findIndex(n => n.id === nodeId);
						if (nodeIndex !== -1) {
							nodes[nodeIndex] = { ...nodes[nodeIndex], position: nodeData.position };
							nodes = [...nodes]; // Trigger reactivity
						}
					},
					onNodeAdd: (nodeId: string, nodeData: any) => {
						// Add node from collaborator
						const newNode = {
							id: nodeId,
							type: nodeData.type,
							position: nodeData.position,
							data: nodeData.data
						};
						nodes = [...nodes, newNode];
					},
					onNodeRemove: (nodeId: string) => {
						// Remove node from collaborator
						nodes = nodes.filter(n => n.id !== nodeId);
					},
					onEdgeAdd: (edgeId: string, edgeData: any) => {
						// Add edge from collaborator
						const newEdge = {
							id: edgeId,
							source: edgeData.source,
							target: edgeData.target,
							sourceHandle: edgeData.sourceHandle,
							targetHandle: edgeData.targetHandle,
							type: 'wire',
							data: edgeData.data
						};
						edges = [...edges, newEdge];
					},
					onEdgeRemove: (edgeId: string) => {
						// Remove edge from collaborator
						edges = edges.filter(e => e.id !== edgeId);
					},
					// No onStateLoad - we don't want YJS to override database state
					onCursorUpdate: (cursorId: string, cursorData: any) => {
						// Update or add cursor node
						const cursorNode = {
							id: `cursor-${cursorId}`,
							type: 'cursor',
							position: cursorData.position,
							data: {
								userId: cursorId,
								name: cursorData.name,
								color: cursorData.color,
								action: cursorData.action,
								nodeId: cursorData.nodeId,
								lastUpdated: cursorData.timestamp
							}
						};

						const existingIndex = nodes.findIndex(n => n.id === `cursor-${cursorId}`);
						if (existingIndex !== -1) {
							nodes[existingIndex] = cursorNode;
							nodes = [...nodes]; // Trigger reactivity
						} else {
							nodes = [...nodes, cursorNode];
						}
					},
					onCursorRemove: (cursorId: string) => {
						// Remove cursor node
						nodes = nodes.filter(n => n.id !== `cursor-${cursorId}`);
					}
				};

				const cleanupFn = await initCollaboration(
					currentProjectId, 
					session?.user?.id, 
					session?.user?.email,
					collaborationCallbacks
				);
				collaborationCleanupFn = cleanupFn || null;

				// YJS will only handle real-time changes from this point forward
				// No need to sync database state to YJS
			})();
		} else {
			// Disable collaboration when no project is loaded
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
		const projectId = urlParams.get('id');

		if (projectId) {
			// Load the project
			currentProjectId = projectId;
			loadProject(projectId);
		}

		// Set up auto-save interval for collaborative editing
		autoSaveInterval = setInterval(() => {
			if (isCollaborative && !isReadOnlyMode && hasUnsavedChanges) {
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


	});

	function onNodeClick(event: any) {
		selectedNode = event.node;
	}

	function onPaneClick() {
		selectedNode = null;
		selectedWire = null;
	}

	function onConnect(params: any) {
		// Generate unique edge ID to prevent conflicts when connecting same nodes multiple times
		const timestamp = Date.now();
		const newEdge = {
			id: `edge-${params.source}-${params.target}-${timestamp}`,
			source: params.source,
			target: params.target,
			sourceHandle: params.sourceHandle,
			targetHandle: params.targetHandle,
			type: 'wire',
			data: { 
				color: '#64748b', 
				wireShape: 'smoothstep', 
				wireStyle: 'solid' 
			}
		};

		console.log('[EDITOR] Creating new wire connection:', newEdge);

		// Add edge to local state
		edges = [...edges, newEdge];

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

			// Update local node position immediately for smooth UI
			const nodeIndex = nodes.findIndex(n => n.id === node.id);
			if (nodeIndex !== -1) {
				nodes[nodeIndex] = { ...nodes[nodeIndex], position };
			}

			// Broadcast to collaborators if in collaborative mode (throttled)
			clearTimeout(dragUpdateTimeout);
			dragUpdateTimeout = setTimeout(() => {
				try {
					if (isCollaborative && !isReadOnlyMode) {
						broadcastNodeMovement(node.id, position);
					}
				} catch (error) {
					console.warn('Error broadcasting position during drag:', error);
				}
			}, 100);
		} catch (error) {
			console.error('Error in onNodeDrag:', error);
		}
	}

	function onNodeDragStart(params: any) {
		try {
			isDragging = true;
			
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

				console.log('[EDITOR] Drag stopped, final position:', {
					nodeId: node.id,
					position
				});

				// Update local node position
				const nodeIndex = nodes.findIndex(n => n.id === node.id);
				if (nodeIndex !== -1) {
					nodes[nodeIndex] = { ...nodes[nodeIndex], position };
				}

				// Broadcast final position to collaborators
				if (isCollaborative && !isReadOnlyMode) {
					broadcastNodeMovement(node.id, position);
				}
			}

			// Reset drag state - this will allow store sync to resume
			isDragging = false;

			// Reset cursor action
			if (isCollaborative) {
				updateCursorAction('idle');
			}
		} catch (error) {
			console.error('Error in onNodeDragStop:', error);
		}
	}

	// Cursor tracking using SvelteFlow coordinates
	function onPaneMouseMove(event: any) {
		if (!isCollaborative || !svelteFlowInstance) return;

		// Get the position in SvelteFlow coordinates (handles zoom and pan)
		const position = svelteFlowInstance.screenToFlowPosition({
			x: event.clientX,
			y: event.clientY
		});

		// Update cursor position
		updateCursorPosition(position);
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

			console.log('[EDITOR] Drop event details:', {
				clientX: event.clientX,
				clientY: event.clientY,
				hasSvelteFlowInstance: !!svelteFlowInstance
			});

			if (svelteFlowInstance) {
				try {
					const canvasPosition = svelteFlowInstance.screenToFlowPosition({
						x: event.clientX,
						y: event.clientY
					});

					console.log('[EDITOR] Calculated canvas position:', canvasPosition);

					// Validate the calculated position
					if (isFinite(canvasPosition.x) && isFinite(canvasPosition.y)) {
						position = {
							x: Math.max(-5000, Math.min(5000, canvasPosition.x)),
							y: Math.max(-5000, Math.min(5000, canvasPosition.y))
						};
						console.log('[EDITOR] Final drop position:', position);
					}
				} catch (positionError) {
					console.warn('Error calculating drop position, using fallback:', positionError);
					// Use mouse position relative to viewport as fallback
					position = {
						x: Math.max(0, event.clientX - 200),
						y: Math.max(0, event.clientY - 100)
					};
					console.log('[EDITOR] Fallback position:', position);
				}
			}

			// Generate bulletproof component ID
			const userId = session?.user?.id || 'anonymous';
			const componentId = generateComponentId(componentType, userId);

			// Add component with enhanced error handling
			try {
				// Add component directly to local state
				const newNode = {
					id: componentId,
					type: componentType,
					position: {
						x: Math.round(position.x / 10) * 10,
						y: Math.round(position.y / 10) * 10
					},
					data: {
						label: componentType,
						parameters: getDefaultParameters(componentType)
					}
				};
				
				nodes = [...nodes, newNode];
				console.log('[EDITOR] Component added:', { type: componentType, id: componentId, position });

				// Broadcast to collaborators with retry logic
				if (isCollaborative && !isReadOnlyMode) {
					setTimeout(() => {
						// Small delay to ensure local state is updated first
						broadcastComponentAdded(componentType, position, componentId);
					}, 10);
				}
			} catch (addError) {
				console.error('Error adding component:', addError);
				// Try with fallback position
				const fallbackPosition = { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 };
				const fallbackNode = {
					id: componentId,
					type: componentType,
					position: fallbackPosition,
					data: {
						label: componentType,
						parameters: getDefaultParameters(componentType)
					}
				};
				nodes = [...nodes, fallbackNode];
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
		clearCircuit();
		currentProjectId = null;
		currentProjectName = 'Untitled Circuit';

		// Remove project ID from URL
		goto('/editor', { replaceState: true });
	}

	function handleLoad() {
		// Show load dialog to select a circuit
		showLoadDialog = true;
	}

	// Function to manually save changes for collaborative editing
	async function saveChanges() {
		if (!isCollaborative || isReadOnlyMode || !currentProjectId) return;

		isSaving = true;
		try {
			const success = await circuitAPI.autoSave(currentProjectId, nodes, edges);
			if (success) {
				hasUnsavedChanges = false;
			}
		} catch (error) {
			console.error('Error saving changes:', error);
		} finally {
			isSaving = false;
		}
	}

	async function loadProject(projectId: string) {
		try {
			isLoadingProject = true;
			
			const result = await circuitAPI.loadCircuit(projectId);
			if (result.success) {
				// Load circuit data into local state
				nodes = result.nodes || [];
				edges = result.edges || [];
				
				// Set initial state for change tracking
				initialNodes = JSON.parse(JSON.stringify(nodes));
				initialEdges = JSON.parse(JSON.stringify(edges));
				
				currentProjectId = projectId;
				currentProjectName = result.name || 'Untitled Circuit';
				hasUnsavedChanges = false;

				// Enable collaboration for this project
				isCollaborative = true;

				// Since we're using direct YJS collaboration, everyone has edit rights
				isReadOnlyMode = false;

				// Update URL with project ID
				const url = new URL(window.location.toString());
				url.searchParams.set('id', projectId);
				history.replaceState({}, '', url.toString());

				// YJS will handle real-time changes, no need to sync database state
			} else {
				alert(`Failed to load project: ${result.error}`);
			}
		} catch (error) {
			console.error('Error loading project:', error);
			alert('Failed to load the project. Please try again.');
		} finally {
			isLoadingProject = false;
		}
	}

	async function onProjectSaved(event: CustomEvent) {
		const { projectId, name } = event.detail;
		currentProjectId = projectId;
		currentProjectName = name;
		hasUnsavedChanges = false;
		
		// Update initial state to current state since it's now saved
		initialNodes = JSON.parse(JSON.stringify(nodes));
		initialEdges = JSON.parse(JSON.stringify(edges));
		
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

			// Collaboration will be initialized automatically when currentProjectId is set
			console.log('Successfully joined collaborative session:', projectId);
		} catch (error) {
			console.error('Failed to join collaboration:', error);
			alert('Failed to join the collaborative session. Please check the join code.');
		}
	}


</script>

<svelte:head>
	<title>Circuit Simulator - Saffron</title>
</svelte:head>
<DebugNodeMenu 
	bind:isVisible={showDebugMenu} 
	{nodes} 
	{edges} 
	onExportJSON={exportJSON}
	onLoadFromJson={loadFromJson}
	on:close={() => (showDebugMenu = false)} 
/>
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
		<ComponentsSidebar 
			{nodes} 
			{edges} 
			onAddComponent={addComponent}
			onClearCircuit={clearCircuit}
		/>

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
				onmousemove={onPaneMouseMove}
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
							</span>
							<span class="ml-2">
								<SaveIndicator 
									{hasUnsavedChanges}
									{isAutoSaving}
									compact={true}
									alwaysVisible={true}
								/>
							</span>
						</div>
					{:else if nodes.length > 0 || edges.length > 0}
						<!-- Non-collaborative save indicator -->
						<div class="flex items-center justify-center">
							<SaveIndicator 
								{hasUnsavedChanges}
								{isAutoSaving}
								compact={false}
								alwaysVisible={true}
							/>
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

				<!-- Collaborative cursors are now handled as SvelteFlow nodes -->
			</SvelteFlow>


		</div>

		<!-- Right Sidebar - Properties & Analysis -->
		<PropertiesSidebar 
			bind:selectedNode 
			bind:nodes 
			{edges}
			onUpdateComponent={updateComponent}
			onRemoveComponent={removeComponent}
			onAddComponent={addComponent}
			onExportNetlist={exportNetlist}
			onExportJSON={exportJSON}
		/>
	</div>

	<!-- Wire Properties Panel (Modal) -->
	<WirePropertiesPanel 
		bind:selectedWire 
		bind:edges 
		onUpdateWireStyle={updateWireStyle}
		onRemoveConnection={removeConnection}
	/>

	<!-- Save Project Dialog -->
	{#if showSaveDialog}
		<SaveProjectDialog
			bind:show={showSaveDialog}
			{currentProjectId}
			currentName={currentProjectName}
			{nodes}
			{edges}
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

	:global(.svelte-flow .svelte-flow__edge-path) {
		stroke: hsl(var(--muted-foreground));
	}

	:global(.svelte-flow .svelte-flow__edge.selected .svelte-flow__edge-path) {
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
