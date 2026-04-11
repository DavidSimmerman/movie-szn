import { asc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, watchList } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!db) return { items: [] };

	const rows = await db
		.select({
			id: watchList.id,
			position: watchList.position,
			notes: watchList.notes,
			title: movies.title,
			year: movies.year,
			slug: movies.slug,
			posterUrl: movies.posterUrl,
			type: movies.type
		})
		.from(watchList)
		.innerJoin(movies, eq(movies.id, watchList.movieId))
		.orderBy(asc(watchList.position));

	return { items: rows };
};
