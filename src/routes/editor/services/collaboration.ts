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

// Throttled cursor update debounce
let cursorUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_TIME = 50; // ms

// Realtime channels
let projectChangesChannel: RealtimeChannel | null = null;
let cursorChannel: RealtimeChannel | null = null;
let currentProjectId: string | null = null;
let currentUserId: string | null = null;

/**
 * Initialize real-time collaboration
 * @param projectId The project ID to collaborate on
 */
export async function initCollaboration(projectId: string) {
    if (!browser) return;
    
    // Get the Supabase client
    const supabase = createSupabaseBrowserClient();
    
    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Get user profile information
    const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
    
    if (profile) {
        userCollabInfo.update(info => ({
            ...info,
            name: profile.name
        }));
    }
    
    // Set up realtime subscriptions for project changes
    const projectChangesChannel = supabase.channel(`project-${projectId}`);
    projectChangesChannel
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
            handleProjectUpdate
        )
        .subscribe();
        
    // Subscribe to cursor updates and real-time events
    cursorChannel = supabase.channel(`cursors-${projectId}`);
    cursorChannel
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            updateCollaborators(newPresences);
            // Send current circuit state to new collaborators with small delay
            setTimeout(() => broadcastCurrentState(), 500);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            removeCollaborators(leftPresences);
        })
        .on('presence', { event: 'sync' }, () => {
            const state = cursorChannel?.presenceState();
            if (state) syncCollaborators(state);
        })
        .on('broadcast', { event: 'node_moved' }, ({ payload }) => {
            handleNodeMovedBroadcast(payload);
        })
        .on('broadcast', { event: 'component_added' }, ({ payload }) => {
            handleComponentAddedBroadcast(payload);
        })
        .on('broadcast', { event: 'component_removed' }, ({ payload }) => {
            handleComponentRemovedBroadcast(payload);
        })
        .on('broadcast', { event: 'state_sync' }, ({ payload }) => {
            handleStateSyncBroadcast(payload);
        })
        .subscribe(async (status) => {
            if (status !== 'SUBSCRIBED') return;
            
            // Send initial presence
            const userInfo = get(userCollabInfo);
            if (cursorChannel) {
                await cursorChannel.track({
                    user_id: user.id,
                    position: { x: 0, y: 0 },
                    name: userInfo.name,
                    color: userInfo.color,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
    // Set up cursor tracking
    if (browser && window) {
        const handleMouseMove = (e: MouseEvent) => {
            if (!cursorUpdateTimeout) {
                cursorUpdateTimeout = setTimeout(() => {
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
                        cursorChannel.track({
                            user_id: user.id,
                            position,
                            name: userInfo.name,
                            color: getUserColor(user.id), // Get consistent color for each user
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    cursorUpdateTimeout = null;
                }, DEBOUNCE_TIME);
            }
        };
        
        // Add and remove event listeners
        window.addEventListener('mousemove', handleMouseMove);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (projectChangesChannel) projectChangesChannel.unsubscribe();
            if (cursorChannel) cursorChannel.unsubscribe();
        };
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
 * Broadcast node position update to other collaborators
 * @param nodeId The node ID being moved
 * @param position The new position
 */
export async function broadcastNodeMovement(nodeId: string, position: { x: number; y: number }) {
    if (!browser || !cursorChannel) return;
    
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Send node movement event through the cursor channel
    await cursorChannel.send({
        type: 'broadcast',
        event: 'node_moved',
        payload: {
            nodeId,
            position,
            userId: user.id,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Broadcast component addition to other collaborators
 * @param type Component type
 * @param position Component position
 * @param id Component ID
 */
export async function broadcastComponentAdded(type: string, position: { x: number; y: number }, id: string) {
    if (!browser || !cursorChannel) return;
    
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await cursorChannel.send({
        type: 'broadcast',
        event: 'component_added',
        payload: {
            type,
            position,
            id,
            userId: user.id,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Broadcast component removal to other collaborators
 * @param id Component ID
 */
export async function broadcastComponentRemoved(id: string) {
    if (!browser || !cursorChannel) return;
    
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await cursorChannel.send({
        type: 'broadcast',
        event: 'component_removed',
        payload: {
            id,
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
