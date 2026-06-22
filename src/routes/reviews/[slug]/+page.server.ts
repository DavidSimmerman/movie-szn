import { error } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { awardCategories, awardWinners, movies, reviews, seasons, users } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	if (!db) throw error(503, 'database not configured');
	const { viewUser } = await parent();
	if (!viewUser) throw error(404, 'not found');

	const movie = await db.query.movies.findFirst({
		where: eq(movies.slug, params.slug)
	});
	if (!movie) throw error(404, 'not found');

	const review = await db.query.reviews.findFirst({
		where: and(eq(reviews.movieId, movie.id), eq(reviews.userId, viewUser.id))
	});
	if (!review) throw error(404, 'no review yet for this movie');

	const reviewers = await db
		.select({
			id: users.id,
			username: users.username,
			name: users.name,
			avatarUrl: users.avatarUrl
		})
		.from(reviews)
		.innerJoin(users, eq(users.id, reviews.userId))
		.where(eq(reviews.movieId, movie.id))
		.orderBy(asc(users.createdAt));

	const awards = await db
		.select({
			rank: awardWinners.rank,
			note: awardWinners.note,
			categoryName: awardCategories.name,
			categoryTagline: awardCategories.tagline,
			allowsMultiple: awardCategories.allowsMultiple,
			seasonSlug: seasons.slug,
			seasonName: seasons.name,
			seasonStartsAt: seasons.startsAt
		})
		.from(awardWinners)
		.innerJoin(awardCategories, eq(awardCategories.id, awardWinners.categoryId))
		.innerJoin(seasons, eq(seasons.id, awardCategories.seasonId))
		.where(eq(awardWinners.reviewId, review.id))
		.orderBy(asc(awardWinners.rank), asc(awardCategories.sortOrder), desc(seasons.startsAt));

	return { movie, review, awards, author: viewUser, reviewers };
};
