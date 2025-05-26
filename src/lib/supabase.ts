import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { type Database } from './types/database.types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Singleton pattern for browser client to prevent multiple instances
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createSupabaseLoadClient = (fetch: typeof globalThis.fetch) => {
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { fetch },
		cookies: {
			getAll: () => {
				// This will be handled by SvelteKit hooks
				return [];
			},
			setAll: (cookiesToSet) => {
				// This will be handled by SvelteKit hooks
			}
		}
	});
};

export const createSupabaseBrowserClient = () => {
	if (isBrowser()) {
		// Return existing client if already created, otherwise create new one
		if (!browserClient) {
			browserClient = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
		}
		return browserClient;
	}
	// For SSR, create a basic server client without cookies (will be handled by hooks)
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => [],
			setAll: () => {}
		}
	});
};
