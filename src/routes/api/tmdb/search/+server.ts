import { error, json } from '@sveltejs/kit';
import { searchTmdb } from '$server/tmdb';
import { checkRateLimit } from '$server/ratelimit';
import { hashIp } from '$server/visitor';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) return json({ results: [] });

	const ip = (() => {
		try {
			return getClientAddress();
		} catch {
			return null;
		}
	})();

	const rl = await checkRateLimit(`tmdb-search:${hashIp(ip)}`, 60, 'hour');
	if (!rl.allowed) throw error(429, 'too many searches this hour');

	try {
		const results = await searchTmdb(q);
		return json({ results });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'tmdb search failed';
		throw error(502, msg);
	}
};
