import { and, eq, gt, lt } from 'drizzle-orm';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { db } from '$server/db';
import { oauthClients, oauthCodes, oauthTokens } from '$db/schema';

const ACCESS_TTL_SECONDS = 60 * 60;
const CODE_TTL_SECONDS = 5 * 60;
// A refresh token rotates forever unless something stops it, so an abandoned or
// leaked connector would keep read access indefinitely. Each token must be used
// within 90 days of being issued: an active connector rotates and stays alive, an
// idle one dies. Reconnecting is a 10-second re-consent.
// ponytail: inactivity expiry, not an absolute grant lifetime — that would need a
// `granted_at` column carried across rotations. Add it if this ever has real users.
const REFRESH_IDLE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// The drizzle client is null when DATABASE_URL is unset (local dev without a DB).
// OAuth can't work without storage, so callers get a clear failure instead of a
// null-deref deep inside a query.
function requireDb() {
	if (!db) throw new Error('DATABASE_URL is not set');
	return db;
}

function base64url(buf: Buffer): string {
	return buf.toString('base64url');
}

export function sha256(input: string): string {
	return createHash('sha256').update(input).digest('hex');
}

export function randomToken(bytes = 32): string {
	return base64url(randomBytes(bytes));
}

function safeEqualStr(a: string, b: string): boolean {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	if (ab.length !== bb.length) return false;
	return timingSafeEqual(ab, bb);
}

export function verifyPkce(verifier: string, challenge: string, method = 'S256'): boolean {
	if (method === 'plain') return safeEqualStr(verifier, challenge);
	if (method !== 'S256') return false;
	return safeEqualStr(base64url(createHash('sha256').update(verifier).digest()), challenge);
}

/** Without MCP_AUTH_PASSWORD the authorization server refuses to mint codes. */
export function consentConfigured(): boolean {
	return !!env.MCP_AUTH_PASSWORD;
}

export function verifyConsentPassword(provided: string): boolean {
	const expected = env.MCP_AUTH_PASSWORD;
	if (!expected) return false;
	// Compare fixed-length digests so the timing-safe check can't leak the
	// password length (raw strings differ in length and short-circuit).
	const a = createHash('sha256').update(provided).digest();
	const b = createHash('sha256').update(expected).digest();
	return timingSafeEqual(a, b);
}

export async function registerClient(input: {
	clientName?: string | null;
	redirectUris: string[];
}): Promise<{ clientId: string }> {
	const clientId = `mcp_${randomToken(16)}`;
	await requireDb()
		.insert(oauthClients)
		.values({
			clientId,
			clientName: input.clientName ?? null,
			redirectUris: input.redirectUris
		});
	return { clientId };
}

export async function getClient(clientId: string) {
	const [row] = await requireDb()
		.select()
		.from(oauthClients)
		.where(eq(oauthClients.clientId, clientId));
	return row ?? null;
}

export async function createAuthCode(input: {
	clientId: string;
	redirectUri: string;
	codeChallenge: string;
	codeChallengeMethod: string;
	scope?: string | null;
	resource?: string | null;
}): Promise<string> {
	const code = randomToken(32);
	// Opportunistic hygiene: nothing else ever deletes expired codes, and
	// oauth_codes_expires_idx serves exactly this predicate.
	await requireDb().delete(oauthCodes).where(lt(oauthCodes.expiresAt, new Date()));
	await requireDb()
		.insert(oauthCodes)
		.values({
			code: sha256(code),
			clientId: input.clientId,
			redirectUri: input.redirectUri,
			codeChallenge: input.codeChallenge,
			codeChallengeMethod: input.codeChallengeMethod,
			scope: input.scope ?? null,
			resource: input.resource ?? null,
			expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000)
		});
	return code;
}

/** Atomically consume a code. Replayed or expired codes return null. */
export async function consumeAuthCode(code: string) {
	const [row] = await requireDb()
		.update(oauthCodes)
		.set({ consumed: true })
		.where(
			and(
				eq(oauthCodes.code, sha256(code)),
				eq(oauthCodes.consumed, false),
				gt(oauthCodes.expiresAt, new Date())
			)
		)
		.returning();
	return row ?? null;
}

export type IssuedTokens = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
};

export async function issueTokens(input: {
	clientId: string;
	scope?: string | null;
	resource?: string | null;
}): Promise<IssuedTokens> {
	const accessToken = randomToken(32);
	const refreshToken = randomToken(32);
	await requireDb()
		.insert(oauthTokens)
		.values({
			accessTokenHash: sha256(accessToken),
			refreshTokenHash: sha256(refreshToken),
			clientId: input.clientId,
			scope: input.scope ?? null,
			resource: input.resource ?? null,
			accessExpiresAt: new Date(Date.now() + ACCESS_TTL_SECONDS * 1000)
		});
	return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SECONDS };
}

export async function validateAccessToken(accessToken: string) {
	const [row] = await requireDb()
		.select()
		.from(oauthTokens)
		.where(
			and(
				eq(oauthTokens.accessTokenHash, sha256(accessToken)),
				eq(oauthTokens.revoked, false),
				gt(oauthTokens.accessExpiresAt, new Date())
			)
		);
	return row ?? null;
}

/** Rotate a refresh token: revoke the old row, issue a fresh pair. */
export async function rotateRefreshToken(refreshToken: string): Promise<IssuedTokens | null> {
	return requireDb().transaction(async (tx) => {
		const [old] = await tx
			.update(oauthTokens)
			.set({ revoked: true })
			.where(
				and(
					eq(oauthTokens.refreshTokenHash, sha256(refreshToken)),
					eq(oauthTokens.revoked, false),
					gt(oauthTokens.createdAt, new Date(Date.now() - REFRESH_IDLE_TTL_MS))
				)
			)
			.returning();
		if (!old) return null;

		const accessToken = randomToken(32);
		const newRefresh = randomToken(32);
		await tx.insert(oauthTokens).values({
			accessTokenHash: sha256(accessToken),
			refreshTokenHash: sha256(newRefresh),
			clientId: old.clientId,
			scope: old.scope,
			resource: old.resource,
			accessExpiresAt: new Date(Date.now() + ACCESS_TTL_SECONDS * 1000)
		});
		return { accessToken, refreshToken: newRefresh, expiresIn: ACCESS_TTL_SECONDS };
	});
}
