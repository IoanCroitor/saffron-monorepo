import { createSupabaseBrowserClient } from '$lib/supabase';
import type { Node, Edge } from '@xyflow/svelte';

export interface CircuitData {
	nodes: Node[];
	edges: Edge[];
	version: string;
	updated_at: string;
}

export interface CircuitProject {
	id: string;
	name: string;
	description: string;
	schematic_data: CircuitData;
	component_count: number;
	created_at: string;
	updated_at: string;
}

class CircuitAPI {
	private supabase = createSupabaseBrowserClient();

	async saveCircuit(name: string, description: string, userId: string, nodes: Node[], edges: Edge[]): Promise<{ success: boolean; project?: any; error?: string }> {
		try {
			// Compress data to reduce payload size
			const compressedNodes = nodes.map(node => ({
				id: node.id,
				type: node.type,
				position: node.position,
				data: node.data
			}));
			
			const compressedEdges = edges.map(edge => ({
				id: edge.id,
				source: edge.source,
				target: edge.target,
				type: edge.type
			}));

			const schematicData: CircuitData = {
				nodes: compressedNodes,
				edges: compressedEdges,
				version: '1.0',
				updated_at: new Date().toISOString()
			};

			const { data, error } = await this.supabase
				.from('projects')
				.insert([
					{
						user_id: userId,
						name,
						description,
						schematic_data: schematicData,
						component_count: nodes.length,
						status: 'active'
					}
				])
				.select()
				.single();

			if (error) {
				console.error('Error saving circuit:', error);
				return { success: false, error: error.message };
			}

			console.log('[CIRCUIT API] Circuit saved:', data);
			return { success: true, project: data };
		} catch (error) {
			console.error('Error saving circuit:', error);
			return { success: false, error: 'Failed to save circuit' };
		}
	}

	async updateCircuit(projectId: string, name: string, description: string, nodes: Node[], edges: Edge[]): Promise<{ success: boolean; project?: any; error?: string }> {
		try {
			// Compress data to reduce payload size
			const compressedNodes = nodes.map(node => ({
				id: node.id,
				type: node.type,
				position: node.position,
				data: node.data
			}));
			
			const compressedEdges = edges.map(edge => ({
				id: edge.id,
				source: edge.source,
				target: edge.target,
				type: edge.type
			}));

			const schematicData: CircuitData = {
				nodes: compressedNodes,
				edges: compressedEdges,
				version: '1.0',
				updated_at: new Date().toISOString()
			};

			const { data, error } = await this.supabase
				.from('projects')
				.update({
					name,
					description,
					schematic_data: schematicData,
					component_count: nodes.length,
					updated_at: new Date().toISOString()
				})
				.eq('id', projectId)
				.select()
				.single();

			if (error) {
				console.error('Error updating circuit:', error);
				return { success: false, error: error.message };
			}

			console.log('[CIRCUIT API] Circuit updated:', data);
			return { success: true, project: data };
		} catch (error) {
			console.error('Error updating circuit:', error);
			return { success: false, error: 'Failed to update circuit' };
		}
	}

	async loadCircuit(projectId: string): Promise<{ success: boolean; name?: string; description?: string; nodes?: Node[]; edges?: Edge[]; error?: string }> {
		try {
			const { data, error } = await this.supabase
				.from('projects')
				.select('name, description, schematic_data')
				.eq('id', projectId)
				.single();

			if (error) {
				console.error('Error loading circuit:', error);
				return { success: false, error: error.message };
			}

			if (!data.schematic_data) {
				return { success: false, error: 'No circuit data found' };
			}

			const schematicData = data.schematic_data as CircuitData;
			
			console.log('[CIRCUIT API] Circuit loaded:', {
				name: data.name,
				nodes: schematicData.nodes?.length || 0,
				edges: schematicData.edges?.length || 0
			});

			return {
				success: true,
				name: data.name,
				description: data.description,
				nodes: schematicData.nodes || [],
				edges: schematicData.edges || []
			};
		} catch (error) {
			console.error('Error loading circuit:', error);
			return { success: false, error: 'Failed to load circuit' };
		}
	}

	// Auto-save for collaborative editing
	async autoSave(projectId: string, nodes: Node[], edges: Edge[]): Promise<boolean> {
		try {
			// Compress data to reduce payload size
			const compressedNodes = nodes.map(node => ({
				id: node.id,
				type: node.type,
				position: node.position,
				data: node.data
			}));
			
			const compressedEdges = edges.map(edge => ({
				id: edge.id,
				source: edge.source,
				target: edge.target,
				type: edge.type
			}));

			const schematicData: CircuitData = {
				nodes: compressedNodes,
				edges: compressedEdges,
				version: '1.0',
				updated_at: new Date().toISOString()
			};

			const { error } = await this.supabase
				.from('projects')
				.update({
					schematic_data: schematicData,
					component_count: nodes.length,
					updated_at: new Date().toISOString()
				})
				.eq('id', projectId);

			if (error) {
				console.error('Error auto-saving circuit:', error);
				return false;
			}

			console.log('[CIRCUIT API] Auto-saved circuit:', {
				projectId,
				nodes: nodes.length,
				edges: edges.length
			});
			return true;
		} catch (error) {
			console.error('Error auto-saving circuit:', error);
			return false;
		}
	}
}

export const circuitAPI = new CircuitAPI(); 