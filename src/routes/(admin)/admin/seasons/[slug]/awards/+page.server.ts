import { error, fail } from '@sveltejs/kit';
import { and, asc, desc, eq, gt, inArray, lt, max } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$server/db';
import { awardCategories, awardWinners, movies, movieSeasons, reviews, seasons } from '$db/schema';
import type { Actions, PageServerLoad } from './$types';

const GAP = 1000;

const rankSchema = z.enum(['first', 'second', 'third']);

async function nextCategoryOrder(seasonId: string) {
	const [row] = await db!
		.select({ m: max(awardCategories.sortOrder) })
		.from(awardCategories)
		.where(eq(awardCategories.seasonId, seasonId));
	return (row?.m ?? 0) + GAP;
}

async function nextHonorableOrder(categoryId: string) {
	const [row] = await db!
		.select({ m: max(awardWinners.sortOrder) })
		.from(awardWinners)
		.where(and(eq(awardWinners.categoryId, categoryId), eq(awardWinners.rank, 'honorable')));
	return (row?.m ?? 0) + GAP;
}

async function reviewEligible(reviewId: string, seasonId: string, userId: string) {
	const rows = await db!
		.select({ id: reviews.id })
		.from(reviews)
		.innerJoin(
			movieSeasons,
			and(eq(movieSeasons.movieId, reviews.movieId), eq(movieSeasons.seasonId, seasonId))
		)
		.where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
		.limit(1);
	return rows.length > 0;
}

async function loadSeason(slug: string, userId: string | undefined) {
	if (!userId) return undefined;
	return db!.query.seasons.findFirst({
		where: and(eq(seasons.slug, slug), eq(seasons.userId, userId))
	});
}

async function ownsCategory(categoryId: string, seasonId: string) {
	const row = await db!.query.awardCategories.findFirst({
		where: and(eq(awardCategories.id, categoryId), eq(awardCategories.seasonId, seasonId))
	});
	return !!row;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!db) throw error(503);
	const season = await loadSeason(params.slug, locals.user?.id);
	if (!season) throw error(404, 'season not found');

	const categories = await db
		.select()
		.from(awardCategories)
		.where(eq(awardCategories.seasonId, season.id))
		.orderBy(asc(awardCategories.sortOrder), asc(awardCategories.createdAt));

	const winners = categories.length
		? await db
				.select({
					id: awardWinners.id,
					categoryId: awardWinners.categoryId,
					reviewId: awardWinners.reviewId,
					rank: awardWinners.rank,
					note: awardWinners.note,
					isSpoiler: awardWinners.isSpoiler,
					sortOrder: awardWinners.sortOrder,
					movieId: movies.id,
					movieSlug: movies.slug,
					title: movies.title,
					year: movies.year,
					posterUrl: movies.posterUrl,
					combinedScore: reviews.combinedScore
				})
				.from(awardWinners)
				.innerJoin(reviews, eq(reviews.id, awardWinners.reviewId))
				.innerJoin(movies, eq(movies.id, reviews.movieId))
				.where(
					inArray(
						awardWinners.categoryId,
						categories.map((c) => c.id)
					)
				)
				.orderBy(asc(awardWinners.sortOrder), asc(awardWinners.createdAt))
		: [];

	const winnersByCategory = new Map<string, typeof winners>();
	for (const w of winners) {
		const arr = winnersByCategory.get(w.categoryId) ?? [];
		arr.push(w);
		winnersByCategory.set(w.categoryId, arr);
	}

	const seasonReviews = await db
		.select({
			id: reviews.id,
			title: movies.title,
			year: movies.year,
			posterUrl: movies.posterUrl,
			combinedScore: reviews.combinedScore
		})
		.from(reviews)
		.innerJoin(movies, eq(movies.id, reviews.movieId))
		.innerJoin(
			movieSeasons,
			and(eq(movieSeasons.movieId, movies.id), eq(movieSeasons.seasonId, season.id))
		)
		.where(eq(reviews.userId, season.userId))
		.orderBy(desc(reviews.combinedScore), asc(movies.title));

	return {
		season,
		categories: categories.map((c) => ({
			...c,
			winners: winnersByCategory.get(c.id) ?? []
		})),
		seasonReviews
	};
};

export const actions: Actions = {
	createCategory: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({
				name: z.string().trim().min(1).max(80),
				tagline: z.string().trim().max(140).optional(),
				allowsMultiple: z.union([z.literal('true'), z.literal('false'), z.literal('on')]).optional()
			})
			.safeParse({
				name: body.get('name'),
				tagline: body.get('tagline') ?? '',
				allowsMultiple: body.get('allowsMultiple') ?? 'false'
			});
		if (!parsed.success) return fail(400, { error: 'invalid input' });

		const sortOrder = await nextCategoryOrder(season.id);
		try {
			await db.insert(awardCategories).values({
				seasonId: season.id,
				name: parsed.data.name,
				tagline: parsed.data.tagline?.trim() || null,
				allowsMultiple:
					parsed.data.allowsMultiple === 'true' || parsed.data.allowsMultiple === 'on',
				sortOrder
			});
		} catch {
			return fail(409, { error: 'a category with that name already exists in this season' });
		}
		return { ok: true };
	},

	updateCategory: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({
				id: z.uuid(),
				name: z.string().trim().min(1).max(80),
				tagline: z.string().trim().max(140).optional()
			})
			.safeParse({
				id: body.get('id'),
				name: body.get('name'),
				tagline: body.get('tagline') ?? ''
			});
		if (!parsed.success) return fail(400, { error: 'invalid input' });
		if (!(await ownsCategory(parsed.data.id, season.id))) return fail(404);

		try {
			await db
				.update(awardCategories)
				.set({
					name: parsed.data.name,
					tagline: parsed.data.tagline?.trim() || null
				})
				.where(eq(awardCategories.id, parsed.data.id));
		} catch {
			return fail(409, { error: 'name already used in this season' });
		}
		return { ok: true };
	},

	deleteCategory: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);
		if (!(await ownsCategory(id, season.id))) return fail(404);
		await db.delete(awardCategories).where(eq(awardCategories.id, id));
		return { ok: true };
	},

	moveCategory: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({ id: z.uuid(), direction: z.enum(['up', 'down']) })
			.safeParse({ id: body.get('id'), direction: body.get('direction') });
		if (!parsed.success) return fail(400);
		if (!(await ownsCategory(parsed.data.id, season.id))) return fail(404);

		const current = await db.query.awardCategories.findFirst({
			where: eq(awardCategories.id, parsed.data.id),
			columns: { id: true, sortOrder: true }
		});
		if (!current) return fail(404);

		const neighbor = await db
			.select({ id: awardCategories.id, sortOrder: awardCategories.sortOrder })
			.from(awardCategories)
			.where(
				and(
					eq(awardCategories.seasonId, season.id),
					parsed.data.direction === 'up'
						? lt(awardCategories.sortOrder, current.sortOrder)
						: gt(awardCategories.sortOrder, current.sortOrder)
				)
			)
			.orderBy(
				parsed.data.direction === 'up'
					? desc(awardCategories.sortOrder)
					: asc(awardCategories.sortOrder)
			)
			.limit(1);

		const other = neighbor[0];
		if (!other) return { ok: true };

		await db.transaction(async (tx) => {
			await tx
				.update(awardCategories)
				.set({ sortOrder: other.sortOrder })
				.where(eq(awardCategories.id, current.id));
			await tx
				.update(awardCategories)
				.set({ sortOrder: current.sortOrder })
				.where(eq(awardCategories.id, other.id));
		});
		return { ok: true };
	},

	reorderCategories: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const idsRaw = body.get('ids');
		if (typeof idsRaw !== 'string') return fail(400);
		const ids = idsRaw.split(',').filter(Boolean);
		const parsed = z.array(z.uuid()).min(1).safeParse(ids);
		if (!parsed.success) return fail(400);

		const existing = await db
			.select({ id: awardCategories.id })
			.from(awardCategories)
			.where(eq(awardCategories.seasonId, season.id));
		const ownIds = new Set(existing.map((r) => r.id));
		if (parsed.data.length !== ownIds.size) return fail(400, { error: 'id count mismatch' });
		for (const id of parsed.data) if (!ownIds.has(id)) return fail(400);

		await db.transaction(async (tx) => {
			for (let i = 0; i < parsed.data.length; i++) {
				await tx
					.update(awardCategories)
					.set({ sortOrder: (i + 1) * GAP })
					.where(eq(awardCategories.id, parsed.data[i]));
			}
		});
		return { ok: true };
	},

	setWinner: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({
				categoryId: z.uuid(),
				reviewId: z.uuid(),
				rank: rankSchema
			})
			.safeParse({
				categoryId: body.get('categoryId'),
				reviewId: body.get('reviewId'),
				rank: body.get('rank')
			});
		if (!parsed.success) return fail(400, { error: 'invalid input' });
		const cat = await db!.query.awardCategories.findFirst({
			where: and(
				eq(awardCategories.id, parsed.data.categoryId),
				eq(awardCategories.seasonId, season.id)
			)
		});
		if (!cat) return fail(404);
		if (cat.allowsMultiple) {
			return fail(400, { error: 'this category only supports flat picks — use add pick' });
		}
		if (!(await reviewEligible(parsed.data.reviewId, season.id, season.userId))) {
			return fail(400, { error: 'that review is not tagged to this season' });
		}

		const categoryId = parsed.data.categoryId;
		const targetRank = parsed.data.rank;

		await db.transaction(async (tx) => {
			const existing = await tx.query.awardWinners.findFirst({
				where: and(
					eq(awardWinners.categoryId, categoryId),
					eq(awardWinners.reviewId, parsed.data.reviewId)
				)
			});
			if (existing?.rank === targetRank) return;

			await tx
				.delete(awardWinners)
				.where(
					and(
						eq(awardWinners.categoryId, categoryId),
						eq(awardWinners.reviewId, parsed.data.reviewId)
					)
				);

			const slotAt = (r: 'first' | 'second' | 'third') =>
				tx.query.awardWinners.findFirst({
					where: and(eq(awardWinners.categoryId, categoryId), eq(awardWinners.rank, r))
				});

			if (targetRank === 'first' || targetRank === 'second' || targetRank === 'third') {
				const third = await slotAt('third');
				if (third) {
					const [row] = await tx
						.select({ m: max(awardWinners.sortOrder) })
						.from(awardWinners)
						.where(
							and(eq(awardWinners.categoryId, categoryId), eq(awardWinners.rank, 'honorable'))
						);
					await tx
						.update(awardWinners)
						.set({ rank: 'honorable', sortOrder: (row?.m ?? 0) + GAP })
						.where(eq(awardWinners.id, third.id));
				}
			}
			if (targetRank === 'first' || targetRank === 'second') {
				const second = await slotAt('second');
				if (second) {
					await tx
						.update(awardWinners)
						.set({ rank: 'third' })
						.where(eq(awardWinners.id, second.id));
				}
			}
			if (targetRank === 'first') {
				const first = await slotAt('first');
				if (first) {
					await tx
						.update(awardWinners)
						.set({ rank: 'second' })
						.where(eq(awardWinners.id, first.id));
				}
			}

			await tx.insert(awardWinners).values({
				categoryId,
				reviewId: parsed.data.reviewId,
				rank: targetRank,
				sortOrder: 0
			});
		});
		return { ok: true };
	},

	clearWinner: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({ categoryId: z.uuid(), rank: rankSchema })
			.safeParse({ categoryId: body.get('categoryId'), rank: body.get('rank') });
		if (!parsed.success) return fail(400);
		if (!(await ownsCategory(parsed.data.categoryId, season.id))) return fail(404);

		await db
			.delete(awardWinners)
			.where(
				and(
					eq(awardWinners.categoryId, parsed.data.categoryId),
					eq(awardWinners.rank, parsed.data.rank)
				)
			);
		return { ok: true };
	},

	addHonorable: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({
				categoryId: z.uuid(),
				reviewId: z.uuid(),
				note: z.string().trim().max(140).optional(),
				isSpoiler: z.union([z.literal('true'), z.literal('false'), z.literal('on')]).optional()
			})
			.safeParse({
				categoryId: body.get('categoryId'),
				reviewId: body.get('reviewId'),
				note: body.get('note') ?? '',
				isSpoiler: body.get('isSpoiler') ?? 'false'
			});
		if (!parsed.success) return fail(400, { error: 'invalid input' });
		if (!(await ownsCategory(parsed.data.categoryId, season.id))) return fail(404);
		if (!(await reviewEligible(parsed.data.reviewId, season.id, season.userId))) {
			return fail(400, { error: 'that review is not tagged to this season' });
		}

		const sortOrder = await nextHonorableOrder(parsed.data.categoryId);
		try {
			await db.insert(awardWinners).values({
				categoryId: parsed.data.categoryId,
				reviewId: parsed.data.reviewId,
				rank: 'honorable',
				note: parsed.data.note?.trim() || null,
				isSpoiler: parsed.data.isSpoiler === 'true' || parsed.data.isSpoiler === 'on',
				sortOrder
			});
		} catch {
			return fail(409, { error: 'that review is already in this category' });
		}
		return { ok: true };
	},

	moveHonorable: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({ id: z.uuid(), direction: z.enum(['up', 'down']) })
			.safeParse({ id: body.get('id'), direction: body.get('direction') });
		if (!parsed.success) return fail(400);

		const current = await db.query.awardWinners.findFirst({
			where: eq(awardWinners.id, parsed.data.id)
		});
		if (!current || current.rank !== 'honorable') return fail(404);
		if (!(await ownsCategory(current.categoryId, season.id))) return fail(404);

		const neighbor = await db
			.select({ id: awardWinners.id, sortOrder: awardWinners.sortOrder })
			.from(awardWinners)
			.where(
				and(
					eq(awardWinners.categoryId, current.categoryId),
					eq(awardWinners.rank, 'honorable'),
					parsed.data.direction === 'up'
						? lt(awardWinners.sortOrder, current.sortOrder)
						: gt(awardWinners.sortOrder, current.sortOrder)
				)
			)
			.orderBy(
				parsed.data.direction === 'up' ? desc(awardWinners.sortOrder) : asc(awardWinners.sortOrder)
			)
			.limit(1);

		const other = neighbor[0];
		if (!other) return { ok: true };

		await db.transaction(async (tx) => {
			await tx
				.update(awardWinners)
				.set({ sortOrder: other.sortOrder })
				.where(eq(awardWinners.id, current.id));
			await tx
				.update(awardWinners)
				.set({ sortOrder: current.sortOrder })
				.where(eq(awardWinners.id, other.id));
		});
		return { ok: true };
	},

	updateNote: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const parsed = z
			.object({
				id: z.uuid(),
				note: z.string().trim().max(140).optional(),
				isSpoiler: z.union([z.literal('true'), z.literal('false'), z.literal('on')]).optional()
			})
			.safeParse({
				id: body.get('id'),
				note: body.get('note') ?? '',
				isSpoiler: body.get('isSpoiler') ?? 'false'
			});
		if (!parsed.success) return fail(400);

		const winner = await db.query.awardWinners.findFirst({
			where: eq(awardWinners.id, parsed.data.id)
		});
		if (!winner) return fail(404);
		if (!(await ownsCategory(winner.categoryId, season.id))) return fail(404);

		await db
			.update(awardWinners)
			.set({
				note: parsed.data.note?.trim() || null,
				isSpoiler: parsed.data.isSpoiler === 'true' || parsed.data.isSpoiler === 'on'
			})
			.where(eq(awardWinners.id, parsed.data.id));
		return { ok: true };
	},

	removeWinner: async ({ request, params, locals }) => {
		if (!db) return fail(503);
		const season = await loadSeason(params.slug, locals.user?.id);
		if (!season) return fail(404);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);

		const winner = await db.query.awardWinners.findFirst({
			where: eq(awardWinners.id, id)
		});
		if (!winner) return fail(404);
		if (!(await ownsCategory(winner.categoryId, season.id))) return fail(404);

		await db.delete(awardWinners).where(eq(awardWinners.id, id));
		return { ok: true };
	}
};
