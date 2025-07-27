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

// Flag to prevent duplicate initializations
let isInitializing = false;
let hasInitialized = false;

// Initialize Supabase client
const supabase = createSupabaseBrowserClient();

// Authentication functions using Supabase
export async function login(
	email: string,
	password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
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
			console.log('[auth.ts] Set currentUser:', user);
			isLoggedIn.set(true);
			console.log('[auth.ts] Set isLoggedIn: true');
			sessionStore.set(data.session);
			console.log('[auth.ts] Set sessionStore:', data.session);

			return { success: true, user };
		}

		return { success: false, error: 'Login failed' };
	} catch (error) {
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
		} else {
			// Clear local state immediately
			console.log('Clearing local auth state');
			currentUser.set(null);
			isLoggedIn.set(false);
			sessionStore.set(null);
			hasInitialized = true; // Keep as initialized but logged out
		}
	} catch (error) {
		console.error('Logout error:', error);
		// Fallback to client-side logout
		await supabase.auth.signOut();
		currentUser.set(null);
		isLoggedIn.set(false);
		sessionStore.set(null);
		hasInitialized = true;
	}
}

// Initialize auth state from session (using secure user data)
export async function initializeAuth(
	initialSession: Session | null,
	initialUser: SupabaseUser | null
) {
	// Prevent duplicate initialization
	if (isInitializing) {
		console.log('Auth initialization already in progress, skipping...');
		return;
	}

	isInitializing = true;

	console.log('Initializing auth with:', {
		hasSession: !!initialSession,
		hasUser: !!initialUser,
		userId: initialUser?.id,
		hasInitialized
	});

	try {
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

				console.log('Setting user as logged in:', user);
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

				console.log('Setting user as logged in (fallback):', user);
				currentUser.set(user);
				isLoggedIn.set(true);
			}
		} else {
			console.log('Setting user as logged out');
			currentUser.set(null);
			isLoggedIn.set(false);
			sessionStore.set(null);
		}

		hasInitialized = true;
	} finally {
		isInitializing = false;
	}
}

// Initialize auth state from the server-provided data
export function initializeAuthFromServer(session: Session | null, user: SupabaseUser | null) {
	if (typeof window !== 'undefined') {
		initializeAuth(session, user);
	}
}

// Force refresh auth state (useful for debugging)
export function forceRefreshAuth() {
	console.log('Forcing auth state refresh');
	hasInitialized = false;
	isInitializing = false;
}

// Listen for auth state changes
if (typeof window !== 'undefined') {
	supabase.auth.onAuthStateChange(async (event, session) => {
		console.log('Auth state change:', {
			event,
			hasSession: !!session,
			hasInitialized,
			timestamp: new Date().toISOString()
		});

		// Only handle auth changes if we've completed initial server-side initialization
		// This prevents conflicts between server and client state
		if (!hasInitialized) {
			console.log(
				'Skipping auth state change - not yet initialized from server',
				'| [auth.ts] at',
				new Date().toISOString()
			);
			return;
		}

		if (event === 'SIGNED_IN' && session) {
			// Use getUser() for authenticated user data instead of session.user
			const {
				data: { user },
				error
			} = await supabase.auth.getUser();
			if (user && !error) {
				// Reset the initialization flag to allow this update
				hasInitialized = false;
				await initializeAuth(session, user);
			}
		} else if (event === 'SIGNED_OUT') {
			console.log('Handling sign out event');
			currentUser.set(null);
			isLoggedIn.set(false);
			sessionStore.set(null);
			hasInitialized = true; // Keep as initialized but logged out
		} else if (event === 'TOKEN_REFRESHED' && session) {
			// Also refresh user data when token is refreshed
			const {
				data: { user },
				error
			} = await supabase.auth.getUser();
			if (user && !error) {
				// Reset the initialization flag to allow this update
				hasInitialized = false;
				await initializeAuth(session, user);
			}
		}
	});
}
