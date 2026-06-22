import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews } from '$db/schema';
import { toNumber } from '$lib/ratings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	if (!db) throw error(503, 'database not configured');
	const { viewUser } = await parent();
	if (!viewUser) throw error(404, 'not found');

	const movie = await db.query.movies.findFirst({ where: eq(movies.slug, params.slug) });
	if (!movie) throw error(404, 'not found');

	const review = await db.query.reviews.findFirst({
		where: and(eq(reviews.movieId, movie.id), eq(reviews.userId, viewUser.id))
	});
	if (!review) throw error(404, 'no review yet for this movie');

	return { movie, score: toNumber(review.combinedScore), authorName: viewUser.name.toLowerCase() };
};
