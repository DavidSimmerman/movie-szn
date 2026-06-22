// Pure helpers for the /user/<username> profile prefix. Universal (no server deps)
// so both the reroute hook and server code can share them.

const PREFIX = /^\/user\/([^/]+)/;

/** The username from a `/user/<username>/…` path, or null for the owner (no prefix). */
export function viewUsernameFromPath(pathname: string): string | null {
	const m = PREFIX.exec(pathname);
	return m ? decodeURIComponent(m[1]) : null;
}

/** Strip the `/user/<username>` prefix to get the canonical route (always leading-slashed). */
export function stripProfilePrefix(pathname: string): string {
	return pathname.replace(PREFIX, '') || '/';
}

/** Link to `canonical` for a given user — bare path for the owner, prefixed for everyone else. */
export function profileHref(canonical: string, username: string, ownerUsername: string): string {
	return username === ownerUsername ? canonical : `/user/${username}${canonical}`;
}

/**
 * The `/user/<username>` prefix of the current path (or '' on the owner's bare routes).
 * Prepend to internal links so navigating within a profile stays in that profile.
 */
export function profilePrefix(pathname: string): string {
	const m = PREFIX.exec(pathname);
	return m ? `/user/${m[1]}` : '';
}
