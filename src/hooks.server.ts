import { json, redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, validateSession } from '$server/auth';
import { ensureVisitorId } from '$server/visitor';
import { stripProfilePrefix, viewUsernameFromPath } from '$lib/profile';
import '$server/og-schedule';

// Endpoints in the MCP connector flow. Claude.ai calls them from its own origin,
// so they need permissive CORS to complete discovery, registration and exchange.
// Matched exactly, so a future route nested under one doesn't silently inherit it.
const CORS_PATHS = new Set(['/mcp', '/token', '/register', '/authorize']);

function needsCors(pathname: string): boolean {
	return CORS_PATHS.has(pathname) || pathname.startsWith('/.well-known/');
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Must stay in step with SvelteKit's is_form_content_type (kit/src/utils/http.js)
// — these are the types a cross-site form can send without a preflight.
function isFormContentType(request: Request): boolean {
	const ct = (request.headers.get('content-type') ?? '').split(';', 1)[0].trim().toLowerCase();
	return (
		ct === 'application/x-www-form-urlencoded' ||
		ct === 'multipart/form-data' ||
		ct === 'text/plain' ||
		ct === 'application/x-sveltekit-formdata'
	);
}

function applyCors(response: Response, origin: string | null): Response {
	response.headers.set('Access-Control-Allow-Origin', origin ?? '*');
	response.headers.append('Vary', 'Origin');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	response.headers.set(
		'Access-Control-Allow-Headers',
		'authorization, content-type, mcp-protocol-version, mcp-session-id'
	);
	// So a browser MCP client can read the OAuth challenge on the 401 from /mcp
	// and start discovery — non-safelisted response headers are hidden otherwise.
	response.headers.set('Access-Control-Expose-Headers', 'WWW-Authenticate');
	response.headers.set('Access-Control-Max-Age', '86400');
	return response;
}

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, origin } = event.url;
	const reqOrigin = event.request.headers.get('origin');

	// OAuth 2.0 Protected Resource Metadata (RFC 9728) — names the authorization
	// server guarding /mcp (which is us).
	if (pathname === '/.well-known/oauth-protected-resource') {
		return applyCors(
			json({ resource: `${origin}/mcp`, authorization_servers: [origin] }),
			reqOrigin
		);
	}

	// OAuth 2.0 Authorization Server Metadata (RFC 8414).
	if (pathname === '/.well-known/oauth-authorization-server') {
		return applyCors(
			json({
				issuer: origin,
				authorization_endpoint: `${origin}/authorize`,
				token_endpoint: `${origin}/token`,
				registration_endpoint: `${origin}/register`,
				response_types_supported: ['code'],
				response_modes_supported: ['query'],
				grant_types_supported: ['authorization_code', 'refresh_token'],
				code_challenge_methods_supported: ['S256'],
				token_endpoint_auth_methods_supported: ['none']
			}),
			reqOrigin
		);
	}

	if (event.request.method === 'OPTIONS' && needsCors(pathname)) {
		return applyCors(new Response(null, { status: 204 }), reqOrigin);
	}

	// SvelteKit's own CSRF check is switched off in svelte.config (it would reject
	// the OAuth token exchange); this is the same check, minus /token. Browsers
	// always send Origin on a form POST, so a missing one is treated as cross-site.
	// The exemption reads the raw request path — event.url.pathname is rewritten
	// by the framework (data suffixes, the x-sveltekit-pathname header) before
	// `handle` runs, so keying off it would let the exemption be steered.
	const rawPath = new URL(event.request.url).pathname.replace(/\/+$/, '');
	if (
		rawPath !== '/token' &&
		UNSAFE_METHODS.has(event.request.method) &&
		isFormContentType(event.request) &&
		reqOrigin !== origin
	) {
		return new Response('Cross-site form submission forbidden', { status: 403 });
	}

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

	const response = await resolve(event);
	return needsCors(pathname) ? applyCors(response, reqOrigin) : response;
};
