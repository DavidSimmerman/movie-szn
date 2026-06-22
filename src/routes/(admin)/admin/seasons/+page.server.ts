import { fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$server/db';
import { seasons } from '$db/schema';
import { defaultSeasonBounds, defaultSeasonName, defaultSeasonSlug } from '$server/seasons';
import type { Actions, PageServerLoad } from './$types';

const createSchema = z.object({
	year: z.coerce.number().int().min(1900).max(2100),
	name: z.string().nullish(),
	startsAt: z.string().nullish(),
	endsAt: z.string().nullish()
});

export const load: PageServerLoad = async ({ locals }) => {
	if (!db || !locals.user) return { seasons: [], nextYear: new Date().getFullYear() };
	const rows = await db
		.select()
		.from(seasons)
		.where(eq(seasons.userId, locals.user.id))
		.orderBy(desc(seasons.startsAt));
	const nextYear = new Date().getFullYear();
	return { seasons: rows, nextYear };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const body = await request.formData();
		const parsed = createSchema.safeParse({
			year: body.get('year'),
			name: body.get('name'),
			startsAt: body.get('startsAt'),
			endsAt: body.get('endsAt')
		});
		if (!parsed.success) return fail(400, { error: 'invalid input' });

		const bounds = defaultSeasonBounds(parsed.data.year);
		try {
			await db.insert(seasons).values({
				userId: locals.user.id,
				slug: defaultSeasonSlug(parsed.data.year),
				name: parsed.data.name || defaultSeasonName(parsed.data.year),
				startsAt: parsed.data.startsAt || bounds.startsAt,
				endsAt: parsed.data.endsAt || bounds.endsAt
			});
			return { ok: true };
		} catch (err) {
			return fail(400, {
				error: err instanceof Error ? err.message : 'failed to create season'
			});
		}
	},

	remove: async ({ request, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);
		await db.delete(seasons).where(and(eq(seasons.id, id), eq(seasons.userId, locals.user.id)));
		return { ok: true };
	}
};
