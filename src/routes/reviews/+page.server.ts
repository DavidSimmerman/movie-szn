import { desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews } from '$db/schema';
import { isRatingKey, type RatingSortKey } from '$lib/ratings';
import type { PageServerLoad } from './$types';

const SORT_COLUMNS = {
	production: reviews.production,
	acting: reviews.acting,
	storyPlot: reviews.storyPlot,
	intent: reviews.intent,
	daveFactor: reviews.daveFactor
} as const;

export const load: PageServerLoad = async ({ parent, url }) => {
	const sortParam = url.searchParams.get('sort');
	const sort: RatingSortKey | null = isRatingKey(sortParam) ? sortParam : null;

	const { viewUser } = await parent();
	if (!db || !viewUser) return { reviews: [], sort };

	const orderBy = sort
		? [desc(SORT_COLUMNS[sort]), desc(reviews.combinedScore), desc(reviews.createdAt)]
		: [desc(reviews.combinedScore), desc(reviews.createdAt)];

	const rows = await db
		.select({
			id: reviews.id,
			title: movies.title,
			year: movies.year,
			slug: movies.slug,
			posterUrl: movies.posterUrl,
			combinedScore: reviews.combinedScore,
			production: reviews.production,
			acting: reviews.acting,
			storyPlot: reviews.storyPlot,
			intent: reviews.intent,
			daveFactor: reviews.daveFactor,
			createdAt: reviews.createdAt
		})
		.from(reviews)
		.innerJoin(movies, eq(movies.id, reviews.movieId))
		.where(eq(reviews.userId, viewUser.id))
		.orderBy(...orderBy);
	return { reviews: rows, sort };
};
