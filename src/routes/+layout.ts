import type { LayoutLoad } from './$types';
import { createSupabaseBrowserClient } from '$lib/supabase';
import { browser } from '$app/environment';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	depends('supabase:auth');

	const supabase = createSupabaseBrowserClient();

	// Use the secure session and user data from the server
	// Don't get session from client-side as it's insecure
	return {
		...data, // This includes the secure session and user from server
		supabase,
	};
};
