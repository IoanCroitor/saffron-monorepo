import type { Handle } from '@sveltejs/kit';
// Paraglide middleware disabled for faster development
// import { paraglideMiddleware } from '$lib/paraglide/server';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
