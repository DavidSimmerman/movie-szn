import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$server/db';
import { userAvatars, users } from '$db/schema';
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

const profileSchema = z.object({
	userId: z.string().uuid(),
	bio: z.string().trim().max(1000).optional()
});

/** Round to the nearest 0.5 and clamp into [0, 5]; NaN → 0. */
function parseStars(value: FormDataEntryValue | undefined): number {
	const n = Number((value ?? '').toString());
	if (Number.isNaN(n)) return 0;
	return Math.min(5, Math.max(0, Math.round(n * 2) / 2));
}

/** Zip the repeated traitLabel/traitStars fields into validated traits, dropping blank labels. */
function parseTraits(body: FormData): { label: string; stars: number }[] {
	const labels = body.getAll('traitLabel');
	const stars = body.getAll('traitStars');
	const traits: { label: string; stars: number }[] = [];
	for (let i = 0; i < labels.length; i++) {
		const label = (labels[i] ?? '').toString().trim().slice(0, 40);
		if (!label) continue;
		traits.push({ label, stars: parseStars(stars[i]) });
	}
	return traits.slice(0, 3);
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/** Empty → null (clear); valid http(s) URL → the URL; anything else → false (reject). */
function parseAvatar(value: FormDataEntryValue | null): string | null | false {
	const s = (value ?? '').toString().trim();
	if (!s) return null;
	return /^https?:\/\/.+/i.test(s) && s.length <= 2048 ? s : false;
}

type AvatarInput = { error: string } | { url: string | null } | { data: Buffer; type: string };

/** An uploaded file wins; otherwise fall back to the avatar URL field. */
async function readAvatar(body: FormData): Promise<AvatarInput> {
	const file = body.get('avatarFile');
	if (file instanceof File && file.size > 0) {
		if (!ALLOWED_TYPES.has(file.type)) return { error: 'image must be JPEG, PNG, WebP, or GIF' };
		if (file.size > MAX_AVATAR_BYTES) return { error: 'image must be under 2 MB' };
		return { data: Buffer.from(await file.arrayBuffer()), type: file.type };
	}
	const url = parseAvatar(body.get('avatarUrl'));
	if (url === false) return { error: 'avatar must be an http(s) URL' };
	return { url };
}

async function storeAvatar(userId: string, data: Buffer, type: string) {
	await db!
		.insert(userAvatars)
		.values({ userId, data, contentType: type })
		.onConflictDoUpdate({
			target: userAvatars.userId,
			set: { data, contentType: type, updatedAt: new Date() }
		});
}

/** Cache-busting URL for an uploaded avatar (the /avatar/<username> endpoint). */
const uploadedUrl = (username: string) => `/avatar/${username}?v=${Date.now()}`;

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
			bio: users.bio,
			traits: users.traits,
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
		const avatar = await readAvatar(body);
		if ('error' in avatar) return fail(400, { error: avatar.error });

		const passwordHash = await hashPassword(parsed.data.password);
		let userId: string;
		try {
			const [row] = await db
				.insert(users)
				.values({
					name: parsed.data.name,
					username: parsed.data.username,
					avatarUrl: 'url' in avatar ? avatar.url : null,
					passwordHash,
					isAdmin: false
				})
				.returning({ id: users.id });
			userId = row.id;
		} catch {
			return fail(409, { error: 'that username is already taken' });
		}

		if ('data' in avatar) {
			await storeAvatar(userId, avatar.data, avatar.type);
			await db
				.update(users)
				.set({ avatarUrl: uploadedUrl(parsed.data.username) })
				.where(eq(users.id, userId));
		}
		return { ok: true };
	},

	updateProfile: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'admins only' });
		if (!db) return fail(503, { error: 'database not configured' });
		const body = await request.formData();
		const parsed = profileSchema.safeParse({
			userId: body.get('userId'),
			bio: body.get('bio') ?? undefined
		});
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'invalid input' });
		}
		const traits = parseTraits(body);
		await db
			.update(users)
			.set({ bio: parsed.data.bio || null, traits })
			.where(eq(users.id, parsed.data.userId));
		return { ok: true };
	},

	setAvatar: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'admins only' });
		if (!db) return fail(503);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);
		const target = await db.query.users.findFirst({
			where: eq(users.id, id),
			columns: { username: true }
		});
		if (!target) return fail(404, { error: 'no such user' });

		const avatar = await readAvatar(body);
		if ('error' in avatar) return fail(400, { error: avatar.error });

		if ('data' in avatar) {
			await storeAvatar(id, avatar.data, avatar.type);
			await db
				.update(users)
				.set({ avatarUrl: uploadedUrl(target.username) })
				.where(eq(users.id, id));
		} else if (avatar.url) {
			// only set when a URL was actually given — an empty submit leaves it as-is
			await db.update(users).set({ avatarUrl: avatar.url }).where(eq(users.id, id));
		}
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
