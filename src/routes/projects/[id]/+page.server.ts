import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Authentication required');
	}

	const projectId = params.id;

	try {
		// Load the specific project
		const { data: project, error: projectError } = await locals.supabase
			.from('projects')
			.select(`
				id,
				name,
				description,
				component_count,
				status,
				created_at,
				updated_at,
				schematic_data,
				user_id
			`)
			.eq('id', projectId)
			.eq('user_id', user.id) // Ensure user owns this project
			.single();

		if (projectError) {
			if (projectError.code === 'PGRST116') {
				throw error(404, 'Project not found');
			}
			console.error('Error loading project:', projectError);
			throw error(500, 'Failed to load project');
		}

		if (!project) {
			throw error(404, 'Project not found');
		}

		// Check if project has been deleted
		if (project.status === 'deleted') {
			throw error(404, 'Project not found');
		}

		// Calculate time strings
		const now = new Date();
		const createdAt = new Date(project.created_at);
		const updatedAt = new Date(project.updated_at);
		
		const formatDate = (date: Date) => {
			return date.toLocaleDateString('en-US', { 
				year: 'numeric', 
				month: 'long', 
				day: 'numeric' 
			});
		};

		const getTimeAgo = (date: Date) => {
			const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
			
			if (diffInMinutes < 1) {
				return 'Just now';
			} else if (diffInMinutes < 60) {
				return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
			} else if (diffInMinutes < 1440) { // Less than 24 hours
				const hours = Math.floor(diffInMinutes / 60);
				return `${hours} hour${hours === 1 ? '' : 's'} ago`;
			} else {
				const days = Math.floor(diffInMinutes / 1440);
				return `${days} day${days === 1 ? '' : 's'} ago`;
			}
		};

		// Analyze circuit data
		const schematicData = project.schematic_data as any;
		const hasCircuitData = schematicData && 
			schematicData.nodes && 
			Array.isArray(schematicData.nodes) &&
			schematicData.nodes.length > 0;

		const circuitStats = {
			nodeCount: hasCircuitData ? schematicData.nodes.length : 0,
			edgeCount: hasCircuitData && schematicData.edges ? schematicData.edges.length : 0,
			hasData: hasCircuitData
		};

		// Component type breakdown if circuit data exists
		let componentBreakdown: Record<string, number> = {};
		if (hasCircuitData) {
			componentBreakdown = schematicData.nodes.reduce((acc: Record<string, number>, node: any) => {
				const type = node.type || 'unknown';
				acc[type] = (acc[type] || 0) + 1;
				return acc;
			}, {});
		}

		return {
			project: {
				id: project.id,
				name: project.name,
				description: project.description || 'No description provided',
				status: project.status as 'active' | 'completed' | 'draft' | 'archived',
				created: formatDate(createdAt),
				lastModified: getTimeAgo(updatedAt),
				components: project.component_count || 0,
				circuitStats,
				componentBreakdown,
				hasCircuitData
			},
			user: {
				id: user.id,
				email: user.email,
				name: user.user_metadata?.name || user.email
			}
		};
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		console.error('Unexpected error in project load:', err);
		throw error(500, 'An unexpected error occurred');
	}
};

export const actions: Actions = {
	delete: async ({ params, locals }) => {
		const { session, user } = await locals.safeGetSession();

		if (!session || !user) {
			throw error(401, 'Authentication required');
		}

		const projectId = params.id;

		try {
			// Verify user owns the project before deleting
			const { data: project, error: projectError } = await locals.supabase
				.from('projects')
				.select('user_id')
				.eq('id', projectId)
				.eq('user_id', user.id)
				.single();

			if (projectError || !project) {
				throw error(404, 'Project not found');
			}

			// Soft delete by updating status
			const { error: deleteError } = await locals.supabase
				.from('projects')
				.update({ status: 'deleted', updated_at: new Date().toISOString() })
				.eq('id', projectId)
				.eq('user_id', user.id);

			if (deleteError) {
				console.error('Error deleting project:', deleteError);
				throw error(500, 'Failed to delete project');
			}

			throw redirect(303, '/projects');
		} catch (err) {
			if (err instanceof Error && 'status' in err) {
				throw err; // Re-throw SvelteKit errors
			}
			console.error('Unexpected error in project delete:', err);
			throw error(500, 'An unexpected error occurred');
		}
	}
};
