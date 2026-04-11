import { desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, movieSeasons, reviews } from '$db/schema';
import { currentSeason } from '$server/seasons';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!db) return { latest: [], currentSeason: null, seasonMovies: [] };

	const latest = await db
		.select({
			id: reviews.id,
			title: movies.title,
			year: movies.year,
			slug: movies.slug,
			posterUrl: movies.posterUrl,
			combinedScore: reviews.combinedScore,
			createdAt: reviews.createdAt
		})
		.from(reviews)
		.innerJoin(movies, eq(movies.id, reviews.movieId))
		.orderBy(desc(reviews.createdAt))
		.limit(6);

	const season = await currentSeason();
	let seasonMovies: Array<{ title: string; year: number; slug: string }> = [];
	if (season) {
		seasonMovies = await db
			.select({
				title: movies.title,
				year: movies.year,
				slug: movies.slug
			})
			.from(movieSeasons)
			.innerJoin(movies, eq(movies.id, movieSeasons.movieId))
			.where(eq(movieSeasons.seasonId, season.id))
			.orderBy(desc(movieSeasons.addedAt));
	}

	return { latest, currentSeason: season, seasonMovies };
};
