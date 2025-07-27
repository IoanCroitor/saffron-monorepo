import { createSupabaseBrowserClient } from '$lib/supabase';

export interface User {
	id: string;
	email: string;
	name: string;
}

// Initialize Supabase client
const supabase = createSupabaseBrowserClient();

// Authentication functions using Supabase (for client-side operations only)
export async function login(
	email: string,
	password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
	try {
		console.log('[auth.ts] Attempting login for email:', email);
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			console.log('[auth.ts] Login error:', error.message);
			return { success: false, error: error.message };
		}

		console.log('[auth.ts] Login successful, data:', !!data.user, !!data.session);

		if (data.user && data.session) {
			console.log('[auth.ts] Fetching profile for user:', data.user.id);
			// Get user profile from profiles table
			const { data: profile, error: profileError } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', data.user.id)
				.single();

			if (profileError) {
				console.log('[auth.ts] Profile fetch error:', profileError.message);
			} else {
				console.log('[auth.ts] Profile fetched:', profile);
			}

			const user: User = {
				id: data.user.id,
				email: data.user.email || '',
				name: profile?.name || data.user.user_metadata?.name || 'User'
			};

			console.log('[auth.ts] Login successful:', user);
			return { success: true, user };
		}

		console.log('[auth.ts] Login failed - missing user or session');
		return { success: false, error: 'Login failed' };
	} catch (error) {
		console.log('[auth.ts] Login exception:', error);
		return { success: false, error: 'Login failed' };
	}
}

export async function signup(
	email: string,
	password: string,
	name: string
): Promise<{ success: boolean; error?: string; user?: User }> {
	try {
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
			return { success: false, error: error.message };
		}

		if (data.user) {
			// Profile will be created automatically by database trigger

			// If user is confirmed immediately (email confirmation disabled)
			if (data.session) {
				const user: User = {
					id: data.user.id,
					email: data.user.email || '',
					name: name
				};

				return { success: true, user };
			}

			// If email confirmation is required
			return { success: true, error: 'Please check your email to confirm your account' };
		}

		return { success: false, error: 'Signup failed' };
	} catch (error) {
		return { success: false, error: 'Signup failed' };
	}
}

// For server-side logout, we'll use a form submission
export async function logout(): Promise<void> {
	try {
		console.log('Starting logout process');

		// Use fetch to call the server logout endpoint
		const response = await fetch('/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});

		if (response.redirected) {
			// Follow the redirect if the server redirects after logout
			window.location.href = response.url;
		}
	} catch (error) {
		console.error('Logout error:', error);
		// Fallback to client-side logout
		await supabase.auth.signOut();
	}
}
