import { json } from '@sveltejs/kit';
import { validateAccessToken } from '$server/oauth';
import { buildLibrary } from '$server/library';
import type { RequestHandler } from './$types';

// Read-only MCP server over the review library. Claude.ai connects here as a
// custom connector; the OAuth dance lives in /authorize, /token and /register.
// One tool by design — the whole library fits in a single response, so paging it
// would only cost round-trips.

const PROTOCOL_VERSION = '2025-03-26';

type Id = string | number | null;

function rpcResult(id: Id, result: unknown) {
	return json({ jsonrpc: '2.0', id, result });
}
function rpcError(id: Id, code: number, message: string) {
	return json({ jsonrpc: '2.0', id, error: { code, message } });
}
function toolResult(id: Id, text: string, isError = false) {
	return rpcResult(id, { content: [{ type: 'text', text }], isError });
}

const GET_LIBRARY_TOOL = {
	name: 'get_library',
	description:
		'Read-only. Dumps the ENTIRE movie & TV review library in one call — every title with its ' +
		'five category ratings (production, acting, storyPlot, intent, daveFactor), the derived ' +
		'combinedScore, the written notes, when it was watched, which "movie season" it was tagged to, ' +
		'and any season awards it won. Also returns the reviewers (with their bios), the season ' +
		"calendar, the curated lists, and the current watchlist. Use it to understand the reviewer's taste — which " +
		'categories they weight, what they rate highly, what they panned — and then recommend films ' +
		'or shows they have NOT already reviewed or queued. Check `titles` and `watchlist` before ' +
		'suggesting anything so you never recommend something already seen or lined up. Read ' +
		'`ratingScale` before interpreting any number. Takes no arguments.',
	inputSchema: { type: 'object', properties: {} }
};

function unauthorized(origin: string) {
	return new Response(JSON.stringify({ error: 'invalid_token' }), {
		status: 401,
		headers: {
			'Content-Type': 'application/json',
			'WWW-Authenticate': `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`
		}
	});
}

async function callGetLibrary(id: Id) {
	try {
		const library = await buildLibrary();
		const reviewCount = library.titles.reduce((n, t) => n + t.reviews.length, 0);
		const summary =
			`${library.titles.length} title${library.titles.length === 1 ? '' : 's'}, ` +
			`${reviewCount} review${reviewCount === 1 ? '' : 's'}, ` +
			`${library.watchlist.length} on the watchlist.`;
		return toolResult(id, `${summary}\n${JSON.stringify(library, null, 2)}`);
	} catch (e) {
		console.error('get_library failed:', e);
		return toolResult(id, 'Could not read the library: an internal error occurred.', true);
	}
}

export const POST: RequestHandler = async ({ request, url }) => {
	const auth = request.headers.get('authorization') ?? '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
	// An unauthenticated request gets a 401 whose WWW-Authenticate points the
	// client at our metadata, kicking off the OAuth flow. A lookup that throws
	// (no database) fails closed the same way.
	const valid = token
		? await validateAccessToken(token).catch((e) => {
				console.error('token validation failed:', e);
				return null;
			})
		: null;
	if (!valid) return unauthorized(url.origin);

	let msg: { id?: Id; method?: string; params?: Record<string, unknown> };
	try {
		msg = await request.json();
	} catch {
		return rpcError(null, -32700, 'Parse error');
	}
	// Batches and scalars aren't supported — answer in JSON-RPC, don't destructure
	// a null into a 500.
	if (typeof msg !== 'object' || msg === null || Array.isArray(msg)) {
		return rpcError(null, -32600, 'Invalid Request');
	}

	const { id, method, params } = msg;

	// Notifications (no id) — e.g. notifications/initialized. Ack with 202.
	if (id === undefined || id === null) return new Response(null, { status: 202 });

	switch (method) {
		case 'initialize': {
			const requested =
				typeof params?.protocolVersion === 'string' ? params.protocolVersion : PROTOCOL_VERSION;
			return rpcResult(id, {
				protocolVersion: requested,
				capabilities: { tools: {} },
				serverInfo: { name: 'movie-szn-mcp', version: '1.0.0' }
			});
		}
		case 'tools/list':
			return rpcResult(id, { tools: [GET_LIBRARY_TOOL] });
		case 'tools/call':
			if (params?.name === 'get_library') return callGetLibrary(id);
			return rpcError(id, -32602, `Unknown tool: ${String(params?.name)}`);
		case 'ping':
			return rpcResult(id, {});
		default:
			return rpcError(id, -32601, `Method not found: ${String(method)}`);
	}
};

// Stateless server — no server-initiated SSE stream.
export const GET: RequestHandler = () => new Response('Method Not Allowed', { status: 405 });
