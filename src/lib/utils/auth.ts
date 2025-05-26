import { isLoggedIn } from '$lib/stores/auth.js';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export function requireAuth() {
	const loggedIn = get(isLoggedIn);
	if (!loggedIn) {
		throw redirect(302, '/login');
	}
}
