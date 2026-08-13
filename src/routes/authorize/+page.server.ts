import { error, fail, redirect } from '@sveltejs/kit';
import { consentConfigured, createAuthCode, getClient, verifyConsentPassword } from '$server/oauth';
import { checkRateLimit } from '$server/ratelimit';
import { hashIp } from '$server/visitor';
import type { Actions, PageServerLoad } from './$types';

const CLAUDE_ORIGIN = 'https://claude.ai';

// Query values that get persisted with the code. Anyone can reach this page, so
// cap them rather than storing whatever was sent.
const cap = (v: string) => v.slice(0, 512);

type OAuthParams = {
	clientId: string;
	redirectUri: string;
	codeChallenge: string;
	codeChallengeMethod: string;
	state: string;
	scope: string;
	resource: string;
};

function readParams(url: URL): OAuthParams {
	return {
		clientId: url.searchParams.get('client_id') ?? '',
		redirectUri: url.searchParams.get('redirect_uri') ?? '',
		codeChallenge: url.searchParams.get('code_challenge') ?? '',
		codeChallengeMethod: url.searchParams.get('code_challenge_method') ?? 'S256',
		state: cap(url.searchParams.get('state') ?? ''),
		scope: cap(url.searchParams.get('scope') ?? ''),
		resource: cap(url.searchParams.get('resource') ?? '')
	};
}

// Bounce an OAuth error back to the client. Registration is open, so a
// registered redirect_uri proves nothing about who owns it — only ever redirect
// AFTER the user has seen the consent screen and acted on it (i.e. deny).
// Malformed requests are rendered here instead, so this can't be used as an open
// redirect. Claude always sends response_type=code with an S256 challenge, so a
// legitimate client never sees the difference.
function errorRedirect(
	redirectUri: string,
	state: string,
	code: string,
	description: string
): never {
	const u = new URL(redirectUri);
	u.searchParams.set('error', code);
	if (description) u.searchParams.set('error_description', description);
	if (state) u.searchParams.set('state', state);
	redirect(303, u.toString());
}

// Throws a render-able error (NOT a redirect) when the target can't be trusted.
async function validateClient(clientId: string, redirectUri: string): Promise<void> {
	if (!clientId) throw error(400, 'missing client_id');
	const client = await getClient(clientId);
	if (!client) throw error(400, 'unknown client_id');
	if (!redirectUri || !client.redirectUris.includes(redirectUri)) {
		throw error(400, 'redirect_uri does not match a registered URI for this client');
	}
}

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	// The page carries an in-flight authorization request; nothing may cache it.
	setHeaders({ 'Cache-Control': 'no-store' });

	const params = readParams(url);
	const responseType = url.searchParams.get('response_type');

	await validateClient(params.clientId, params.redirectUri);

	if (!consentConfigured()) {
		throw error(503, 'Authorization is not configured (MCP_AUTH_PASSWORD unset).');
	}

	if (responseType !== 'code') throw error(400, 'unsupported response_type — only code');
	if (!params.codeChallenge || params.codeChallengeMethod !== 'S256') {
		throw error(400, 'a PKCE S256 code_challenge is required');
	}

	// Registration is open to anyone, so client_name is an unverified claim and the
	// redirect target is the only thing that says where the code actually goes.
	// Both are surfaced on the consent screen — see +page.svelte.
	return {
		clientName: (await getClient(params.clientId))?.clientName?.slice(0, 60) ?? null,
		redirectOrigin: new URL(params.redirectUri).origin,
		expectedOrigin: CLAUDE_ORIGIN,
		// The form posts to `?/authorize`, which would drop these query params —
		// carry them so `load` can re-render the page with a form error.
		search: url.search,
		params
	};
};

export const actions: Actions = {
	authorize: async ({ request, getClientAddress }) => {
		// MCP_AUTH_PASSWORD is the only secret guarding the library — don't let it
		// be guessed at machine speed.
		const ip = (() => {
			try {
				return getClientAddress();
			} catch {
				return null;
			}
		})();
		const rl = await checkRateLimit(`oauth-consent:${hashIp(ip)}`, 10, 'hour');
		if (!rl.allowed) {
			return fail(429, { error: 'Too many attempts. Try again later.' });
		}

		const form = await request.formData();
		const params: OAuthParams = {
			clientId: String(form.get('client_id') ?? ''),
			redirectUri: String(form.get('redirect_uri') ?? ''),
			codeChallenge: String(form.get('code_challenge') ?? ''),
			codeChallengeMethod: String(form.get('code_challenge_method') ?? 'S256'),
			state: cap(String(form.get('state') ?? '')),
			scope: cap(String(form.get('scope') ?? '')),
			resource: cap(String(form.get('resource') ?? ''))
		};
		const password = String(form.get('password') ?? '');

		// Re-validate against the DB — never trust the hidden fields alone.
		await validateClient(params.clientId, params.redirectUri);
		if (!params.codeChallenge || params.codeChallengeMethod !== 'S256') {
			throw error(400, 'a PKCE S256 code_challenge is required');
		}
		if (!verifyConsentPassword(password)) {
			return fail(401, { error: 'Incorrect password.' });
		}

		const code = await createAuthCode({
			clientId: params.clientId,
			redirectUri: params.redirectUri,
			codeChallenge: params.codeChallenge,
			codeChallengeMethod: params.codeChallengeMethod,
			scope: params.scope || null,
			resource: params.resource || null
		});

		const u = new URL(params.redirectUri);
		u.searchParams.set('code', code);
		if (params.state) u.searchParams.set('state', params.state);
		redirect(303, u.toString());
	},

	deny: async ({ request }) => {
		const form = await request.formData();
		const redirectUri = String(form.get('redirect_uri') ?? '');
		const clientId = String(form.get('client_id') ?? '');
		const state = String(form.get('state') ?? '');
		await validateClient(clientId, redirectUri);
		errorRedirect(redirectUri, state, 'access_denied', 'user denied the request');
	}
};
