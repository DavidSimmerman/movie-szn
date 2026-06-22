import { redirect } from '@sveltejs/kit';
import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, movieSeasons, reviews } from '$db/schema';
import { currentSeason } from '$server/seasons';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	// The homepage is the owner's front page; a bare /user/<name> lands on their reviews.
	if (locals.viewUsername) throw redirect(307, `/user/${locals.viewUsername}/reviews`);

	const { owner } = await parent();
	if (!db || !owner)
		return { latest: [], currentSeason: null, seasonMovies: [], seasonReviewCount: 0 };

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
		.where(eq(reviews.userId, owner.id))
		.orderBy(desc(reviews.createdAt))
		.limit(10);

	const season = await currentSeason(owner.id);
	let seasonMovies: Array<{ title: string; year: number; slug: string }> = [];
	let seasonReviewCount = 0;
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

		const [row] = await db
			.select({ value: count() })
			.from(reviews)
			.innerJoin(movieSeasons, eq(movieSeasons.movieId, reviews.movieId))
			.where(and(eq(movieSeasons.seasonId, season.id), eq(reviews.userId, owner.id)));
		seasonReviewCount = row?.value ?? 0;
	}

	return { latest, currentSeason: season, seasonMovies, seasonReviewCount };
};
