import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Authentication required');
	}

	try {
		// Load user's projects with proper ordering and status filtering
		const { data: projects, error: projectsError } = await locals.supabase
			.from('projects')
			.select(`
				id,
				name,
				description,
				component_count,
				status,
				created_at,
				updated_at,
				schematic_data
			`)
			.eq('user_id', user.id)
			.neq('status', 'deleted')
			.order('updated_at', { ascending: false });

		if (projectsError) {
			console.error('Error loading projects:', projectsError);
			throw error(500, 'Failed to load projects');
		}

		// Process projects to add computed fields
		const processedProjects = projects.map((project: any) => {
			// Calculate time since last modified
			const now = new Date();
			const updatedAt = new Date(project.updated_at);
			const diffInMinutes = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60));
			
			let lastModified: string;
			if (diffInMinutes < 1) {
				lastModified = 'Just now';
			} else if (diffInMinutes < 60) {
				lastModified = `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
			} else if (diffInMinutes < 1440) { // Less than 24 hours
				const hours = Math.floor(diffInMinutes / 60);
				lastModified = `${hours} hour${hours === 1 ? '' : 's'} ago`;
			} else {
				const days = Math.floor(diffInMinutes / 1440);
				lastModified = `${days} day${days === 1 ? '' : 's'} ago`;
			}

			// Determine if project has actual circuit data
			const hasCircuitData = project.schematic_data && 
				typeof project.schematic_data === 'object' &&
				(project.schematic_data as any).nodes &&
				Array.isArray((project.schematic_data as any).nodes) &&
				(project.schematic_data as any).nodes.length > 0;

			return {
				id: project.id,
				name: project.name,
				description: project.description || 'No description provided',
				lastModified,
				components: project.component_count || 0,
				status: project.status as 'active' | 'completed' | 'draft' | 'archived',
				hasCircuitData,
				createdAt: project.created_at,
				updatedAt: project.updated_at
			};
		});

		return {
			projects: processedProjects,
			user: {
				id: user.id,
				email: user.email,
				name: user.user_metadata?.name || user.email
			}
		};
	} catch (err) {
		console.error('Unexpected error in projects load:', err);
		throw error(500, 'An unexpected error occurred');
	}
};
