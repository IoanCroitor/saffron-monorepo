import { redirect } from '@sveltejs/kit';


export const load = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/login');
	}

	return {
		user,
		session
	};
};
