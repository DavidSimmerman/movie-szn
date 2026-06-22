import { error } from '@sveltejs/kit';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '$server/db';
import { awardCategories, awardWinners, movies, reviews, seasons } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals }) => {
	if (!db) throw error(503);
	const { viewUser } = await parent();
	if (!viewUser) throw error(404, 'season not found');

	const season = await db.query.seasons.findFirst({
		where: and(eq(seasons.slug, params.slug), eq(seasons.userId, viewUser.id))
	});
	if (!season) throw error(404, 'season not found');

	const canEdit = locals.user?.id === season.userId;

	const categories = await db
		.select()
		.from(awardCategories)
		.where(eq(awardCategories.seasonId, season.id))
		.orderBy(asc(awardCategories.sortOrder), asc(awardCategories.createdAt));

	if (categories.length === 0) {
		return { season, categories: [] as never[], canEdit };
	}

	const winners = await db
		.select({
			id: awardWinners.id,
			categoryId: awardWinners.categoryId,
			rank: awardWinners.rank,
			note: awardWinners.note,
			sortOrder: awardWinners.sortOrder,
			movieSlug: movies.slug,
			title: movies.title,
			year: movies.year,
			posterUrl: movies.posterUrl,
			backdropUrl: movies.backdropUrl,
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
		.orderBy(asc(awardWinners.sortOrder), asc(awardWinners.createdAt));

	const byCat = new Map<string, typeof winners>();
	for (const w of winners) {
		const arr = byCat.get(w.categoryId) ?? [];
		arr.push(w);
		byCat.set(w.categoryId, arr);
	}

	const populated = categories
		.map((c) => ({ ...c, winners: byCat.get(c.id) ?? [] }))
		.filter((c) => c.winners.length > 0);

	return { season, categories: populated, canEdit };
};
