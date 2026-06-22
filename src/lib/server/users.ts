import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { users, type User } from './db/schema';

export type PublicUser = Pick<User, 'id' | 'username' | 'name' | 'isAdmin' | 'avatarUrl'>;

const cols = {
	id: users.id,
	username: users.username,
	name: users.name,
	avatarUrl: users.avatarUrl,
	isAdmin: users.isAdmin
};

/** All reviewers, oldest first. The owner (admin) sorts first. */
export async function listUsers(): Promise<PublicUser[]> {
	if (!db) return [];
	return db.select(cols).from(users).orderBy(asc(users.createdAt));
}

export async function getUserByUsername(username: string): Promise<PublicUser | null> {
	if (!db) return null;
	const rows = await db.select(cols).from(users).where(eq(users.username, username)).limit(1);
	return rows[0] ?? null;
}

/** The default profile: the single admin, falling back to the oldest user. */
export function ownerOf(list: PublicUser[]): PublicUser | null {
	return list.find((u) => u.isAdmin) ?? list[0] ?? null;
}

/** Resolve the viewed profile from a parsed username; null username = owner. */
export function resolveViewUser(list: PublicUser[], username: string | null): PublicUser | null {
	if (!username) return ownerOf(list);
	return list.find((u) => u.username === username) ?? null;
}

/** Convenience for endpoints without access to `parent()`: resolve the viewed user. */
export async function getViewUser(username: string | null): Promise<PublicUser | null> {
	return resolveViewUser(await listUsers(), username);
}
