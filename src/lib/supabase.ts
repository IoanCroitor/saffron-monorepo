import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { type Database } from './types/database.types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

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
		return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	}
	return supabase;
};
