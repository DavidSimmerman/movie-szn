import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createHash } from 'node:crypto';

export const VISITOR_COOKIE = 'vid';
const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 365;

export function ensureVisitorId(cookies: Cookies): string {
	let vid = cookies.get(VISITOR_COOKIE);
	if (!vid) {
		const buf = new Uint8Array(16);
		crypto.getRandomValues(buf);
		vid = Buffer.from(buf).toString('base64url');
		cookies.set(VISITOR_COOKIE, vid, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: VISITOR_TTL_SECONDS
		});
	}
	return vid;
}

export function hashIp(ip: string | null): string {
	return createHash('sha256')
		.update(ip ?? 'unknown')
		.digest('hex')
		.slice(0, 32);
}

/**
 * Voter hash combines IP and the visitor cookie, salted with AUTH_SECRET.
 * We store only the hash — never raw IPs.
 */
export function voterHash(ip: string | null, visitorId: string): string {
	const secret = env.AUTH_SECRET ?? 'dev-secret-please-change';
	return createHash('sha256')
		.update(`${hashIp(ip)}:${visitorId}:${secret}`)
		.digest('hex');
}
