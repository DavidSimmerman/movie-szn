import { desc } from 'drizzle-orm';
import { db } from '$server/db';
import { movies } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!db) return { movies: [] };
	const rows = await db
		.select({
			id: movies.id,
			slug: movies.slug,
			title: movies.title,
			year: movies.year,
			type: movies.type,
			posterUrl: movies.posterUrl,
			createdAt: movies.createdAt
		})
		.from(movies)
		.orderBy(desc(movies.createdAt));
	return { movies: rows };
};
