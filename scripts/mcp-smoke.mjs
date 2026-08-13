#!/usr/bin/env node
// End-to-end check of the MCP connector: dynamic registration → consent →
// PKCE token exchange → tools/call, plus the paths that must be refused.
// Usage: node scripts/mcp-smoke.mjs [baseUrl]   (needs MCP_AUTH_PASSWORD)

import { createHash, randomBytes } from 'node:crypto';

const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '');
const password = process.env.MCP_AUTH_PASSWORD;
if (!password) {
	console.error('MCP_AUTH_PASSWORD is not set');
	process.exit(1);
}

const REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback';
let failures = 0;

function check(label, ok, detail = '') {
	console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
	if (!ok) failures++;
}

async function rpc(token, method, params) {
	const res = await fetch(`${base}/mcp`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {})
		},
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
	});
	return { res, body: res.status === 200 ? await res.json() : null };
}

// 1. Unauthenticated /mcp must challenge, not answer.
{
	const { res } = await rpc(null, 'tools/list');
	check(
		'unauthenticated /mcp → 401 + WWW-Authenticate',
		res.status === 401 && !!res.headers.get('www-authenticate'),
		`status ${res.status}`
	);
}

// 2. Discovery metadata.
{
	const prm = await (await fetch(`${base}/.well-known/oauth-protected-resource`)).json();
	const asm = await (await fetch(`${base}/.well-known/oauth-authorization-server`)).json();
	check('protected-resource metadata points at /mcp', prm.resource === `${base}/mcp`);
	check(
		'authorization-server metadata advertises PKCE',
		asm.token_endpoint === `${base}/token` && asm.code_challenge_methods_supported.includes('S256')
	);
}

// 3. Dynamic client registration.
const reg = await (
	await fetch(`${base}/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ client_name: 'smoke test', redirect_uris: [REDIRECT_URI] })
	})
).json();
check('dynamic registration issues a client_id', typeof reg.client_id === 'string');

{
	const res = await fetch(`${base}/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ redirect_uris: ['http://evil.test/cb'] })
	});
	check('non-https redirect_uri is refused', res.status === 400, `status ${res.status}`);
}

// 4. Consent screen + PKCE authorization.
const verifier = randomBytes(32).toString('base64url');
const challenge = createHash('sha256').update(verifier).digest('base64url');
const authQuery = new URLSearchParams({
	client_id: reg.client_id,
	redirect_uri: REDIRECT_URI,
	response_type: 'code',
	code_challenge: challenge,
	code_challenge_method: 'S256',
	state: 'xyz'
});

{
	const res = await fetch(`${base}/authorize?${authQuery}`);
	const html = await res.text();
	check('consent screen renders', res.status === 200);
	// The redirect target is the only trustworthy signal on this page — an
	// attacker can register any client_name they like.
	check('consent screen names the redirect target', html.includes('https://claude.ai'));
	check('consent screen is not cacheable', /no-store/.test(res.headers.get('cache-control') ?? ''));
}

// Posted the way a browser would: same-origin form submission carries Origin.
async function submitConsent(pw) {
	return fetch(`${base}/authorize?${authQuery}&/authorize`, {
		method: 'POST',
		redirect: 'manual',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'text/html',
			Origin: base
		},
		body: new URLSearchParams({
			client_id: reg.client_id,
			redirect_uri: REDIRECT_URI,
			code_challenge: challenge,
			code_challenge_method: 'S256',
			state: 'xyz',
			password: pw
		})
	});
}

{
	const res = await submitConsent('wrong-password');
	check('wrong consent password is rejected', res.status === 401, `status ${res.status}`);
	// Re-rendering must keep the OAuth request intact, or a mistyped password
	// strands the user on a 400 instead of the form.
	const html = await res.text();
	check('a rejected password re-renders the consent form', html.includes('Incorrect password'));
}

// A malformed request must NOT bounce to the client's self-registered URI —
// that would make the site an open redirect for anyone who can call /register.
{
	const bad = new URLSearchParams(authQuery);
	bad.set('response_type', 'token');
	const res = await fetch(`${base}/authorize?${bad}`, { redirect: 'manual' });
	check(
		'a bad response_type is rendered, not redirected',
		res.status === 400,
		`status ${res.status}`
	);
}
{
	const bad = new URLSearchParams(authQuery);
	bad.delete('code_challenge');
	const res = await fetch(`${base}/authorize?${bad}`, { redirect: 'manual' });
	check(
		'a missing PKCE challenge is rendered, not redirected',
		res.status === 400,
		`status ${res.status}`
	);
}

const consent = await submitConsent(password);
const code = new URL(consent.headers.get('location') ?? `${base}/`).searchParams.get('code');
check('correct password redirects back with a code', !!code, `status ${consent.status}`);

{
	const res = await fetch(`${base}/suggest`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://evil.test' },
		body: 'title=csrf'
	});
	check(
		'cross-site form POST is still blocked elsewhere',
		res.status === 403,
		`status ${res.status}`
	);
}

// 5. Token exchange — deliberately sent with NO Origin header, the way a
// non-browser OAuth client does it. /token is the one path exempt from the check.
async function exchange(codeVerifier, authCode = code) {
	const res = await fetch(`${base}/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code: authCode,
			redirect_uri: REDIRECT_URI,
			client_id: reg.client_id,
			code_verifier: codeVerifier
		})
	});
	return { res, body: await res.json() };
}

{
	const { body } = await exchange(randomBytes(32).toString('base64url'));
	check('bad PKCE verifier is rejected', body.error === 'invalid_grant', body.error_description);
}

// The failed attempt consumed the code, so mint a fresh one for the happy path.
const consent2 = await submitConsent(password);
const code2 = new URL(consent2.headers.get('location') ?? `${base}/`).searchParams.get('code');
const { body: tokens } = await exchange(verifier, code2);
check('valid exchange returns an access token', typeof tokens.access_token === 'string');

{
	const { body } = await exchange(verifier, code2);
	check('replayed code is rejected', body.error === 'invalid_grant');
}

// 6. The MCP surface itself.
{
	const { body } = await rpc(tokens.access_token, 'initialize', { protocolVersion: '2025-03-26' });
	check('initialize', body?.result?.serverInfo?.name === 'movie-szn-mcp');
}
{
	const { body } = await rpc(tokens.access_token, 'tools/list');
	check('tools/list exposes get_library', body?.result?.tools?.[0]?.name === 'get_library');
}
{
	const { body } = await rpc(tokens.access_token, 'tools/call', { name: 'get_library' });
	const text = body?.result?.content?.[0]?.text ?? '';
	const payload = JSON.parse(text.slice(text.indexOf('\n') + 1));
	check('get_library returns titles', Array.isArray(payload.titles) && payload.titles.length > 0);
	check(
		'each title carries all five category ratings',
		payload.titles.every((t) =>
			t.reviews.every((r) =>
				['production', 'acting', 'storyPlot', 'intent', 'daveFactor'].every(
					(k) => typeof r[k] === 'number'
				)
			)
		)
	);
	check('watchlist is included', Array.isArray(payload.watchlist));
	check(
		'curated lists carry their titles',
		Array.isArray(payload.lists) && payload.lists.every((l) => Array.isArray(l.titles))
	);
	check(
		'awards are attached to titles',
		payload.titles.every((t) => Array.isArray(t.awards))
	);
	console.log(
		`  ${payload.titles.length} titles · ${payload.watchlist.length} queued · ` +
			`${payload.titles.reduce((n, t) => n + t.awards.length, 0)} awards · ` +
			`${Math.round(text.length / 1024)} KB payload`
	);
}
{
	const { body } = await rpc(tokens.access_token, 'tools/call', { name: 'delete_everything' });
	check('unknown tool is refused', body?.error?.code === -32602);
}
{
	const res = await fetch(`${base}/mcp`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${tokens.access_token}`
		},
		body: 'null'
	});
	const body = await res.json();
	check('a non-object JSON-RPC body is answered, not crashed', body?.error?.code === -32600);
}
{
	const res = await fetch(`${base}/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: '%%%not-a-form'
	});
	const body = await res.json();
	check('a malformed /token body returns an OAuth error', typeof body.error === 'string');
}

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
