import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, validateSession } from '$server/auth';
import { ensureVisitorId } from '$server/visitor';
import { stripProfilePrefix, viewUsernameFromPath } from '$lib/profile';
import '$server/og-schedule';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.visitorId = ensureVisitorId(event.cookies);
	event.locals.viewUsername = viewUsernameFromPath(event.url.pathname);

	const sid = event.cookies.get(SESSION_COOKIE);
	try {
		event.locals.user = await validateSession(sid);
	} catch {
		event.locals.user = null;
	}

	if (!event.locals.user && sid) {
		event.cookies.delete(SESSION_COOKIE, { path: '/' });
	}

	// Guard the resolved route, not the raw path: a `/user/<name>/admin/…` URL is
	// rerouted to `/admin/…`, so check the stripped path or the prefix slips past auth.
	const routePath = stripProfilePrefix(event.url.pathname);
	if (routePath.startsWith('/admin') && !event.locals.user) {
		throw redirect(303, `/login?next=${encodeURIComponent(routePath)}`);
	}

	return resolve(event);
};
