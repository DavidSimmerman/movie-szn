import { error } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { listItems, lists, movies, reviews } from '$db/schema';
import { toNumber } from '$lib/ratings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	if (!db) throw error(503, 'database not configured');
	const { viewUser } = await parent();
	if (!viewUser) throw error(404, 'not found');

	const list = await db.query.lists.findFirst({
		where: and(eq(lists.slug, params.slug), eq(lists.userId, viewUser.id))
	});
	if (!list) throw error(404, 'not found');

	const orderBy =
		list.orderMode === 'rating'
			? [desc(reviews.combinedScore), asc(listItems.position)]
			: [asc(listItems.position)];

	const rows = await db
		.select({
			title: movies.title,
			posterUrl: movies.posterUrl,
			combinedScore: reviews.combinedScore
		})
		.from(listItems)
		.innerJoin(movies, eq(movies.id, listItems.movieId))
		.leftJoin(reviews, and(eq(reviews.movieId, movies.id), eq(reviews.userId, list.userId)))
		.where(eq(listItems.listId, list.id))
		.orderBy(...orderBy)
		.limit(3);

	return {
		list,
		authorName: viewUser.name.toLowerCase(),
		podium: rows.map((m) => ({
			title: m.title,
			posterUrl: m.posterUrl,
			score: m.combinedScore == null ? null : toNumber(m.combinedScore)
		}))
	};
};
