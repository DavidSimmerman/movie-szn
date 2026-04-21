import { error, fail } from '@sveltejs/kit';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, movieSeasons, reviews, seasons } from '$db/schema';
import type { Actions, PageServerLoad } from './$types';

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
			combinedScore: reviews.combinedScore,
			tagged: sql<boolean>`${movieSeasons.movieId} is not null`
		})
		.from(movies)
		.innerJoin(reviews, eq(reviews.movieId, movies.id))
		.leftJoin(
			movieSeasons,
			and(eq(movieSeasons.movieId, movies.id), eq(movieSeasons.seasonId, season.id))
		)
		.orderBy(desc(sql`${movieSeasons.movieId} is not null`), desc(movies.year), asc(movies.title));

	return { season, movies: items };
};

export const actions: Actions = {
	toggle: async ({ request, params }) => {
		if (!db) return fail(503);
		const body = await request.formData();
		const movieId = body.get('movieId');
		const tagged = body.get('tagged') === 'true';
		if (typeof movieId !== 'string') return fail(400, { error: 'missing movieId' });

		const season = await db.query.seasons.findFirst({ where: eq(seasons.slug, params.slug) });
		if (!season) return fail(404, { error: 'season not found' });

		if (tagged) {
			await db
				.delete(movieSeasons)
				.where(and(eq(movieSeasons.movieId, movieId), eq(movieSeasons.seasonId, season.id)));
		} else {
			const reviewed = await db.query.reviews.findFirst({ where: eq(reviews.movieId, movieId) });
			if (!reviewed) return fail(400, { error: 'movie must be reviewed before tagging' });
			await db.insert(movieSeasons).values({ movieId, seasonId: season.id }).onConflictDoNothing();
		}
		return { ok: true };
	}
};
