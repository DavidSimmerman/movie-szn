import { json, error } from '@sveltejs/kit';
import { registerClient } from '$server/oauth';
import { checkRateLimit } from '$server/ratelimit';
import { hashIp } from '$server/visitor';
import type { RequestHandler } from './$types';

// RFC 6749 §3.1.2: redirect URIs are absolute and fragment-free. Plain http is
// only allowed for loopback (a local MCP client), never for a remote host.
function isValidRedirectUri(u: string): boolean {
	if (typeof u !== 'string' || u.length > 512) return false;
	try {
		const url = new URL(u);
		if (url.hash) return false;
		if (url.protocol === 'https:') return true;
		return (
			url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
		);
	} catch {
		return false;
	}
}

// OAuth 2.0 Dynamic Client Registration (RFC 7591). Claude.ai self-registers here
// before the auth-code flow. Public client, no secret — PKCE is the proof.
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	// Registration is unauthenticated by design, so cap it — a client row per
	// request is otherwise free storage for anyone who finds the endpoint.
	const ip = (() => {
		try {
			return getClientAddress();
		} catch {
			return null;
		}
	})();
	const rl = await checkRateLimit(`oauth-register:${hashIp(ip)}`, 10, 'hour');
	if (!rl.allowed) throw error(429, 'too many registration attempts, try again later');

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'invalid JSON');
	}

	const redirectUris = body.redirect_uris;
	if (
		!Array.isArray(redirectUris) ||
		redirectUris.length === 0 ||
		redirectUris.length > 5 ||
		!redirectUris.every(isValidRedirectUri)
	) {
		throw error(
			400,
			'redirect_uris must be 1–5 absolute https (or loopback) URLs without a fragment'
		);
	}

	// Shown on the consent screen as an unverified claim — cap it so it can't
	// crowd out the redirect target the user is meant to read.
	const clientName = typeof body.client_name === 'string' ? body.client_name.slice(0, 60) : null;
	const { clientId } = await registerClient({ clientName, redirectUris: redirectUris as string[] });

	return json(
		{
			client_id: clientId,
			client_name: clientName ?? undefined,
			redirect_uris: redirectUris,
			token_endpoint_auth_method: 'none',
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code'],
			client_id_issued_at: Math.floor(Date.now() / 1000)
		},
		{ status: 201 }
	);
};
