import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase }, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return {
				error: 'Email and password are required',
				email
			};
		}

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return {
				error: error.message,
				email
			};
		}

		// Ensure the session is properly set in cookies
		if (data.session) {
			// The supabase client should automatically handle setting cookies,
			// but we can explicitly refresh to ensure the session is stored
			await supabase.auth.refreshSession();
		}

		throw redirect(303, '/dashboard');
	}
};
