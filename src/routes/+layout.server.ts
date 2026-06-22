import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { listUsers, ownerOf, resolveViewUser } from '$server/users';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const origin = env.ORIGIN || url.origin;
	const users = await listUsers();
	const viewUser = resolveViewUser(users, locals.viewUsername);
	if (locals.viewUsername && !viewUser) throw error(404, 'no such user');

	return { origin, user: locals.user, users, owner: ownerOf(users), viewUser };
};
