import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, validateSession } from '$server/auth';
import { ensureVisitorId } from '$server/visitor';
import '$server/og-schedule';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.visitorId = ensureVisitorId(event.cookies);

	const sid = event.cookies.get(SESSION_COOKIE);
	try {
		event.locals.admin = await validateSession(sid);
	} catch {
		event.locals.admin = false;
	}

	if (!event.locals.admin && sid) {
		event.cookies.delete(SESSION_COOKIE, { path: '/' });
	}

	const { pathname } = event.url;
	const needsAdmin = pathname.startsWith('/admin');
	if (needsAdmin && !event.locals.admin) {
		throw redirect(303, `/login?next=${encodeURIComponent(pathname)}`);
	}

	return resolve(event);
};
