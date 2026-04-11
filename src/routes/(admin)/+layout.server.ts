import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.admin) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}
	return { admin: true };
};
