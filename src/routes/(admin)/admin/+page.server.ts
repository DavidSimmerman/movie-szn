import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, movieSeasons, reviews, seasons, suggestions, watchList } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!db || !locals.user) {
		return {
			counts: { movies: 0, reviews: 0, seasons: 0, pendingSuggestions: 0, watchList: 0 },
			latestReviews: [],
			pendingSuggestions: [],
			currentSeason: null,
			dbReady: false,
			isAdmin: false
		};
	}

	const uid = locals.user.id;
	const [
		[movieCount],
		[reviewCount],
		[seasonCount],
		[pendingCount],
		[watchCount],
		latestReviews,
		pending,
		[currentSeason]
	] = await Promise.all([
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
			.where(eq(watchList.userId, uid)),
		db
			.select({
				slug: movies.slug,
				title: movies.title,
				year: movies.year,
				combinedScore: reviews.combinedScore,
				createdAt: reviews.createdAt
			})
			.from(reviews)
			.innerJoin(movies, eq(movies.id, reviews.movieId))
			.where(eq(reviews.userId, uid))
			.orderBy(desc(reviews.createdAt))
			.limit(5),
		locals.user.isAdmin
			? db
					.select({
						id: suggestions.id,
						title: suggestions.title,
						year: suggestions.year,
						voteCount: suggestions.voteCount,
						submitterName: suggestions.submitterName
					})
					.from(suggestions)
					.where(eq(suggestions.status, 'pending'))
					.orderBy(desc(suggestions.voteCount))
					.limit(5)
			: Promise.resolve([]),
		db
			.select({
				slug: seasons.slug,
				name: seasons.name,
				endsAt: seasons.endsAt,
				tagged: sql<number>`(select count(*)::int from ${movieSeasons} where ${movieSeasons.seasonId} = ${seasons.id})`
			})
			.from(seasons)
			.where(and(eq(seasons.userId, uid), sql`now()::date between starts_at and ends_at`))
			.limit(1)
	]);

	return {
		counts: {
			movies: movieCount.c,
			reviews: reviewCount.c,
			seasons: seasonCount.c,
			pendingSuggestions: locals.user.isAdmin ? pendingCount.c : 0,
			watchList: watchCount.c
		},
		latestReviews,
		pendingSuggestions: pending,
		currentSeason: currentSeason ?? null,
		dbReady: true,
		isAdmin: locals.user.isAdmin
	};
};
