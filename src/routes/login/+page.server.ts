import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const error = url.searchParams.get('error');
	return {
		error
	};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase }, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		console.log('[Login] Attempting login for email:', email);

		if (!email || !password) {
			console.log('[Login] Missing email or password');
			return {
				error: 'Email and password are required',
				email
			};
		}

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			console.log('[Login] Supabase auth error:', error.message);
			return {
				error: error.message,
				email
			};
		}

		console.log('[Login] Supabase auth successful, user:', data.user?.id);
		console.log('[Login] Session data:', !!data.session);

		// Ensure the session is properly set in cookies
		if (data.session) {
			console.log('[Login] Setting session in cookies');
			// The supabase client should automatically handle setting cookies,
			// but we can explicitly refresh to ensure the session is stored
			await supabase.auth.refreshSession();
		}

		console.log('[Login] Redirecting to dashboard');
		throw redirect(303, '/dashboard');
	}
};
