// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { type SupabaseClient, type Session, type User } from '@supabase/supabase-js';
import { type Database } from '$lib/types/database.types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
		}
		interface PageData {
			session: Session | null;
			user: User | null;
			supabase: SupabaseClient<Database>;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
