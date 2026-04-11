import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	if (!db) throw error(503, 'database not configured');

	const movie = await db.query.movies.findFirst({
		where: eq(movies.slug, params.slug)
	});
	if (!movie) throw error(404, 'not found');

	const review = await db.query.reviews.findFirst({
		where: eq(reviews.movieId, movie.id)
	});
	if (!review) throw error(404, 'no review yet for this movie');

	return { movie, review };
};
