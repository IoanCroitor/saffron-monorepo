import type { Actions, PageServerLoad } from './$types';
import { error, redirect, fail } from '@sveltejs/kit';
import { z } from 'zod';

const projectSchema = z.object({
	name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
	description: z.string().max(500, 'Description must be less than 500 characters').optional()
});

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Authentication required');
	}

	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.user_metadata?.name || user.email
		}
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();

		if (!session || !user) {
			throw error(401, 'Authentication required');
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;

		// Validate input
		const validation = projectSchema.safeParse({ name, description });
		if (!validation.success) {
			return fail(400, {
				errors: validation.error.flatten().fieldErrors,
				values: { name, description }
			});
		}

		try {
			// Create new project with minimal initial data
			const { data: project, error: projectError } = await locals.supabase
				.from('projects')
				.insert([{
					user_id: user.id,
					name: validation.data.name,
					description: validation.data.description || null,
					status: 'draft',
					component_count: 0,
					schematic_data: {
						nodes: [],
						edges: [],
						version: '1.0',
						created_at: new Date().toISOString()
					}
				}])
				.select('id')
				.single();

			if (projectError) {
				console.error('Error creating project:', projectError);
				return fail(500, {
					error: 'Failed to create project. Please try again.',
					values: { name, description }
				});
			}

			// Project created successfully, redirect to projects page
			throw redirect(303, '/projects');
		} catch (err) {
			// If it's a redirect, re-throw it
			if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
				throw err;
			}
			// Log and handle other errors
			console.error('Unexpected error creating project:', err);
			return fail(500, {
				error: 'An unexpected error occurred. Please try again.',
				values: { name, description }
			});
		}
	}
};
