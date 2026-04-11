import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.admin = false;
	event.locals.visitorId = event.cookies.get('vid') ?? '';
	return resolve(event);
};
