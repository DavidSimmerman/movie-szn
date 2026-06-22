import { hash, verify } from '@node-rs/argon2';
import { eq, lt } from 'drizzle-orm';
import { db } from './db';
import { sessions, users } from './db/schema';
import type { PublicUser } from './users';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = 'sid';

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
	return hash(password, ARGON2_OPTS);
}

// Verified against when a username is unknown so login timing doesn't leak which
// usernames exist (argon2id hash of a throwaway string).
const DUMMY_HASH =
	'$argon2id$v=19$m=19456,t=2,p=1$7R5MPKoV47tu6EXFhoapCw$Tt16XZ1yvNmW5OR3vdRnL0IQL7j0bZyuY8T4iwy3TnU';

function requireDb() {
	if (!db) throw new Error('database not configured');
	return db;
}

function randomToken(bytes = 32): string {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	return Buffer.from(buf).toString('base64url');
}

/** Returns the user on a correct username+password, else null. */
export async function authenticate(username: string, password: string): Promise<PublicUser | null> {
	const user = await requireDb().query.users.findFirst({ where: eq(users.username, username) });
	const hash = user?.passwordHash ?? DUMMY_HASH;
	const ok = await verify(hash, password).catch(() => false);
	if (!ok || !user) return null;
	return { id: user.id, username: user.username, name: user.name, isAdmin: user.isAdmin };
}

export async function createSession(userId: string): Promise<{ id: string; expiresAt: Date }> {
	const id = randomToken();
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	await requireDb().insert(sessions).values({ id, userId, expiresAt });
	return { id, expiresAt };
}

/** Returns the logged-in user for a session id, or null (expired sessions are cleaned up). */
export async function validateSession(id: string | undefined): Promise<PublicUser | null> {
	if (!id) return null;
	const d = requireDb();
	const rows = await d
		.select({
			expiresAt: sessions.expiresAt,
			id: users.id,
			username: users.username,
			name: users.name,
			isAdmin: users.isAdmin
		})
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(eq(sessions.id, id))
		.limit(1);
	const row = rows[0];
	if (!row) return null;
	if (row.expiresAt.getTime() < Date.now()) {
		await d.delete(sessions).where(eq(sessions.id, id));
		return null;
	}
	return { id: row.id, username: row.username, name: row.name, isAdmin: row.isAdmin };
}

export async function destroySession(id: string | undefined): Promise<void> {
	if (!id) return;
	await requireDb().delete(sessions).where(eq(sessions.id, id));
}

export async function purgeExpiredSessions(): Promise<number> {
	const result = await requireDb().delete(sessions).where(lt(sessions.expiresAt, new Date()));
	return result.count ?? 0;
}
