import { sql } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews, suggestions, watchList } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!db) {
		return {
			counts: { movies: 0, reviews: 0, pendingSuggestions: 0, watchList: 0 },
			dbReady: false
		};
	}

	const [[movieCount], [reviewCount], [pendingCount], [watchCount]] = await Promise.all([
		db.select({ c: sql<number>`count(*)::int` }).from(movies),
		db.select({ c: sql<number>`count(*)::int` }).from(reviews),
		db
			.select({ c: sql<number>`count(*)::int` })
			.from(suggestions)
			.where(sql`status = 'pending'`),
		db.select({ c: sql<number>`count(*)::int` }).from(watchList)
	]);

	return {
		counts: {
			movies: movieCount.c,
			reviews: reviewCount.c,
			pendingSuggestions: pendingCount.c,
			watchList: watchCount.c
		},
		dbReady: true
	};
};
