import { desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!db || !locals.user) return { reviews: [] };
	const rows = await db
		.select({
			id: reviews.id,
			slug: movies.slug,
			title: movies.title,
			year: movies.year,
			combinedScore: reviews.combinedScore,
			createdAt: reviews.createdAt
		})
		.from(reviews)
		.innerJoin(movies, eq(movies.id, reviews.movieId))
		.where(eq(reviews.userId, locals.user.id))
		.orderBy(desc(reviews.createdAt));
	return { reviews: rows };
};
