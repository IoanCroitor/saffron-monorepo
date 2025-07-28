import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { getRandomColor, getUserColor } from '$lib/utils/color-utils';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { YJS_CONFIG } from './collaboration-config';

/**
 * Safely serialize data for Yjs, avoiding Svelte proxy issues
 */
function safeSerialize(data: any): any {
	if (data === null || data === undefined) return data;
	if (typeof data !== 'object') return data;
	if (Array.isArray(data)) return data.map(safeSerialize);

	// For objects, create a plain object with serialized properties
	const serialized: any = {};
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			serialized[key] = safeSerialize(data[key]);
		}
	}
	return serialized;
}

export interface UserCursor {
	userId: string;
	name: string;
	color: string;
	position: { x: number; y: number };
	lastUpdated: Date;
	action?: 'idle' | 'dragging' | 'selecting' | 'drawing';
	nodeId?: string;
	selectedNodeIds?: string[];
}

// Callback types for collaboration updates
export interface CollaborationCallbacks {
	onNodeUpdate?: (nodeId: string, nodeData: any) => void;
	onNodeAdd?: (nodeId: string, nodeData: any) => void;
	onNodeRemove?: (nodeId: string) => void;
	onEdgeUpdate?: (edgeId: string, edgeData: any) => void;
	onEdgeAdd?: (edgeId: string, edgeData: any) => void;
	onEdgeRemove?: (edgeId: string) => void;
	// Removed cursor callbacks - too complex
}

// Stores for collaboration state
export const activeCollaborators = writable<Record<string, UserCursor>>({});
export const connectionState = writable<'connected' | 'connecting' | 'disconnected' | 'error'>(
	'disconnected'
);

// User's own information for collaboration
export const userCollabInfo = writable({
	name: 'Anonymous User',
	color: getRandomColor()
});

// Yjs document and provider
let ydoc: Y.Doc | null = null;
let provider: WebsocketProvider | null = null;
let nodesMap: Y.Map<any> | null = null;
let edgesMap: Y.Map<any> | null = null;
// Removed cursorsMap - too complex
let currentProjectId: string | null = null;
let currentUserId: string | null = null;
let collaborationCallbacks: CollaborationCallbacks = {};

// Track local deletions to avoid processing them twice
let localDeletions = new Set<string>();
let localEdgeDeletions = new Set<string>();

// Throttling for cursor updates
let cursorUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
const CURSOR_DEBOUNCE_TIME = YJS_CONFIG.cursorDebounceTime;

/**
 * Initialize Yjs collaboration for a project
 * @param projectId The project ID to collaborate on
 * @param userId The current user ID
 * @param userName The current user name
 * @param callbacks Callback functions for handling collaboration updates
 */
export async function initCollaboration(
	projectId: string, 
	userId?: string, 
	userName?: string,
	callbacks: CollaborationCallbacks = {}
) {
	if (!browser) return;

	try {
		connectionState.set('connecting');

		// Clean up existing connections
		await cleanupCollaboration();

		currentProjectId = projectId;
		currentUserId = userId || generateUserId();
		collaborationCallbacks = callbacks;

		// Update user info
		userCollabInfo.update((info) => ({
			...info,
			name: userName || info.name
		}));

		// Create Yjs document
		ydoc = new Y.Doc();

		// Get shared maps for nodes, edges, and cursors
		nodesMap = ydoc.getMap('nodes');
		edgesMap = ydoc.getMap('edges');
		// Removed cursorsMap initialization

		// Create WebSocket provider to connect to your Yjs server
		provider = new WebsocketProvider(
			YJS_CONFIG.wsUrl,
			`${YJS_CONFIG.roomPrefix}-${projectId}`,
			ydoc
		);

		// Set up event listeners
		setupEventListeners();

		// Removed cursor tracking

		// Wait for connection to be established
		return new Promise<(() => void) | null>((resolve) => {
			if (provider) {
				provider.on('status', (event: any) => {
					console.log('[COLLABORATION] 🔌 YJS connection status:', event.status);
					connectionState.set(event.status === 'connected' ? 'connected' : 'disconnected');
					
					if (event.status === 'connected') {
						console.log('[COLLABORATION] ✅ Yjs collaboration connected for project:', projectId);
						
						// Test the connection by checking if maps are accessible
						if (nodesMap && edgesMap) {
							console.log('[COLLABORATION] ✅ YJS maps are accessible:', {
								nodesMapSize: nodesMap.size,
								edgesMapSize: edgesMap.size
							});
						}
						
						// Don't load state from YJS on connection - let Supabase handle initial state
						// YJS will only handle real-time changes from this point forward
						
						resolve(() => cleanupCollaboration());
					}
				});
				
				// Add error handling
				provider.on('connection-error', (error: any) => {
					console.error('[COLLABORATION] ❌ YJS provider error:', error);
				});
			} else {
				// Fallback if provider is not available
				connectionState.set('connected');
				console.log('[COLLABORATION] ⚠️ Yjs collaboration initialized without provider for project:', projectId);
				resolve(() => cleanupCollaboration());
			}
		});
	} catch (error) {
		console.error('Failed to initialize Yjs collaboration:', error);
		connectionState.set('error');
	}
}

/**
 * Set up event listeners for Yjs changes
 */
function setupEventListeners() {
	if (!nodesMap || !edgesMap) return;

	// Listen for node changes from other users only
	nodesMap.observe((event) => {
		console.log('[COLLABORATION] 🔍 Node observe event:', {
			changesCount: event.changes.keys.size,
			currentUserId,
			event: event.changes.keys,
			hasChanges: event.changes.keys.size > 0
		});
		
		event.changes.keys.forEach((change, key) => {
			const nodeData = nodesMap!.get(key);
			console.log('[COLLABORATION] 🔍 Processing node change:', {
				key,
				action: change.action,
				nodeData,
				nodeDataUserId: nodeData?.userId,
				currentUserId,
				isFromOtherUser: nodeData && nodeData.userId !== currentUserId
			});
			
			// Handle deletions first (they don't have data)
			if (change.action === 'delete') {
				console.log('[COLLABORATION] 🔍 Node deletion detected:', { key, change });
				
				// Check if this is a local deletion that we initiated
				if (localDeletions.has(key)) {
					console.log('[COLLABORATION] ⏭️ Skipping deletion - this is a local deletion we initiated:', { key });
					return;
				}
				
				if (collaborationCallbacks.onNodeRemove) {
					console.log('[COLLABORATION] ✅ Calling onNodeRemove callback');
					try {
						collaborationCallbacks.onNodeRemove(key);
						console.log('[COLLABORATION] ✅ onNodeRemove callback completed successfully');
					} catch (error) {
						console.error('[COLLABORATION] ❌ Error in onNodeRemove callback:', error);
					}
				} else {
					console.log('[COLLABORATION] ⚠️ No onNodeRemove callback registered');
				}
				console.log('[COLLABORATION] Component removed by collaborator:', key);
				return;
			}
			
			// Only process add/update changes from other users
			if (nodeData && nodeData.userId !== currentUserId) {
				if (change.action === 'add' || change.action === 'update') {
					// Update from another user
					if (change.action === 'add' && collaborationCallbacks.onNodeAdd) {
						console.log('[COLLABORATION] ✅ Calling onNodeAdd callback');
						collaborationCallbacks.onNodeAdd(key, nodeData);
					} else if (change.action === 'update' && collaborationCallbacks.onNodeUpdate) {
						console.log('[COLLABORATION] ✅ Calling onNodeUpdate callback');
						collaborationCallbacks.onNodeUpdate(key, nodeData);
					}
					console.log('[COLLABORATION] Node update from collaborator:', key, nodeData);
				}
			} else {
				console.log('[COLLABORATION] ⏭️ Skipping change from self or invalid data');
			}
		});
	});

	// Listen for edge changes from other users only
	edgesMap.observe((event) => {
		console.log('[COLLABORATION] 🔍 Edge observe event:', {
			changesCount: event.changes.keys.size,
			currentUserId,
			event: event.changes.keys,
			hasChanges: event.changes.keys.size > 0
		});
		
		event.changes.keys.forEach((change, key) => {
			const edgeData = edgesMap!.get(key);
			console.log('[COLLABORATION] 🔍 Processing edge change:', {
				key,
				action: change.action,
				edgeData,
				edgeDataUserId: edgeData?.userId,
				currentUserId,
				isFromOtherUser: edgeData && edgeData.userId !== currentUserId
			});
			
			// Handle deletions first (they don't have data)
			if (change.action === 'delete') {
				console.log('[COLLABORATION] 🔍 Edge deletion detected:', { key, change });
				
				// Check if this is a local deletion that we initiated
				if (localEdgeDeletions.has(key)) {
					console.log('[COLLABORATION] ⏭️ Skipping edge deletion - this is a local deletion we initiated:', { key });
					return;
				}
				
				if (collaborationCallbacks.onEdgeRemove) {
					console.log('[COLLABORATION] ✅ Calling onEdgeRemove callback');
					try {
						collaborationCallbacks.onEdgeRemove(key);
						console.log('[COLLABORATION] ✅ onEdgeRemove callback completed successfully');
					} catch (error) {
						console.error('[COLLABORATION] ❌ Error in onEdgeRemove callback:', error);
					}
				} else {
					console.log('[COLLABORATION] ⚠️ No onEdgeRemove callback registered');
				}
				console.log('[COLLABORATION] Edge removed by collaborator:', key);
				return;
			}
			
			// Only process add/update changes from other users
			if (edgeData && edgeData.userId !== currentUserId) {
				if (change.action === 'add' || change.action === 'update') {
					// Update from another user
					if (change.action === 'add' && collaborationCallbacks.onEdgeAdd) {
						collaborationCallbacks.onEdgeAdd(key, edgeData);
					} else if (change.action === 'update' && collaborationCallbacks.onEdgeUpdate) {
						// For property updates, pass only the data property
						const propertyData = edgeData.data || {};
						console.log('[COLLABORATION] 🔍 Edge property update detected:', { key, propertyData });
						collaborationCallbacks.onEdgeUpdate(key, propertyData);
					}
					console.log('[COLLABORATION] Edge update from collaborator:', key, edgeData);
				}
			}
		});
	});

	// Removed cursor tracking - too complex

	// Provider connection changes are now handled in the initCollaboration promise
}

/**
 * Broadcast node position update
 * @param nodeId The node ID being moved
 * @param position The new position
 */
export function broadcastNodeMovement(nodeId: string, position: { x: number; y: number }) {
	console.log('[COLLABORATION] 🚀 broadcastNodeMovement called:', { nodeId, position, nodesMap: !!nodesMap, currentUserId });
	
	if (!nodesMap || !currentUserId) {
		console.log('[COLLABORATION] ❌ Cannot broadcast - missing nodesMap or currentUserId');
		return;
	}

	// Get existing node data to preserve properties
	const existingData = nodesMap.get(nodeId);
	console.log('[COLLABORATION] 📦 Existing node data:', existingData);
	
	// Use safe serialization to avoid Svelte proxy issues
	const nodeData = safeSerialize({
		id: nodeId,
		position,
		userId: currentUserId,
		timestamp: Date.now(),
		// Preserve existing data/properties if available
		...(existingData && { data: existingData.data })
	});

	console.log('[COLLABORATION] 📤 Setting node data in YJS:', nodeData);
	nodesMap.set(nodeId, nodeData);
	console.log('[COLLABORATION] ✅ Broadcasting node movement:', { nodeId, position });
}

/**
 * Broadcast component addition
 * @param type Component type
 * @param position Component position
 * @param id Component ID
 */
export function broadcastComponentAdded(
	type: string,
	position: { x: number; y: number },
	id: string,
	data?: any
) {
	if (!nodesMap || !currentUserId) return;

	// Use safe serialization to avoid Svelte proxy issues
	const nodeData = safeSerialize({
		id,
		type,
		position,
		data,
		userId: currentUserId,
		timestamp: Date.now()
	});

	nodesMap.set(id, nodeData);
	console.log('[COLLABORATION] Broadcasting component added:', { id, type, position, data });
}

/**
 * Broadcast component removal
 * @param id Component ID
 */
export function broadcastComponentRemoved(id: string) {
	console.log('[COLLABORATION] 🚀 broadcastComponentRemoved called:', { id, nodesMap: !!nodesMap, currentUserId });
	
	if (!nodesMap || !currentUserId) {
		console.log('[COLLABORATION] ❌ Cannot broadcast removal - missing nodesMap or currentUserId');
		return;
	}

	try {
		// Track this as a local deletion
		localDeletions.add(id);
		console.log('[COLLABORATION] 📝 Tracking local deletion:', { id, localDeletions: Array.from(localDeletions) });
		
		// Check if the node exists before deleting
		const nodeExists = nodesMap.has(id);
		console.log('[COLLABORATION] 🔍 Node exists in YJS before deletion:', { id, exists: nodeExists });
		
		// Delete the node from YJS
		nodesMap.delete(id);
		
		// Verify deletion
		const nodeStillExists = nodesMap.has(id);
		console.log('[COLLABORATION] 🔍 Node exists in YJS after deletion:', { id, exists: nodeStillExists });
		
		console.log('[COLLABORATION] ✅ Broadcasting component removal:', { id, wasDeleted: !nodeStillExists });
		
		// Clean up the tracking after a short delay
		setTimeout(() => {
			localDeletions.delete(id);
			console.log('[COLLABORATION] 🧹 Cleaned up local deletion tracking:', { id, localDeletions: Array.from(localDeletions) });
		}, 1000);
	} catch (error) {
		console.error('[COLLABORATION] ❌ Error broadcasting component removal:', error);
	}
}

/**
 * Broadcast node property updates
 * @param nodeId The node ID
 * @param data The updated node data/properties
 */
export function broadcastNodeProperties(nodeId: string, data: any) {
	console.log('[COLLABORATION] 🚀 broadcastNodeProperties called:', { nodeId, data, nodesMap: !!nodesMap, currentUserId });
	
	if (!nodesMap || !currentUserId) {
		console.log('[COLLABORATION] ❌ Cannot broadcast properties - missing nodesMap or currentUserId');
		return;
	}

	// Get existing node data
	const existingData = nodesMap.get(nodeId);
	console.log('[COLLABORATION] 📦 Existing node data for properties:', existingData);
	
	// Use safe serialization to avoid Svelte proxy issues
	const nodeData = safeSerialize({
		id: nodeId,
		data,
		userId: currentUserId,
		timestamp: Date.now(),
		// Preserve existing position if available
		...(existingData && { position: existingData.position })
	});

	console.log('[COLLABORATION] 📤 Setting node properties in YJS:', nodeData);
	nodesMap.set(nodeId, nodeData);
	console.log('[COLLABORATION] ✅ Broadcasting node properties:', { nodeId, data });
}

/**
 * Broadcast connection addition
 * @param edge The edge/connection being added
 */
export function broadcastConnectionAdded(edge: any) {
	if (!edgesMap || !currentUserId) return;

	// Use safe serialization to avoid Svelte proxy issues
	const edgeData = safeSerialize({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		sourceHandle: edge.sourceHandle,
		targetHandle: edge.targetHandle,
		type: edge.type,
		data: edge.data,
		userId: currentUserId,
		timestamp: Date.now()
	});

	edgesMap.set(edge.id, edgeData);
}

/**
 * Broadcast edge property updates
 * @param edgeId The edge ID
 * @param data The updated edge data/properties
 */
export function broadcastEdgeProperties(edgeId: string, data: any) {
	console.log('[COLLABORATION] 🚀 broadcastEdgeProperties called:', { edgeId, data, edgesMap: !!edgesMap, currentUserId });
	
	if (!edgesMap || !currentUserId) {
		console.log('[COLLABORATION] ❌ Cannot broadcast edge properties - missing edgesMap or currentUserId');
		return;
	}

	// Get existing edge data
	const existingData = edgesMap.get(edgeId);
	console.log('[COLLABORATION] 📦 Existing edge data for properties:', existingData);
	
	// Use safe serialization to avoid Svelte proxy issues
	const edgeData = safeSerialize({
		id: edgeId,
		data,
		userId: currentUserId,
		timestamp: Date.now(),
		// Preserve existing edge properties if available
		...(existingData && { 
			source: existingData.source,
			target: existingData.target,
			sourceHandle: existingData.sourceHandle,
			targetHandle: existingData.targetHandle,
			type: existingData.type
		})
	});

	console.log('[COLLABORATION] 📤 Setting edge properties in YJS:', edgeData);
	edgesMap.set(edgeId, edgeData);
	console.log('[COLLABORATION] ✅ Broadcasting edge properties:', { edgeId, data });
}

/**
 * Broadcast connection removal
 * @param edgeId The edge ID being removed
 */
export function broadcastConnectionRemoved(edgeId: string) {
	console.log('[COLLABORATION] 🚀 broadcastConnectionRemoved called:', { edgeId, edgesMap: !!edgesMap, currentUserId });
	
	if (!edgesMap || !currentUserId) {
		console.log('[COLLABORATION] ❌ Cannot broadcast connection removal - missing edgesMap or currentUserId');
		return;
	}

	try {
		// Track this as a local deletion
		localEdgeDeletions.add(edgeId);
		console.log('[COLLABORATION] 📝 Tracking local edge deletion:', { edgeId, localEdgeDeletions: Array.from(localEdgeDeletions) });
		
		// Check if the edge exists before deleting
		const edgeExists = edgesMap.has(edgeId);
		console.log('[COLLABORATION] 🔍 Edge exists in YJS before deletion:', { edgeId, exists: edgeExists });
		
		// Delete the edge from YJS
		edgesMap.delete(edgeId);
		
		// Verify deletion
		const edgeStillExists = edgesMap.has(edgeId);
		console.log('[COLLABORATION] 🔍 Edge exists in YJS after deletion:', { edgeId, exists: edgeStillExists });
		
		console.log('[COLLABORATION] ✅ Broadcasting connection removal:', { edgeId, wasDeleted: !edgeStillExists });
		
		// Clean up the tracking after a short delay
		setTimeout(() => {
			localEdgeDeletions.delete(edgeId);
			console.log('[COLLABORATION] 🧹 Cleaned up local edge deletion tracking:', { edgeId, localEdgeDeletions: Array.from(localEdgeDeletions) });
		}, 1000);
	} catch (error) {
		console.error('[COLLABORATION] ❌ Error broadcasting connection removal:', error);
	}
}

/**
 * Update cursor position and action
 * @param position The cursor position
 * @param action The current action being performed
 * @param nodeId Optional node ID if interacting with a specific node
 */
// Removed cursor functions - too complex

/**
 * Generate a unique user ID
 */
function generateUserId(): string {
	return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique component ID
 * @param type Component type
 * @param userId User ID for collision prevention
 * @returns Unique component ID
 */
export function generateComponentId(type: string, userId?: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substr(2, 9);
	const userPrefix = userId ? userId.slice(-6) : 'anon';
	return `${type}_${userPrefix}_${timestamp}_${random}`;
}

/**
 * Clean up collaboration connections
 */
export async function cleanupCollaboration() {
	if (provider) {
		provider.destroy();
		provider = null;
	}

	if (ydoc) {
		ydoc.destroy();
		ydoc = null;
	}

	nodesMap = null;
	edgesMap = null;
	// Removed cursorsMap
	currentProjectId = null;
	currentUserId = null;

	// Clear tracking sets
	localDeletions.clear();
	localEdgeDeletions.clear();

	// Clear stores
	activeCollaborators.set({});
	connectionState.set('disconnected');

	if (cursorUpdateTimeout) {
		clearTimeout(cursorUpdateTimeout);
		cursorUpdateTimeout = null;
	}
}

/**
 * Get the current circuit state for syncing
 * This function is now deprecated as we use direct array manipulation
 */
export function getCurrentCircuitState() {
	console.warn('[COLLABORATION] getCurrentCircuitState is deprecated - use direct array manipulation');
	return {
		nodes: [],
		edges: []
	};
}

/**
 * Load circuit state from Yjs document (for initial sync)
 * @deprecated This function is deprecated - we no longer load state from YJS
 * to avoid conflicts with database state.
 */
export function loadCircuitStateFromYjs() {
	console.warn('[COLLABORATION] loadCircuitStateFromYjs is deprecated - YJS only handles real-time changes');
}

/**
 * Sync circuit state to Yjs (for initial load from database)
 * @deprecated This function is deprecated - we no longer sync database state to YJS
 * to avoid conflicts. YJS only handles real-time collaboration changes.
 */
export function syncStateToYjs(nodes: any[], edges: any[]) {
	console.warn('[COLLABORATION] syncStateToYjs is deprecated - YJS only handles real-time changes');
}

/**
 * Checks if a user has edit rights for a project
 * @param projectId The project ID to check
 */
export async function hasEditRights(projectId: string): Promise<boolean> {
	if (!browser) return false;

	try {
		// This function is no longer relevant as collaboration is direct YJS
		// Keeping it for now, but it will always return false
		console.warn('hasEditRights is deprecated as collaboration is direct YJS.');
		return false;
	} catch (error) {
		console.error('Error checking edit rights:', error);
		return false;
	}
}

// Simplified API for external use
export const collaboration = {
	init: initCollaboration,
	cleanup: cleanupCollaboration,
	broadcastNodeMovement,
	broadcastNodeProperties,
	broadcastComponentAdded,
	broadcastComponentRemoved,
	broadcastConnectionAdded,
	broadcastConnectionRemoved,
	// Removed cursor functions
	generateComponentId,
	hasEditRights
};
