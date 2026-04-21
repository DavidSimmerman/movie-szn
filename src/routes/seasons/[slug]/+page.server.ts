import { error } from '@sveltejs/kit';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '$server/db';
import { awardCategories, awardWinners, movies, movieSeasons, reviews, seasons } from '$db/schema';
import type { PageServerLoad } from './$types';

const RANK_PRIORITY: Record<string, number> = { first: 0, second: 1, third: 2, honorable: 3 };

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!db) throw error(503);
	const season = await db.query.seasons.findFirst({ where: eq(seasons.slug, params.slug) });
	if (!season) throw error(404, 'season not found');

	const items = await db
		.select({
			id: movies.id,
			slug: movies.slug,
			title: movies.title,
			year: movies.year,
			posterUrl: movies.posterUrl,
			combinedScore: reviews.combinedScore
		})
		.from(movieSeasons)
		.innerJoin(movies, eq(movies.id, movieSeasons.movieId))
		.leftJoin(reviews, eq(reviews.movieId, movies.id))
		.where(eq(movieSeasons.seasonId, season.id))
		.orderBy(desc(reviews.combinedScore), desc(movieSeasons.addedAt));

	const categories = await db
		.select()
		.from(awardCategories)
		.where(eq(awardCategories.seasonId, season.id))
		.orderBy(asc(awardCategories.sortOrder), asc(awardCategories.createdAt));

	let awardsPreview: {
		totalCategories: number;
		picks: {
			categoryId: string;
			categoryName: string;
			tagline: string | null;
			rank: 'first' | 'second' | 'third' | 'honorable';
			movieSlug: string;
			title: string;
			year: number;
			posterUrl: string | null;
			note: string | null;
		}[];
	} | null = null;

	if (categories.length > 0) {
		const previewCats = categories.slice(0, 5);
		const winners = await db
			.select({
				categoryId: awardWinners.categoryId,
				rank: awardWinners.rank,
				sortOrder: awardWinners.sortOrder,
				note: awardWinners.note,
				movieSlug: movies.slug,
				title: movies.title,
				year: movies.year,
				posterUrl: movies.posterUrl
			})
			.from(awardWinners)
			.innerJoin(reviews, eq(reviews.id, awardWinners.reviewId))
			.innerJoin(movies, eq(movies.id, reviews.movieId))
			.where(
				inArray(
					awardWinners.categoryId,
					previewCats.map((c) => c.id)
				)
			);

		const picks = previewCats
			.map((c) => {
				const top = winners
					.filter((w) => w.categoryId === c.id)
					.sort(
						(a, b) => RANK_PRIORITY[a.rank] - RANK_PRIORITY[b.rank] || a.sortOrder - b.sortOrder
					)[0];
				if (!top) return null;
				return {
					categoryId: c.id,
					categoryName: c.name,
					tagline: c.tagline,
					rank: top.rank,
					movieSlug: top.movieSlug,
					title: top.title,
					year: top.year,
					posterUrl: top.posterUrl,
					note: top.note
				};
			})
			.filter((p): p is NonNullable<typeof p> => p !== null);

		if (picks.length > 0) {
			awardsPreview = { totalCategories: categories.length, picks };
		}
	}

	return {
		season,
		movies: items,
		awardsPreview,
		admin: locals.admin
	};
};
