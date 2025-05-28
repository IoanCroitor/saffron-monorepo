import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;
		const name = formData.get('name') as string;

		if (!email || !password || !name || !confirmPassword) {
			return {
				error: 'All fields are required',
				email,
				name
			};
		}

		if (password !== confirmPassword) {
			return {
				error: 'Passwords do not match',
				email,
				name
			};
		}

		if (password.length < 6) {
			return {
				error: 'Password must be at least 6 characters',
				email,
				name
			};
		}

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					name: name
				}
			}
		});

		if (error) {
			return {
				error: error.message,
				email,
				name
			};
		}

		if (data.user) {
			// Profile will be created automatically by database trigger
			
			// If email confirmation is enabled, redirect to a confirmation page
			if (!data.session) {
				return {
					success: true,
					message: 'Please check your email to confirm your account'
				};
			}

			// If user is confirmed immediately, redirect to dashboard
			throw redirect(303, '/dashboard');
		}

		return {
			error: 'Signup failed',
			email,
			name
		};
	}
};
