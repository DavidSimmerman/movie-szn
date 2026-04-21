import { desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!db) return { reviews: [] };
	const rows = await db
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
		.orderBy(desc(reviews.combinedScore), desc(reviews.createdAt));
	return { reviews: rows };
};
