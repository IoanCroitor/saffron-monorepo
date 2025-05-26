import { writable } from 'svelte/store';
import { createSupabaseBrowserClient } from '$lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
	id: string;
	email: string;
	name: string;
}

export const currentUser = writable<User | null>(null);
export const isLoggedIn = writable<boolean>(false);
export const sessionStore = writable<Session | null>(null);

// Initialize Supabase client
const supabase = createSupabaseBrowserClient();

// Authentication functions using Supabase
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return { success: false, error: error.message };
		}

		if (data.user && data.session) {
			// Get user profile from profiles table
			const { data: profile, error: profileError } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', data.user.id)
				.single();

			const user: User = {
				id: data.user.id,
				email: data.user.email || '',
				name: profile?.name || data.user.user_metadata?.name || 'User'
			};

			currentUser.set(user);
			isLoggedIn.set(true);
			sessionStore.set(data.session);

			return { success: true, user };
		}

		return { success: false, error: 'Login failed' };
	} catch (error) {
		return { success: false, error: 'Login failed' };
	}
}

export async function signup(email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: User }> {
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
			// Create profile in profiles table
			const { error: profileError } = await supabase
				.from('profiles')
				.insert({
					id: data.user.id,
					email: data.user.email || '',
					name: name
				});

			if (profileError) {
				console.error('Profile creation error:', profileError);
			}

			// If user is confirmed immediately (email confirmation disabled)
			if (data.session) {
				const user: User = {
					id: data.user.id,
					email: data.user.email || '',
					name: name
				};

				currentUser.set(user);
				isLoggedIn.set(true);
				sessionStore.set(data.session);

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
		// Use fetch to call the server logout endpoint
		const response = await fetch('/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		if (response.redirected) {
			// Follow the redirect if the server redirects after logout
			window.location.href = response.url;
		} else {
			// Clear local state immediately
			currentUser.set(null);
			isLoggedIn.set(false);
			sessionStore.set(null);
		}
	} catch (error) {
		console.error('Logout error:', error);
		// Fallback to client-side logout
		await supabase.auth.signOut();
		currentUser.set(null);
		isLoggedIn.set(false);
		sessionStore.set(null);
	}
}

// Initialize auth state from session (using secure user data)
export async function initializeAuth(initialSession: Session | null, initialUser: SupabaseUser | null) {
	if (initialSession && initialUser) {
		sessionStore.set(initialSession);
		
		// Get profile data using the authenticated user
		try {
			const { data: profile } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', initialUser.id)
				.single();

			const user: User = {
				id: initialUser.id,
				email: initialUser.email || '',
				name: profile?.name || initialUser.user_metadata?.name || 'User'
			};
			
			currentUser.set(user);
			isLoggedIn.set(true);
		} catch (error) {
			console.error('Error getting profile:', error);
			// Fallback to basic user data
			const user: User = {
				id: initialUser.id,
				email: initialUser.email || '',
				name: initialUser.user_metadata?.name || 'User'
			};
			
			currentUser.set(user);
			isLoggedIn.set(true);
		}
	} else {
		currentUser.set(null);
		isLoggedIn.set(false);
		sessionStore.set(null);
	}
}

// Initialize auth state from the server-provided data
export function initializeAuthFromServer(session: Session | null, user: SupabaseUser | null) {
	if (typeof window !== 'undefined') {
		initializeAuth(session, user);
	}
}

// Listen for auth state changes
if (typeof window !== 'undefined') {
	supabase.auth.onAuthStateChange(async (event, session) => {
		if (event === 'SIGNED_IN' && session) {
			// Use getUser() for authenticated user data instead of session.user
			const { data: { user }, error } = await supabase.auth.getUser();
			if (user && !error) {
				await initializeAuth(session, user);
			}
		} else if (event === 'SIGNED_OUT') {
			currentUser.set(null);
			isLoggedIn.set(false);
			sessionStore.set(null);
		} else if (event === 'TOKEN_REFRESHED' && session) {
			// Also refresh user data when token is refreshed
			const { data: { user }, error } = await supabase.auth.getUser();
			if (user && !error) {
				await initializeAuth(session, user);
			}
		}
	});
}