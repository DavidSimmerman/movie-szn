import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$server/db';
import { users } from '$db/schema';
import { hashPassword } from '$server/auth';
import type { Actions, PageServerLoad } from './$types';

const createSchema = z.object({
	name: z.string().trim().min(1).max(40),
	username: z
		.string()
		.trim()
		.min(2)
		.max(30)
		.regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and dashes only'),
	password: z.string().min(8, 'at least 8 characters').max(200)
});

/** Empty → null (clear); valid http(s) URL → the URL; anything else → false (reject). */
function parseAvatar(value: FormDataEntryValue | null): string | null | false {
	const s = (value ?? '').toString().trim();
	if (!s) return null;
	return /^https?:\/\/.+/i.test(s) && s.length <= 2048 ? s : false;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user?.isAdmin) throw error(403, 'admins only');
	if (!db) return { users: [] };
	const rows = await db
		.select({
			id: users.id,
			username: users.username,
			name: users.name,
			avatarUrl: users.avatarUrl,
			isAdmin: users.isAdmin,
			createdAt: users.createdAt
		})
		.from(users)
		.orderBy(asc(users.createdAt));
	return { users: rows };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'admins only' });
		if (!db) return fail(503, { error: 'database not configured' });
		const body = await request.formData();
		const parsed = createSchema.safeParse({
			name: body.get('name'),
			username: body.get('username'),
			password: body.get('password')
		});
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'invalid input' });
		}
		const avatarUrl = parseAvatar(body.get('avatarUrl'));
		if (avatarUrl === false) return fail(400, { error: 'avatar must be an http(s) URL' });

		const passwordHash = await hashPassword(parsed.data.password);
		try {
			await db.insert(users).values({
				name: parsed.data.name,
				username: parsed.data.username,
				avatarUrl,
				passwordHash,
				isAdmin: false
			});
		} catch {
			return fail(409, { error: 'that username is already taken' });
		}
		return { ok: true };
	},

	setAvatar: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'admins only' });
		if (!db) return fail(503);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);
		const avatarUrl = parseAvatar(body.get('avatarUrl'));
		if (avatarUrl === false) return fail(400, { error: 'avatar must be an http(s) URL' });
		await db.update(users).set({ avatarUrl }).where(eq(users.id, id));
		return { ok: true };
	},

	remove: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'admins only' });
		if (!db) return fail(503);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);

		const target = await db.query.users.findFirst({
			where: eq(users.id, id),
			columns: { isAdmin: true }
		});
		if (!target) return fail(404, { error: 'no such user' });
		// Admin accounts (the owner) can't be deleted here — only friend accounts.
		if (target.isAdmin) return fail(400, { error: 'cannot delete an admin account' });

		await db.delete(users).where(eq(users.id, id));
		return { ok: true };
	}
};
