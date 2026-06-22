import { fail } from '@sveltejs/kit';
import { and, asc, eq, gt, lt, max } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$server/db';
import { movies, watchList } from '$db/schema';
import { upsertMovieFromTmdb } from '$server/movies';
import type { Actions, PageServerLoad } from './$types';

const GAP = 1000;

async function nextPosition(userId: string) {
	const [row] = await db!
		.select({ m: max(watchList.position) })
		.from(watchList)
		.where(eq(watchList.userId, userId));
	return (row?.m ?? 0) + GAP;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!db || !locals.user) return { items: [], candidates: [] };
	const uid = locals.user.id;

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
		.where(eq(watchList.userId, uid))
		.orderBy(asc(watchList.position));

	const onListRaw = await db
		.select({ movieId: watchList.movieId })
		.from(watchList)
		.where(eq(watchList.userId, uid));
	const onList = new Set(onListRaw.map((r) => r.movieId));
	const allMovies = await db
		.select({ id: movies.id, title: movies.title, year: movies.year })
		.from(movies)
		.orderBy(asc(movies.title));
	const available = allMovies.filter((m) => !onList.has(m.id));

	return { items, candidates: available };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const body = await request.formData();
		const parsed = z
			.object({ movieId: z.uuid(), notes: z.string().optional() })
			.safeParse({ movieId: body.get('movieId'), notes: body.get('notes') ?? '' });
		if (!parsed.success) return fail(400);

		const nextPos = await nextPosition(locals.user.id);
		await db
			.insert(watchList)
			.values({
				userId: locals.user.id,
				movieId: parsed.data.movieId,
				position: nextPos,
				notes: parsed.data.notes || null
			})
			.onConflictDoNothing();
		return { ok: true };
	},

	addFromTmdb: async ({ request, locals }) => {
		if (!db) return fail(503, { error: 'database not configured' });
		if (!locals.user) return fail(401);
		const body = await request.formData();
		const parsed = z
			.object({
				tmdbId: z.coerce.number().int().positive(),
				type: z.enum(['movie', 'show']),
				notes: z.string().optional()
			})
			.safeParse({
				tmdbId: body.get('tmdbId'),
				type: body.get('type'),
				notes: body.get('notes') ?? ''
			});
		if (!parsed.success) return fail(400, { error: 'invalid input' });

		let movie;
		try {
			movie = await upsertMovieFromTmdb(parsed.data.tmdbId, parsed.data.type);
		} catch (err) {
			return fail(502, { error: err instanceof Error ? err.message : 'tmdb fetch failed' });
		}

		const nextPos = await nextPosition(locals.user.id);
		await db
			.insert(watchList)
			.values({
				userId: locals.user.id,
				movieId: movie.id,
				position: nextPos,
				notes: parsed.data.notes?.trim() || null
			})
			.onConflictDoNothing();

		return { ok: true };
	},

	remove: async ({ request, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);
		await db
			.delete(watchList)
			.where(and(eq(watchList.id, id), eq(watchList.userId, locals.user.id)));
		return { ok: true };
	},

	reorder: async ({ request, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const uid = locals.user.id;
		const body = await request.formData();
		const idsRaw = body.get('ids');
		if (typeof idsRaw !== 'string') return fail(400, { error: 'missing ids' });

		const ids = idsRaw.split(',').filter(Boolean);
		const parsed = z.array(z.uuid()).min(1).safeParse(ids);
		if (!parsed.success) return fail(400, { error: 'invalid ids' });

		const existing = await db
			.select({ id: watchList.id })
			.from(watchList)
			.where(eq(watchList.userId, uid));
		const existingIds = new Set(existing.map((r) => r.id));
		if (parsed.data.length !== existingIds.size) {
			return fail(400, { error: 'id count mismatch' });
		}
		for (const id of parsed.data) {
			if (!existingIds.has(id)) return fail(400, { error: 'unknown id' });
		}

		await db.transaction(async (tx) => {
			for (let i = 0; i < parsed.data.length; i++) {
				await tx
					.update(watchList)
					.set({ position: (i + 1) * GAP })
					.where(and(eq(watchList.id, parsed.data[i]), eq(watchList.userId, uid)));
			}
		});

		return { ok: true };
	},

	move: async ({ request, locals }) => {
		if (!db) return fail(503);
		if (!locals.user) return fail(401);
		const uid = locals.user.id;
		const body = await request.formData();
		const parsed = z
			.object({
				id: z.uuid(),
				direction: z.enum(['up', 'down'])
			})
			.safeParse({ id: body.get('id'), direction: body.get('direction') });
		if (!parsed.success) return fail(400);

		const current = await db.query.watchList.findFirst({
			where: and(eq(watchList.id, parsed.data.id), eq(watchList.userId, uid)),
			columns: { id: true, position: true }
		});
		if (!current) return fail(404);

		if (parsed.data.direction === 'up') {
			const prev = await db
				.select({ id: watchList.id, position: watchList.position })
				.from(watchList)
				.where(and(eq(watchList.userId, uid), lt(watchList.position, current.position)))
				.orderBy(asc(watchList.position))
				.limit(1);
			const above = prev[prev.length - 1];
			if (!above) return { ok: true };
			await db
				.update(watchList)
				.set({ position: above.position })
				.where(eq(watchList.id, current.id));
			await db
				.update(watchList)
				.set({ position: current.position })
				.where(eq(watchList.id, above.id));
		} else {
			const next = await db
				.select({ id: watchList.id, position: watchList.position })
				.from(watchList)
				.where(and(eq(watchList.userId, uid), gt(watchList.position, current.position)))
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
