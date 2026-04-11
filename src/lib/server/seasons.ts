import { and, lte, gte, sql } from 'drizzle-orm';
import { db } from './db';
import { seasons, type Season } from './db/schema';

/** Returns the season that contains today's date, if any. */
export async function currentSeason(): Promise<Season | null> {
	if (!db) return null;
	const rows = await db
		.select()
		.from(seasons)
		.where(and(lte(seasons.startsAt, sql`current_date`), gte(seasons.endsAt, sql`current_date`)))
		.limit(1);
	return rows[0] ?? null;
}

/** Default season bounds for Dave's calendar: April 1 → August 31 of a given year. */
export function defaultSeasonBounds(year: number): { startsAt: string; endsAt: string } {
	return {
		startsAt: `${year}-04-01`,
		endsAt: `${year}-08-31`
	};
}

export function defaultSeasonName(year: number): string {
	return `movie season ${year}`;
}

export function defaultSeasonSlug(year: number): string {
	return `${year}`;
}
