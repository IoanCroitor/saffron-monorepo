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
	onCursorUpdate?: (cursorId: string, cursorData: any) => void;
	onCursorRemove?: (cursorId: string) => void;
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
let cursorsMap: Y.Map<any> | null = null;
let currentProjectId: string | null = null;
let currentUserId: string | null = null;
let collaborationCallbacks: CollaborationCallbacks = {};

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
		cursorsMap = ydoc.getMap('cursors');

		// Create WebSocket provider to connect to your Yjs server
		provider = new WebsocketProvider(
			YJS_CONFIG.wsUrl,
			`${YJS_CONFIG.roomPrefix}-${projectId}`,
			ydoc
		);

		// Set up event listeners
		setupEventListeners();

		// Set up cursor tracking
		if (browser && window) {
			setupCursorTracking();
		}

		// Wait for connection to be established
		return new Promise<(() => void) | null>((resolve) => {
			if (provider) {
				provider.on('status', (event: any) => {
					connectionState.set(event.status === 'connected' ? 'connected' : 'disconnected');
					
					if (event.status === 'connected') {
						console.log('Yjs collaboration connected for project:', projectId);
						
						// Don't load state from YJS on connection - let Supabase handle initial state
						// YJS will only handle real-time changes from this point forward
						
						resolve(() => cleanupCollaboration());
					}
				});
			} else {
				// Fallback if provider is not available
				connectionState.set('connected');
				console.log('Yjs collaboration initialized for project:', projectId);
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
	if (!nodesMap || !edgesMap || !cursorsMap) return;

	// Listen for node changes from other users only
	nodesMap.observe((event) => {
		event.changes.keys.forEach((change, key) => {
			const nodeData = nodesMap!.get(key);
			
			// Only process changes from other users
			if (nodeData && nodeData.userId !== currentUserId) {
				if (change.action === 'add' || change.action === 'update') {
					// Update from another user
					if (change.action === 'add' && collaborationCallbacks.onNodeAdd) {
						collaborationCallbacks.onNodeAdd(key, nodeData);
					} else if (change.action === 'update' && collaborationCallbacks.onNodeUpdate) {
						collaborationCallbacks.onNodeUpdate(key, nodeData);
					}
					console.log('[COLLABORATION] Node update from collaborator:', key, nodeData);
				} else if (change.action === 'delete') {
					if (collaborationCallbacks.onNodeRemove) {
						collaborationCallbacks.onNodeRemove(key);
					}
					console.log('[COLLABORATION] Component removed by collaborator:', key);
				}
			}
		});
	});

	// Listen for edge changes from other users only
	edgesMap.observe((event) => {
		event.changes.keys.forEach((change, key) => {
			const edgeData = edgesMap!.get(key);
			
			// Only process changes from other users
			if (edgeData && edgeData.userId !== currentUserId) {
				if (change.action === 'add' || change.action === 'update') {
					// Update from another user
					if (change.action === 'add' && collaborationCallbacks.onEdgeAdd) {
						collaborationCallbacks.onEdgeAdd(key, edgeData);
					} else if (change.action === 'update' && collaborationCallbacks.onEdgeUpdate) {
						collaborationCallbacks.onEdgeUpdate(key, edgeData);
					}
					console.log('[COLLABORATION] Edge update from collaborator:', key, edgeData);
				} else if (change.action === 'delete') {
					if (collaborationCallbacks.onEdgeRemove) {
						collaborationCallbacks.onEdgeRemove(key);
					}
					console.log('[COLLABORATION] Edge removed by collaborator:', key);
				}
			}
		});
	});

	// Listen for cursor changes
	cursorsMap.observe((event: any) => {
		updateCollaboratorsFromCursors();
	});

	// Provider connection changes are now handled in the initCollaboration promise
}

/**
 * Update collaborators from cursor data
 */
function updateCollaboratorsFromCursors() {
	if (!cursorsMap) return;

	const collaborators: Record<string, UserCursor> = {};

	cursorsMap.forEach((cursorData, userId) => {
		if (userId !== currentUserId) {
			collaborators[userId] = {
				userId,
				name: cursorData.name || 'Anonymous',
				color: cursorData.color || getRandomColor(),
				position: cursorData.position || { x: 0, y: 0 },
				lastUpdated: new Date(cursorData.timestamp || Date.now()),
				action: cursorData.action || 'idle',
				nodeId: cursorData.nodeId,
				selectedNodeIds: cursorData.selectedNodeIds
			};
		}
	});

	activeCollaborators.set(collaborators);
}

/**
 * Broadcast node position update
 * @param nodeId The node ID being moved
 * @param position The new position
 */
export function broadcastNodeMovement(nodeId: string, position: { x: number; y: number }) {
	if (!nodesMap || !currentUserId) return;

	// Use safe serialization to avoid Svelte proxy issues
	const nodeData = safeSerialize({
		id: nodeId,
		position,
		userId: currentUserId,
		timestamp: Date.now()
	});

	nodesMap.set(nodeId, nodeData);
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
	id: string
) {
	if (!nodesMap || !currentUserId) return;

	// Use safe serialization to avoid Svelte proxy issues
	const nodeData = safeSerialize({
		id,
		type,
		position,
		userId: currentUserId,
		timestamp: Date.now()
	});

	nodesMap.set(id, nodeData);
}

/**
 * Broadcast component removal
 * @param id Component ID
 */
export function broadcastComponentRemoved(id: string) {
	if (!nodesMap) return;

	nodesMap.delete(id);
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
 * Broadcast connection removal
 * @param edgeId The edge ID being removed
 */
export function broadcastConnectionRemoved(edgeId: string) {
	if (!edgesMap) return;

	edgesMap.delete(edgeId);
}

/**
 * Update cursor position and action
 * @param position The cursor position
 * @param action The current action being performed
 * @param nodeId Optional node ID if interacting with a specific node
 */
export function updateCursorPosition(
	position: { x: number; y: number },
	action: 'idle' | 'dragging' | 'selecting' | 'drawing' = 'idle',
	nodeId?: string
) {
	if (!cursorsMap || !currentUserId) return;

	// Throttle cursor updates
	if (cursorUpdateTimeout) {
		clearTimeout(cursorUpdateTimeout);
	}

	cursorUpdateTimeout = setTimeout(() => {
		const userInfo = get(userCollabInfo);

		// Use safe serialization to avoid Svelte proxy issues
		const cursorData = safeSerialize({
			position,
			action,
			nodeId,
			name: userInfo.name,
			color: userInfo.color,
			timestamp: Date.now()
		});

		cursorsMap!.set(currentUserId!, cursorData);
	}, CURSOR_DEBOUNCE_TIME);
}

/**
 * Update cursor action without changing position
 * @param action The current action being performed
 * @param nodeId Optional node ID if interacting with a specific node
 */
export function updateCursorAction(
	action: 'idle' | 'dragging' | 'selecting' | 'drawing',
	nodeId?: string
) {
	if (!cursorsMap || !currentUserId) return;

	const currentCursor = cursorsMap.get(currentUserId) || {};
	const userInfo = get(userCollabInfo);

	// Use safe serialization to avoid Svelte proxy issues
	const cursorData = safeSerialize({
		...currentCursor,
		action,
		nodeId,
		name: userInfo.name,
		color: userInfo.color,
		timestamp: Date.now()
	});

	cursorsMap.set(currentUserId, cursorData);
}

/**
 * Set up cursor tracking with mouse events
 * This function is now deprecated - cursor tracking should be done in the editor
 * using SvelteFlow's coordinate system
 */
function setupCursorTracking() {
	console.warn('[COLLABORATION] setupCursorTracking is deprecated - use SvelteFlow coordinates instead');
}

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
	cursorsMap = null;
	currentProjectId = null;
	currentUserId = null;

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
	broadcastComponentAdded,
	broadcastComponentRemoved,
	broadcastConnectionAdded,
	broadcastConnectionRemoved,
	updateCursorPosition,
	updateCursorAction,
	generateComponentId,
	hasEditRights
};
