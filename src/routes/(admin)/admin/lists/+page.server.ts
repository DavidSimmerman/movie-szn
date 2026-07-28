import { fail } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$server/db';
import { listItems, lists } from '$db/schema';
import { slugify } from '$server/slug';
import type { Actions, PageServerLoad } from './$types';

const createSchema = z.object({
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(500).optional(),
	orderMode: z.enum(['manual', 'rating'])
});

export const load: PageServerLoad = async ({ locals }) => {
	if (!db || !locals.user) return { lists: [] };
	const rows = await db
		.select({
			id: lists.id,
			slug: lists.slug,
			name: lists.name,
			orderMode: lists.orderMode,
			movieCount: sql<number>`count(${listItems.movieId})::int`
		})
		.from(lists)
		.leftJoin(listItems, eq(listItems.listId, lists.id))
		.where(eq(lists.userId, locals.user.id))
		.groupBy(lists.id)
		.orderBy(desc(lists.createdAt));
	return { lists: rows };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const body = await request.formData();
		const parsed = createSchema.safeParse({
			name: body.get('name'),
			description: body.get('description') || undefined,
			orderMode: body.get('orderMode')
		});
		if (!parsed.success) return fail(400, { error: 'name and order mode are required' });

		const slug = slugify(parsed.data.name);
		if (!slug) return fail(400, { error: 'name must contain letters or numbers' });

		try {
			await db.insert(lists).values({
				userId: locals.user.id,
				slug,
				name: parsed.data.name,
				description: parsed.data.description || null,
				orderMode: parsed.data.orderMode
			});
			return { ok: true };
		} catch {
			return fail(400, { error: 'you already have a list with that name' });
		}
	},

	remove: async ({ request, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);
		await db.delete(lists).where(and(eq(lists.id, id), eq(lists.userId, locals.user.id)));
		return { ok: true };
	}
};
