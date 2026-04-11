import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, destroySession } from '$server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	const sid = cookies.get(SESSION_COOKIE);
	try {
		await destroySession(sid);
	} catch {
		// swallow — we're logging out anyway
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
	throw redirect(303, '/');
};
