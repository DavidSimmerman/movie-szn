import { desc, eq, sql } from 'drizzle-orm';
import { db } from '$server/db';
import { listItems, lists } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { viewUser } = await parent();
	if (!db || !viewUser) return { lists: [] };

	const rows = await db
		.select({
			id: lists.id,
			slug: lists.slug,
			name: lists.name,
			description: lists.description,
			orderMode: lists.orderMode,
			movieCount: sql<number>`count(${listItems.movieId})::int`
		})
		.from(lists)
		.leftJoin(listItems, eq(listItems.listId, lists.id))
		.where(eq(lists.userId, viewUser.id))
		.groupBy(lists.id)
		.orderBy(desc(lists.createdAt));

	return { lists: rows };
};
