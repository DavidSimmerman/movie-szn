import { eq, sql } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews, seasons, suggestions, watchList } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!db || !locals.user) {
		return {
			counts: { movies: 0, reviews: 0, seasons: 0, pendingSuggestions: 0, watchList: 0 },
			dbReady: false,
			isAdmin: false
		};
	}

	const uid = locals.user.id;
	const [[movieCount], [reviewCount], [seasonCount], [pendingCount], [watchCount]] =
		await Promise.all([
			db.select({ c: sql<number>`count(*)::int` }).from(movies),
			db
				.select({ c: sql<number>`count(*)::int` })
				.from(reviews)
				.where(eq(reviews.userId, uid)),
			db
				.select({ c: sql<number>`count(*)::int` })
				.from(seasons)
				.where(eq(seasons.userId, uid)),
			db
				.select({ c: sql<number>`count(*)::int` })
				.from(suggestions)
				.where(sql`status = 'pending'`),
			db
				.select({ c: sql<number>`count(*)::int` })
				.from(watchList)
				.where(eq(watchList.userId, uid))
		]);

	return {
		counts: {
			movies: movieCount.c,
			reviews: reviewCount.c,
			seasons: seasonCount.c,
			pendingSuggestions: locals.user.isAdmin ? pendingCount.c : 0,
			watchList: watchCount.c
		},
		dbReady: true,
		isAdmin: locals.user.isAdmin
	};
};
