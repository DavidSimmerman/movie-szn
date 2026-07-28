import { error, fail } from '@sveltejs/kit';
import { and, asc, desc, eq, gt, lt, max } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$server/db';
import { listItems, lists, movies, reviews } from '$db/schema';
import { toNumber } from '$lib/ratings';
import type { Actions, PageServerLoad } from './$types';

const GAP = 1000;

async function requireList(slug: string, userId: string) {
	const list = await db!.query.lists.findFirst({
		where: and(eq(lists.slug, slug), eq(lists.userId, userId))
	});
	return list ?? null;
}

async function nextPosition(listId: string) {
	const [row] = await db!
		.select({ m: max(listItems.position) })
		.from(listItems)
		.where(eq(listItems.listId, listId));
	return (row?.m ?? 0) + GAP;
}

// Bump the list's updatedAt so its cached OG image regenerates after any change.
function touch(listId: string) {
	return db!.update(lists).set({ updatedAt: new Date() }).where(eq(lists.id, listId));
}

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!db) throw error(503);
	if (!locals.user) throw error(401);
	const list = await requireList(params.slug, locals.user.id);
	if (!list) throw error(404, 'list not found');

	const items = await db
		.select({
			movieId: listItems.movieId,
			position: listItems.position,
			title: movies.title,
			year: movies.year,
			posterUrl: movies.posterUrl,
			combinedScore: reviews.combinedScore
		})
		.from(listItems)
		.innerJoin(movies, eq(movies.id, listItems.movieId))
		.leftJoin(reviews, and(eq(reviews.movieId, movies.id), eq(reviews.userId, list.userId)))
		.where(eq(listItems.listId, list.id))
		.orderBy(
			list.orderMode === 'rating' ? desc(reviews.combinedScore) : asc(listItems.position),
			asc(listItems.position)
		);

	const onList = new Set(items.map((i) => i.movieId));
	const reviewed = await db
		.select({ id: movies.id, title: movies.title, year: movies.year })
		.from(reviews)
		.innerJoin(movies, eq(movies.id, reviews.movieId))
		.where(eq(reviews.userId, list.userId))
		.orderBy(asc(movies.title));

	return {
		list,
		items: items.map((i) => ({
			movieId: i.movieId,
			title: i.title,
			year: i.year,
			posterUrl: i.posterUrl,
			score: i.combinedScore == null ? null : toNumber(i.combinedScore)
		})),
		candidates: reviewed.filter((m) => !onList.has(m.id))
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const list = await requireList(params.slug, locals.user.id);
		if (!list) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({
				name: z.string().trim().min(1).max(120),
				description: z.string().trim().max(500).optional(),
				orderMode: z.enum(['manual', 'rating'])
			})
			.safeParse({
				name: body.get('name'),
				description: body.get('description') || undefined,
				orderMode: body.get('orderMode')
			});
		if (!parsed.success) return fail(400, { error: 'name and order mode are required' });

		await db
			.update(lists)
			.set({
				name: parsed.data.name,
				description: parsed.data.description || null,
				orderMode: parsed.data.orderMode,
				updatedAt: new Date()
			})
			.where(eq(lists.id, list.id));
		return { ok: true };
	},

	addMovie: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const list = await requireList(params.slug, locals.user.id);
		if (!list) return fail(404);
		const body = await request.formData();
		const parsed = z.object({ movieId: z.uuid() }).safeParse({ movieId: body.get('movieId') });
		if (!parsed.success) return fail(400, { error: 'pick a movie' });

		const reviewed = await db.query.reviews.findFirst({
			where: and(eq(reviews.movieId, parsed.data.movieId), eq(reviews.userId, list.userId)),
			columns: { id: true }
		});
		if (!reviewed) return fail(400, { error: 'you can only add movies you have reviewed' });

		await db
			.insert(listItems)
			.values({
				listId: list.id,
				movieId: parsed.data.movieId,
				position: await nextPosition(list.id)
			})
			.onConflictDoNothing();
		await touch(list.id);
		return { ok: true };
	},

	remove: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const list = await requireList(params.slug, locals.user.id);
		if (!list) return fail(404);
		const body = await request.formData();
		const movieId = body.get('movieId');
		if (typeof movieId !== 'string') return fail(400);
		await db
			.delete(listItems)
			.where(and(eq(listItems.listId, list.id), eq(listItems.movieId, movieId)));
		await touch(list.id);
		return { ok: true };
	},

	reorder: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const list = await requireList(params.slug, locals.user.id);
		if (!list) return fail(404);
		const body = await request.formData();
		const idsRaw = body.get('ids');
		if (typeof idsRaw !== 'string') return fail(400, { error: 'missing ids' });

		const parsed = z.array(z.uuid()).min(1).safeParse(idsRaw.split(',').filter(Boolean));
		if (!parsed.success) return fail(400, { error: 'invalid ids' });

		const existing = await db
			.select({ movieId: listItems.movieId })
			.from(listItems)
			.where(eq(listItems.listId, list.id));
		const existingIds = new Set(existing.map((r) => r.movieId));
		if (parsed.data.length !== existingIds.size) return fail(400, { error: 'id count mismatch' });
		for (const id of parsed.data) {
			if (!existingIds.has(id)) return fail(400, { error: 'unknown id' });
		}

		await db.transaction(async (tx) => {
			for (let i = 0; i < parsed.data.length; i++) {
				await tx
					.update(listItems)
					.set({ position: (i + 1) * GAP })
					.where(and(eq(listItems.listId, list.id), eq(listItems.movieId, parsed.data[i])));
			}
		});
		await touch(list.id);
		return { ok: true };
	},

	move: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const list = await requireList(params.slug, locals.user.id);
		if (!list) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({ movieId: z.uuid(), direction: z.enum(['up', 'down']) })
			.safeParse({ movieId: body.get('movieId'), direction: body.get('direction') });
		if (!parsed.success) return fail(400);

		const current = await db.query.listItems.findFirst({
			where: and(eq(listItems.listId, list.id), eq(listItems.movieId, parsed.data.movieId)),
			columns: { movieId: true, position: true }
		});
		if (!current) return fail(404);

		const neighbor = await db
			.select({ movieId: listItems.movieId, position: listItems.position })
			.from(listItems)
			.where(
				and(
					eq(listItems.listId, list.id),
					parsed.data.direction === 'up'
						? lt(listItems.position, current.position)
						: gt(listItems.position, current.position)
				)
			)
			.orderBy(parsed.data.direction === 'up' ? desc(listItems.position) : asc(listItems.position))
			.limit(1);
		const swap = neighbor[0];
		if (!swap) return { ok: true };

		await db.transaction(async (tx) => {
			await tx
				.update(listItems)
				.set({ position: swap.position })
				.where(and(eq(listItems.listId, list.id), eq(listItems.movieId, current.movieId)));
			await tx
				.update(listItems)
				.set({ position: current.position })
				.where(and(eq(listItems.listId, list.id), eq(listItems.movieId, swap.movieId)));
		});
		await touch(list.id);
		return { ok: true };
	}
};
