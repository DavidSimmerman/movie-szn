import { env } from '$env/dynamic/private';
import { verify } from '@node-rs/argon2';
import { eq, lt } from 'drizzle-orm';
import { db } from './db';
import { sessions } from './db/schema';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = 'sid';

function requireDb() {
	if (!db) throw new Error('database not configured');
	return db;
}

function randomToken(bytes = 32): string {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	return Buffer.from(buf).toString('base64url');
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
	const hash = env.ADMIN_PASSWORD_HASH;
	if (!hash) return false;
	try {
		return await verify(hash, password);
	} catch {
		return false;
	}
}

export async function createSession(): Promise<{ id: string; expiresAt: Date }> {
	const id = randomToken();
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	await requireDb().insert(sessions).values({ id, expiresAt });
	return { id, expiresAt };
}

export async function validateSession(id: string | undefined): Promise<boolean> {
	if (!id) return false;
	const d = requireDb();
	const row = await d.query.sessions.findFirst({ where: eq(sessions.id, id) });
	if (!row) return false;
	if (row.expiresAt.getTime() < Date.now()) {
		await d.delete(sessions).where(eq(sessions.id, id));
		return false;
	}
	return true;
}

export async function destroySession(id: string | undefined): Promise<void> {
	if (!id) return;
	await requireDb().delete(sessions).where(eq(sessions.id, id));
}

export async function purgeExpiredSessions(): Promise<number> {
	const result = await requireDb().delete(sessions).where(lt(sessions.expiresAt, new Date()));
	return result.count ?? 0;
}
