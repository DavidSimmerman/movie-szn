import { desc, eq, sql } from 'drizzle-orm';
import { db } from '$server/db';
import { movieSeasons, seasons } from '$db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!db) return { seasons: [] };

	const rows = await db
		.select({
			id: seasons.id,
			slug: seasons.slug,
			name: seasons.name,
			startsAt: seasons.startsAt,
			endsAt: seasons.endsAt,
			movieCount: sql<number>`count(${movieSeasons.movieId})::int`
		})
		.from(seasons)
		.leftJoin(movieSeasons, eq(movieSeasons.seasonId, seasons.id))
		.groupBy(seasons.id)
		.orderBy(desc(seasons.startsAt));

	return { seasons: rows };
};
