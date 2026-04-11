import { error } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, movieSeasons, reviews, seasons } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
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

	return { season, movies: items };
};
