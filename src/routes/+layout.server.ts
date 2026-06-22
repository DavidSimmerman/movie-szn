import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { listUsers, ownerOf, resolveViewUser } from '$server/users';
import { viewUsernameFromPath } from '$lib/profile';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const origin = env.ORIGIN || url.origin;
	// Parse the profile from the path here (not locals) so this load *depends on*
	// url.pathname — switching /reviews ↔ /user/<name>/reviews reroutes to the same
	// route, and without a url dependency SvelteKit wouldn't re-run on the switch.
	const viewUsername = viewUsernameFromPath(url.pathname);
	const users = await listUsers();
	const viewUser = resolveViewUser(users, viewUsername);
	if (viewUsername && !viewUser) throw error(404, 'no such user');

	return { origin, user: locals.user, users, owner: ownerOf(users), viewUser };
};
