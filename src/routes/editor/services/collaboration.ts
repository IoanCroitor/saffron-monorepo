import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { browser } from '$app/environment';
// Circuit store removed - collaboration now works with external state management
import { getRandomColor, getUserColor } from '$lib/utils/color-utils';
import { createSupabaseBrowserClient } from '$lib/supabase';
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
let awarenessMap: Y.Map<any> | null = null;
let currentProjectId: string | null = null;
let currentUserId: string | null = null;

// Throttling for cursor updates
let cursorUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
const CURSOR_DEBOUNCE_TIME = YJS_CONFIG.cursorDebounceTime;

/**
 * Initialize Yjs collaboration for a project
 * @param projectId The project ID to collaborate on
 * @param userId The current user ID
 * @param userName The current user name
 */
export async function initCollaboration(projectId: string, userId?: string, userName?: string) {
	if (!browser) return;

	try {
		connectionState.set('connecting');

		// Clean up existing connections
		await cleanupCollaboration();

		currentProjectId = projectId;
		currentUserId = userId || generateUserId();

		// Update user info
		userCollabInfo.update((info) => ({
			...info,
			name: userName || info.name
		}));

		// Create Yjs document
		ydoc = new Y.Doc();

		// Get shared maps for nodes, edges, and awareness
		nodesMap = ydoc.getMap('nodes');
		edgesMap = ydoc.getMap('edges');
		awarenessMap = ydoc.getMap('awareness');

		// Create WebSocket provider to connect to your Docker Yjs server
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

		connectionState.set('connected');
		console.log('Yjs collaboration initialized for project:', projectId);

		return () => cleanupCollaboration();
	} catch (error) {
		console.error('Failed to initialize Yjs collaboration:', error);
		connectionState.set('error');
	}
}

/**
 * Set up event listeners for Yjs changes
 */
function setupEventListeners() {
	if (!nodesMap || !edgesMap || !awarenessMap) return;

	// Listen for node changes
	nodesMap.observe((event) => {
		event.changes.keys.forEach((change, key) => {
			if (change.action === 'add' || change.action === 'update') {
				const nodeData = nodesMap!.get(key);
				if (nodeData && nodeData.userId !== currentUserId) {
					// TODO: Update from another user - need to implement callback system
					console.log('[COLLABORATION] Node update from collaborator:', key, nodeData.position);
				}
			} else if (change.action === 'delete') {
				// TODO: Remove component from collaborator - need to implement callback system
				console.log('[COLLABORATION] Component removed by collaborator:', key);
			}
		});
	});

	// Listen for edge changes
	edgesMap.observe((event) => {
		event.changes.keys.forEach((change, key) => {
			if (change.action === 'add' || change.action === 'update') {
				const edgeData = edgesMap!.get(key);
				if (edgeData && edgeData.userId !== currentUserId) {
					// TODO: Update from another user - need to implement callback system
					console.log('[COLLABORATION] Edge added by collaborator:', edgeData);
				}
			} else if (change.action === 'delete') {
				// TODO: Remove connection from collaborator - need to implement callback system
				console.log('[COLLABORATION] Edge removed by collaborator:', key);
			}
		});
	});

	// Listen for awareness changes (cursors, presence)
	awarenessMap.observe((event) => {
		updateCollaboratorsFromAwareness();
	});

	// Listen for provider connection changes
	if (provider) {
		provider.on('status', (event: any) => {
			connectionState.set(event.status === 'connected' ? 'connected' : 'disconnected');
		});
	}
}

/**
 * Update collaborators from awareness data
 */
function updateCollaboratorsFromAwareness() {
	if (!awarenessMap) return;

	const collaborators: Record<string, UserCursor> = {};

	awarenessMap.forEach((awareness, userId) => {
		if (userId !== currentUserId) {
			collaborators[userId] = {
				userId,
				name: awareness.name || 'Anonymous',
				color: awareness.color || getRandomColor(),
				position: awareness.position || { x: 0, y: 0 },
				lastUpdated: new Date(awareness.timestamp || Date.now()),
				action: awareness.action || 'idle',
				nodeId: awareness.nodeId,
				selectedNodeIds: awareness.selectedNodeIds
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
	if (!awarenessMap || !currentUserId) return;

	// Throttle cursor updates
	if (cursorUpdateTimeout) {
		clearTimeout(cursorUpdateTimeout);
	}

	cursorUpdateTimeout = setTimeout(() => {
		const userInfo = get(userCollabInfo);

		// Use safe serialization to avoid Svelte proxy issues
		const awarenessData = safeSerialize({
			position,
			action,
			nodeId,
			name: userInfo.name,
			color: userInfo.color,
			timestamp: Date.now()
		});

		awarenessMap!.set(currentUserId!, awarenessData);
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
	if (!awarenessMap || !currentUserId) return;

	const currentAwareness = awarenessMap.get(currentUserId) || {};
	const userInfo = get(userCollabInfo);

	// Use safe serialization to avoid Svelte proxy issues
	const awarenessData = safeSerialize({
		...currentAwareness,
		action,
		nodeId,
		name: userInfo.name,
		color: userInfo.color,
		timestamp: Date.now()
	});

	awarenessMap.set(currentUserId, awarenessData);
}

/**
 * Set up cursor tracking with mouse events
 */
function setupCursorTracking() {
	if (!browser || !window) return;

	const handleMouseMove = (e: MouseEvent) => {
		const canvasEl =
			document.querySelector('.svelte-flow') ||
			document.querySelector('[data-testid="rf__wrapper"]');
		if (!canvasEl) return;

		const rect = canvasEl.getBoundingClientRect();
		const position = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};

		updateCursorPosition(position);
	};

	// Add event listener
	window.addEventListener('mousemove', handleMouseMove, { passive: true });

	// Return cleanup function
	return () => {
		window.removeEventListener('mousemove', handleMouseMove);
	};
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
	awarenessMap = null;
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
 * TODO: Refactor to use callback system instead of circuit store
 */
export function getCurrentCircuitState() {
	// TODO: Need to implement callback system to get current state
	console.log('[COLLABORATION] getCurrentCircuitState called - needs refactoring');
	return {
		nodes: [],
		edges: []
	};
}

/**
 * Load circuit state from Yjs document (for initial sync)
 */
export function loadCircuitStateFromYjs() {
	if (!nodesMap || !edgesMap) return;

	const nodes: any[] = [];
	const edges: any[] = [];

	// Load nodes
	nodesMap.forEach((nodeData, nodeId) => {
		nodes.push({
			id: nodeId,
			...nodeData
		});
	});

	// Load edges
	edgesMap.forEach((edgeData, edgeId) => {
		edges.push({
			id: edgeId,
			...edgeData
		});
	});

	// TODO: Update circuit state using callback system
	console.log('[COLLABORATION] loadCircuitStateFromYjs called - needs refactoring', { nodes, edges });
}

/**
 * Checks if a user has edit rights for a project
 * @param projectId The project ID to check
 */
export async function hasEditRights(projectId: string): Promise<boolean> {
	if (!browser) return false;

	try {
		const supabase = createSupabaseBrowserClient();
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return false;

		// Check if owner
		const { data: project } = await supabase
			.from('projects')
			.select('user_id')
			.eq('id', projectId)
			.single();

		if (project && project.user_id === user.id) {
			return true;
		}

		// Check if collaborator with edit rights
		const { data: collaborator } = await supabase
			.from('project_collaborators')
			.select('role')
			.eq('project_id', projectId)
			.eq('user_id', user.id)
			.single();

		if (collaborator && ['owner', 'editor'].includes(collaborator.role)) {
			return true;
		}

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
	getCurrentState: getCurrentCircuitState,
	loadState: loadCircuitStateFromYjs,
	hasEditRights
};
