import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	const origin = env.ORIGIN || url.origin;
	return { admin: locals.admin, origin };
};
