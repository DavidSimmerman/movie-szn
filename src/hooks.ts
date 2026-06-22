import type { Reroute } from '@sveltejs/kit';
import { stripProfilePrefix } from '$lib/profile';

// `/user/<username>/reviews` routes to the same page as `/reviews`; the original
// URL is preserved in `event.url`, where the server reads the username back out.
export const reroute: Reroute = ({ url }) => {
	if (!url.pathname.startsWith('/user/')) return;
	const route = stripProfilePrefix(url.pathname);
	// /admin is never profile-scoped — don't reroute it (let it 404 instead of
	// resolving an admin route the server-side guard wouldn't recognise).
	if (route === '/admin' || route.startsWith('/admin/')) return;
	return route;
};
