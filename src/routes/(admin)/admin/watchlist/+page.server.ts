import { fail } from '@sveltejs/kit';
import { and, asc, eq, gt, lt, max } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$server/db';
import { movies, watchList } from '$db/schema';
import type { Actions, PageServerLoad } from './$types';

const GAP = 1000;

export const load: PageServerLoad = async () => {
	if (!db) return { items: [], candidates: [] };

	const items = await db
		.select({
			id: watchList.id,
			movieId: watchList.movieId,
			position: watchList.position,
			notes: watchList.notes,
			title: movies.title,
			year: movies.year,
			posterUrl: movies.posterUrl
		})
		.from(watchList)
		.innerJoin(movies, eq(movies.id, watchList.movieId))
		.orderBy(asc(watchList.position));

	const candidates = await db
		.select({
			id: movies.id,
			title: movies.title,
			year: movies.year
		})
		.from(movies)
		.leftJoin(watchList, eq(watchList.movieId, movies.id))
		.where(eq(watchList.movieId, movies.id))
		.orderBy(asc(movies.title));

	// Simpler: just fetch movies NOT already on the list
	const onListRaw = await db.select({ movieId: watchList.movieId }).from(watchList);
	const onList = new Set(onListRaw.map((r) => r.movieId));
	const allMovies = await db
		.select({ id: movies.id, title: movies.title, year: movies.year })
		.from(movies)
		.orderBy(asc(movies.title));
	const available = allMovies.filter((m) => !onList.has(m.id));

	return { items, candidates: available };
};

export const actions: Actions = {
	add: async ({ request }) => {
		if (!db) return fail(503);
		const body = await request.formData();
		const parsed = z
			.object({ movieId: z.uuid(), notes: z.string().optional() })
			.safeParse({ movieId: body.get('movieId'), notes: body.get('notes') ?? '' });
		if (!parsed.success) return fail(400);

		const [maxRow] = await db.select({ m: max(watchList.position) }).from(watchList);
		const nextPos = (maxRow?.m ?? 0) + GAP;
		await db
			.insert(watchList)
			.values({
				movieId: parsed.data.movieId,
				position: nextPos,
				notes: parsed.data.notes || null
			})
			.onConflictDoNothing();
		return { ok: true };
	},

	remove: async ({ request }) => {
		if (!db) return fail(503);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);
		await db.delete(watchList).where(eq(watchList.id, id));
		return { ok: true };
	},

	move: async ({ request }) => {
		if (!db) return fail(503);
		const body = await request.formData();
		const parsed = z
			.object({
				id: z.uuid(),
				direction: z.enum(['up', 'down'])
			})
			.safeParse({ id: body.get('id'), direction: body.get('direction') });
		if (!parsed.success) return fail(400);

		const current = await db.query.watchList.findFirst({
			where: eq(watchList.id, parsed.data.id),
			columns: { id: true, position: true }
		});
		if (!current) return fail(404);

		if (parsed.data.direction === 'up') {
			const prev = await db
				.select({ id: watchList.id, position: watchList.position })
				.from(watchList)
				.where(lt(watchList.position, current.position))
				.orderBy(asc(watchList.position))
				.limit(1);
			const above = prev[prev.length - 1];
			if (!above) return { ok: true };
			// swap
			await db
				.update(watchList)
				.set({ position: above.position })
				.where(eq(watchList.id, current.id));
			await db
				.update(watchList)
				.set({ position: current.position })
				.where(and(eq(watchList.id, above.id)));
		} else {
			const next = await db
				.select({ id: watchList.id, position: watchList.position })
				.from(watchList)
				.where(gt(watchList.position, current.position))
				.orderBy(asc(watchList.position))
				.limit(1);
			const below = next[0];
			if (!below) return { ok: true };
			await db
				.update(watchList)
				.set({ position: below.position })
				.where(eq(watchList.id, current.id));
			await db
				.update(watchList)
				.set({ position: current.position })
				.where(eq(watchList.id, below.id));
		}
		return { ok: true };
	}
};
