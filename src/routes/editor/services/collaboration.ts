import { writable } from 'svelte/store';
import { createSupabaseBrowserClient } from '$lib/supabase';
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import { circuitStore } from '../stores/circuit-store';
import { getRandomColor, getUserColor } from '$lib/utils/color-utils';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

export interface CursorUpdate {
    x: number;
    y: number;
    action?: 'idle' | 'dragging' | 'selecting' | 'drawing';
    nodeId?: string;
    selectedNodeIds?: string[];
}

// Store for active collaborators
export const activeCollaborators = writable<Record<string, UserCursor>>({});

// User's own information for collaboration
export const userCollabInfo = writable({
    name: 'Anonymous User',
    color: getRandomColor()
});

// Enhanced throttling and debouncing
let cursorUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
let positionUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let lastSuccessfulSync = Date.now();
let pendingUpdates = new Map<string, any>();

const DEBOUNCE_TIME = 30; // Reduced for better responsiveness
const POSITION_UPDATE_DEBOUNCE = 100;
const MAX_RECONNECT_ATTEMPTS = 5;
const SYNC_HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_PENDING_UPDATES = 100;

// Connection state management
export const connectionState = writable<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
export const syncHealth = writable<{ lastSync: number; pendingCount: number; latency: number }>({
    lastSync: 0,
    pendingCount: 0,
    latency: 0
});

// Realtime channels
let projectChangesChannel: RealtimeChannel | null = null;
let cursorChannel: RealtimeChannel | null = null;
let currentProjectId: string | null = null;
let currentUserId: string | null = null;
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize real-time collaboration with bulletproof error handling
 * @param projectId The project ID to collaborate on
 */
export async function initCollaboration(projectId: string) {
    if (!browser) return;
    
    try {
        connectionState.set('connecting');
        
        // Clean up existing connections
        await cleanupConnections();
        
        const supabase = createSupabaseBrowserClient();
        
        // Get current user info with retry logic
        const { data: { user }, error: userError } = await retryOperation(
            () => supabase.auth.getUser(),
            3,
            1000
        );
        
        if (userError || !user) {
            console.error('Failed to get user:', userError);
            connectionState.set('error');
            return;
        }
        
        currentUserId = user.id;
        currentProjectId = projectId;
        
        // Get user profile information with error handling
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', user.id)
                .single();
            
            if (profile) {
                userCollabInfo.update(info => ({
                    ...info,
                    name: profile.name || 'Anonymous User'
                }));
            }
        } catch (profileError) {
            console.warn('Could not load user profile:', profileError);
            // Continue with default name
        }
        
        // Set up realtime subscriptions with enhanced error handling
        await setupProjectChangesChannel(supabase, projectId);
        await setupCursorChannel(supabase, projectId, user);
        
        // Start health monitoring
        startHealthMonitoring();
        
        connectionState.set('connected');
        reconnectAttempts = 0;
        lastSuccessfulSync = Date.now();
        
        console.log('Collaboration initialized successfully for project:', projectId);
        
        // Return cleanup function
        return async () => {
            await cleanupConnections();
        };
        
    } catch (error) {
        console.error('Failed to initialize collaboration:', error);
        connectionState.set('error');
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectAttempts++;
            
            setTimeout(() => {
                console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                initCollaboration(projectId);
            }, delay);
        }
    }
}

/**
 * Handle updates to the project data via Supabase Realtime
 */
function handleProjectUpdate(payload: any) {
    const { new: newProject, old: oldProject } = payload;
    
    // Check if this update was from this client
    const userId = get(page).data.session?.user?.id;
    if (newProject.updated_by === userId) return;
    
    // Update the circuit store with the new data if it's different
    if (newProject.schematic_data && JSON.stringify(newProject.schematic_data) !== JSON.stringify(oldProject.schematic_data)) {
        // Check if it's the active project
        if (get(page).params.id === newProject.id) {
            circuitStore.loadFromJson(newProject.schematic_data);
        }
    }
}

/**
 * Update active collaborators from presence data
 */
function updateCollaborators(presences: any[]) {
    activeCollaborators.update(existing => {
        const updates = { ...existing };
        
        for (const presence of presences) {
            updates[presence.user_id] = {
                userId: presence.user_id,
                name: presence.name || 'Anonymous',
                color: presence.color || '#ff9900',
                position: presence.position || { x: 0, y: 0 },
                lastUpdated: new Date()
            };
        }
        
        return updates;
    });
}

/**
 * Remove collaborators who have left
 */
function removeCollaborators(presences: any[]) {
    activeCollaborators.update(existing => {
        const updates = { ...existing };
        
        for (const presence of presences) {
            delete updates[presence.user_id];
        }
        
        return updates;
    });
}

/**
 * Sync the full state of collaborators
 */
function syncCollaborators(state: Record<string, any[]>) {
    activeCollaborators.update(existing => {
        const updates: Record<string, UserCursor> = {};
        
        // Process each presence entry
        Object.entries(state).forEach(([userId, presences]) => {
            // Use the most recent presence
            const presence = presences[0];
            
            updates[userId] = {
                userId,
                name: presence.name || 'Anonymous',
                color: presence.color || '#ff9900',
                position: presence.position || { x: 0, y: 0 },
                lastUpdated: new Date()
            };
        });
        
        return updates;
    });
}

/**
 * Save circuit changes to Supabase
 * @param projectId The project ID to update
 * @param circuitData The circuit data to save
 */
export async function saveCircuitChanges(projectId: string, circuitData: any) {
    const supabase = createSupabaseBrowserClient();
    
    const { error } = await supabase
        .from('projects')
        .update({
            schematic_data: circuitData,
            updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
        
    if (error) {
        console.error('Error saving circuit changes:', error);
        return false;
    }
    
    return true;
}

/**
 * Checks if a user has edit rights for a project
 * @param projectId The project ID to check
 */
export async function hasEditRights(projectId: string) {
    if (!browser) return false;
    
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
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
}

/**
 * Broadcast node position update with bulletproof error handling and throttling
 * @param nodeId The node ID being moved
 * @param position The new position
 */
export async function broadcastNodeMovement(nodeId: string, position: { x: number; y: number }) {
    if (!browser || !cursorChannel) {
        console.warn('Cannot broadcast node movement: channel not available');
        return;
    }
    
    try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('Cannot broadcast: user not authenticated');
            return;
        }
        
        // Throttle position updates to prevent spam
        const updateKey = `node_move_${nodeId}`;
        
        if (positionUpdateTimeout) {
            clearTimeout(positionUpdateTimeout);
        }
        
        positionUpdateTimeout = setTimeout(async () => {
            try {
                // Add to pending updates for tracking
                pendingUpdates.set(updateKey, { nodeId, position, timestamp: Date.now() });
                
                const result = await cursorChannel.send({
                    type: 'broadcast',
                    event: 'node_moved',
                    payload: {
                        nodeId,
                        position,
                        userId: user.id,
                        timestamp: new Date().toISOString(),
                        sequence: Date.now() // For ordering
                    }
                });
                
                if (result === 'ok') {
                    pendingUpdates.delete(updateKey);
                    lastSuccessfulSync = Date.now();
                } else {
                    console.warn('Failed to broadcast node movement:', result);
                }
                
            } catch (error) {
                console.error('Error broadcasting node movement:', error);
                // Keep in pending updates for potential retry
            }
        }, POSITION_UPDATE_DEBOUNCE);
        
    } catch (error) {
        console.error('Error preparing node movement broadcast:', error);
    }
}

/**
 * Broadcast component addition with enhanced reliability
 * @param type Component type
 * @param position Component position
 * @param id Component ID
 */
export async function broadcastComponentAdded(type: string, position: { x: number; y: number }, id: string) {
    if (!browser || !cursorChannel) {
        console.warn('Cannot broadcast component addition: channel not available');
        return;
    }
    
    try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('Cannot broadcast: user not authenticated');
            return;
        }
        
        const updateKey = `component_add_${id}`;
        pendingUpdates.set(updateKey, { type, position, id, timestamp: Date.now() });
        
        const result = await cursorChannel.send({
            type: 'broadcast',
            event: 'component_added',
            payload: {
                type,
                position,
                id,
                userId: user.id,
                timestamp: new Date().toISOString(),
                sequence: Date.now()
            }
        });
        
        if (result === 'ok') {
            pendingUpdates.delete(updateKey);
            lastSuccessfulSync = Date.now();
        } else {
            console.warn('Failed to broadcast component addition:', result);
        }
        
    } catch (error) {
        console.error('Error broadcasting component addition:', error);
    }
}

/**
 * Broadcast component removal with enhanced reliability
 * @param id Component ID
 */
export async function broadcastComponentRemoved(id: string) {
    if (!browser || !cursorChannel) {
        console.warn('Cannot broadcast component removal: channel not available');
        return;
    }
    
    try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('Cannot broadcast: user not authenticated');
            return;
        }
        
        const updateKey = `component_remove_${id}`;
        pendingUpdates.set(updateKey, { id, timestamp: Date.now() });
        
        const result = await cursorChannel.send({
            type: 'broadcast',
            event: 'component_removed',
            payload: {
                id,
                userId: user.id,
                timestamp: new Date().toISOString(),
                sequence: Date.now()
            }
        });
        
        if (result === 'ok') {
            pendingUpdates.delete(updateKey);
            lastSuccessfulSync = Date.now();
        } else {
            console.warn('Failed to broadcast component removal:', result);
        }
        
    } catch (error) {
        console.error('Error broadcasting component removal:', error);
    }
}

/**
 * Broadcast connection addition to other collaborators
 * @param edge The edge/connection being added
 */
export async function broadcastConnectionAdded(edge: any) {
    if (!browser || !cursorChannel) return;
    
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await cursorChannel.send({
        type: 'broadcast',
        event: 'connection_added',
        payload: {
            edge,
            userId: user.id,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Broadcast connection removal to other collaborators
 * @param edgeId The edge ID being removed
 */
export async function broadcastConnectionRemoved(edgeId: string) {
    if (!browser || !cursorChannel) return;
    
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await cursorChannel.send({
        type: 'broadcast',
        event: 'connection_removed',
        payload: {
            edgeId,
            userId: user.id,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Update cursor action state
 * @param action The current action being performed
 * @param nodeId Optional node ID if dragging/selecting a specific node
 */
export async function updateCursorAction(action: 'idle' | 'dragging' | 'selecting' | 'drawing', nodeId?: string) {
    if (!browser || !cursorChannel) return;
    
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const userInfo = get(userCollabInfo);
    await cursorChannel.track({
        user_id: user.id,
        action,
        nodeId,
        name: userInfo.name,
        color: getUserColor(user.id),
        timestamp: new Date().toISOString()
    });
}

/**
 * Handle node movement broadcast from other collaborators
 */
function handleNodeMovedBroadcast(payload: any) {
    const { nodeId, position, userId } = payload;
    
    // Don't update if this is from the current user
    const currentUserId = get(page).data.session?.user?.id;
    if (userId === currentUserId) return;
    
    // Update the circuit store with the new position
    circuitStore.updateNodePositionFromCollaborator(nodeId, position);
}

/**
 * Handle component addition broadcast from other collaborators
 */
function handleComponentAddedBroadcast(payload: any) {
    const { type, position, id, userId } = payload;
    
    // Don't update if this is from the current user
    const currentUserId = get(page).data.session?.user?.id;
    if (userId === currentUserId) return;
    
    // Add the component to the circuit store
    circuitStore.addComponentFromCollaborator(type, position, id);
}

/**
 * Handle component removal broadcast from other collaborators
 */
function handleComponentRemovedBroadcast(payload: any) {
    const { id, userId } = payload;
    
    // Don't update if this is from the current user
    const currentUserId = get(page).data.session?.user?.id;
    if (userId === currentUserId) return;
    
    // Remove the component from the circuit store
    circuitStore.removeComponentFromCollaborator(id);
}

/**
 * Handle connection addition broadcast from other collaborators
 */
function handleConnectionAddedBroadcast(payload: any) {
    const { edge, userId } = payload;
    
    // Don't update if this is from the current user
    const currentUserId = get(page).data.session?.user?.id;
    if (userId === currentUserId) return;
    
    // Add the connection to the circuit store
    circuitStore.addConnectionFromCollaborator(edge);
}

/**
 * Handle connection removal broadcast from other collaborators
 */
function handleConnectionRemovedBroadcast(payload: any) {
    const { edgeId, userId } = payload;
    
    // Don't update if this is from the current user
    const currentUserId = get(page).data.session?.user?.id;
    if (userId === currentUserId) return;
    
    // Remove the connection from the circuit store
    circuitStore.removeConnectionFromCollaborator(edgeId);
}

/**
 * Update the user's cursor position and info in the presence channel
 */
export async function updateCursorPosition(position: { x: number; y: number }) {
    if (!browser || !cursorChannel) return;
    
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const userInfo = get(userCollabInfo);
    await cursorChannel.track({
        user_id: user.id,
        position,
        name: userInfo.name,
        color: getUserColor(user.id),
        timestamp: new Date().toISOString()
    });
}

/**
 * Handle state sync broadcast from other collaborators
 */
function handleStateSyncBroadcast(payload: any) {
    console.log('Received state sync:', payload);
    
    if (!payload.nodes || !payload.edges) return;
    
    // Only apply state sync if we're a newly joined collaborator with empty state
    const currentStore = get(circuitStore);
    if (currentStore.nodes.length === 0 && currentStore.edges.length === 0) {
        // Clear existing state and apply synced state
        circuitStore.clear();
        
        // Add all nodes from sync
        payload.nodes.forEach((node: any) => {
            circuitStore.addComponentFromCollaborator(node.type, node.position, node.id);
        });
        
        // Add all edges from sync
        payload.edges.forEach((edge: any) => {
            circuitStore.addConnectionFromCollaborator(edge);
        });
        
        console.log('Applied state sync with', payload.nodes.length, 'nodes and', payload.edges.length, 'edges');
    }
}

/**
 * Generate a unique component ID that's consistent across collaborators
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
 * Broadcast current circuit state to new collaborators
 */
export function broadcastCurrentState() {
    if (!cursorChannel) return;
    
    const store = get(circuitStore);
    
    // Send full state sync instead of individual component additions
    cursorChannel.send({
        type: 'broadcast',
        event: 'state_sync',
        payload: {
            nodes: store.nodes,
            edges: store.edges,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Retry operation with exponential backoff
 */
async function retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxAttempts) {
                throw lastError;
            }
            
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

/**
 * Clean up existing connections safely
 */
async function cleanupConnections() {
    try {
        if (projectChangesChannel) {
            await projectChangesChannel.unsubscribe();
            projectChangesChannel = null;
        }
        
        if (cursorChannel) {
            await cursorChannel.unsubscribe();
            cursorChannel = null;
        }
        
        if (healthCheckInterval) {
            clearInterval(healthCheckInterval);
            healthCheckInterval = null;
        }
        
        // Clear pending updates
        pendingUpdates.clear();
        
    } catch (error) {
        console.warn('Error during cleanup:', error);
    }
}

/**
 * Set up project changes channel with error handling
 */
async function setupProjectChangesChannel(supabase: any, projectId: string) {
    projectChangesChannel = supabase.channel(`project-${projectId}`);
    
    projectChangesChannel
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
            (payload: any) => {
                try {
                    handleProjectUpdate(payload);
                    lastSuccessfulSync = Date.now();
                } catch (error) {
                    console.error('Error handling project update:', error);
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Project changes channel connected');
            } else if (status === 'CLOSED') {
                console.warn('Project changes channel closed');
                connectionState.set('disconnected');
            }
        });
}

/**
 * Set up cursor channel with comprehensive event handling
 */
async function setupCursorChannel(supabase: any, projectId: string, user: any) {
    cursorChannel = supabase.channel(`cursors-${projectId}`);
    
    cursorChannel
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            try {
                updateCollaborators(newPresences);
                // Send current circuit state to new collaborators with delay
                setTimeout(() => broadcastCurrentState(), 500);
            } catch (error) {
                console.error('Error handling presence join:', error);
            }
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            try {
                removeCollaborators(leftPresences);
            } catch (error) {
                console.error('Error handling presence leave:', error);
            }
        })
        .on('presence', { event: 'sync' }, () => {
            try {
                const state = cursorChannel?.presenceState();
                if (state) syncCollaborators(state);
            } catch (error) {
                console.error('Error handling presence sync:', error);
            }
        })
        .on('broadcast', { event: 'node_moved' }, ({ payload }) => {
            try {
                handleNodeMovedBroadcast(payload);
                lastSuccessfulSync = Date.now();
            } catch (error) {
                console.error('Error handling node movement:', error);
            }
        })
        .on('broadcast', { event: 'component_added' }, ({ payload }) => {
            try {
                handleComponentAddedBroadcast(payload);
                lastSuccessfulSync = Date.now();
            } catch (error) {
                console.error('Error handling component addition:', error);
            }
        })
        .on('broadcast', { event: 'component_removed' }, ({ payload }) => {
            try {
                handleComponentRemovedBroadcast(payload);
                lastSuccessfulSync = Date.now();
            } catch (error) {
                console.error('Error handling component removal:', error);
            }
        })
        .on('broadcast', { event: 'connection_added' }, ({ payload }) => {
            try {
                handleConnectionAddedBroadcast(payload);
                lastSuccessfulSync = Date.now();
            } catch (error) {
                console.error('Error handling connection addition:', error);
            }
        })
        .on('broadcast', { event: 'connection_removed' }, ({ payload }) => {
            try {
                handleConnectionRemovedBroadcast(payload);
                lastSuccessfulSync = Date.now();
            } catch (error) {
                console.error('Error handling connection removal:', error);
            }
        })
        .on('broadcast', { event: 'state_sync' }, ({ payload }) => {
            try {
                handleStateSyncBroadcast(payload);
                lastSuccessfulSync = Date.now();
            } catch (error) {
                console.error('Error handling state sync:', error);
            }
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Cursor channel connected');
                
                // Send initial presence
                const userInfo = get(userCollabInfo);
                if (cursorChannel) {
                    try {
                        await cursorChannel.track({
                            user_id: user.id,
                            position: { x: 0, y: 0 },
                            name: userInfo.name,
                            color: getUserColor(user.id),
                            timestamp: new Date().toISOString()
                        });
                    } catch (error) {
                        console.error('Error tracking initial presence:', error);
                    }
                }
                
                // Set up cursor tracking with error handling
                setupCursorTracking(user);
            } else if (status === 'CLOSED') {
                console.warn('Cursor channel closed');
                connectionState.set('disconnected');
            }
        });
}

/**
 * Set up cursor tracking with optimized performance
 */
function setupCursorTracking(user: any) {
    if (!browser || !window) return;
    
    const handleMouseMove = (e: MouseEvent) => {
        if (!cursorUpdateTimeout) {
            cursorUpdateTimeout = setTimeout(async () => {
                try {
                    const canvasEl = document.querySelector('.svelte-flow');
                    if (!canvasEl) return;
                    
                    const rect = canvasEl.getBoundingClientRect();
                    const position = {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                    };
                    
                    // Update cursor position through presence
                    const userInfo = get(userCollabInfo);
                    if (cursorChannel) {
                        await cursorChannel.track({
                            user_id: user.id,
                            position,
                            name: userInfo.name,
                            color: getUserColor(user.id),
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.warn('Error updating cursor position:', error);
                } finally {
                    cursorUpdateTimeout = null;
                }
            }, DEBOUNCE_TIME);
        }
    };
    
    // Add event listener with cleanup
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Return cleanup function
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
    };
}

/**
 * Start health monitoring for connection reliability
 */
function startHealthMonitoring() {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
    }
    
    healthCheckInterval = setInterval(() => {
        const now = Date.now();
        const timeSinceLastSync = now - lastSuccessfulSync;
        const pendingCount = pendingUpdates.size;
        
        // Update health metrics
        syncHealth.update(health => ({
            ...health,
            lastSync: lastSuccessfulSync,
            pendingCount,
            latency: timeSinceLastSync
        }));
        
        // Check if connection is stale
        if (timeSinceLastSync > SYNC_HEALTH_CHECK_INTERVAL * 2) {
            console.warn('Connection appears stale, attempting reconnection...');
            connectionState.set('disconnected');
            
            if (currentProjectId) {
                initCollaboration(currentProjectId);
            }
        }
        
        // Clean up old pending updates
        if (pendingCount > MAX_PENDING_UPDATES) {
            const oldestKeys = Array.from(pendingUpdates.keys()).slice(0, pendingCount - MAX_PENDING_UPDATES);
            oldestKeys.forEach(key => pendingUpdates.delete(key));
        }
        
    }, SYNC_HEALTH_CHECK_INTERVAL);
}
