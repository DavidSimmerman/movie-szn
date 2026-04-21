import { db } from './db';
import { movies } from './db/schema';
import { fetchTmdbDetails } from './tmdb';
import { buildMovieSlug } from './slug';

export type UpsertedMovie = { id: string; slug: string; created: boolean };

/**
 * Look up a movie by tmdbId. If absent, fetch full details from TMDB and insert.
 * Returns the row id + slug, plus whether we inserted (vs found existing).
 * Throws on missing release year or TMDB failure — caller decides how to surface.
 */
export async function upsertMovieFromTmdb(
	tmdbId: number,
	type: 'movie' | 'show'
): Promise<UpsertedMovie> {
	if (!db) throw new Error('database not configured');

	const existing = await db.query.movies.findFirst({
		where: (m, { eq }) => eq(m.tmdbId, tmdbId),
		columns: { id: true, slug: true }
	});
	if (existing) return { ...existing, created: false };

	const details = await fetchTmdbDetails(tmdbId, type);
	if (!details.year) throw new Error('missing release year');

	const slug = await buildMovieSlug(details.title, details.year);
	const [row] = await db
		.insert(movies)
		.values({
			slug,
			title: details.title,
			year: details.year,
			type: details.type,
			tmdbId: details.id,
			imdbId: details.imdbId,
			overview: details.overview,
			runtimeMinutes: details.runtimeMinutes,
			posterUrl: details.posterUrl,
			backdropUrl: details.backdropUrl,
			metadata: details.raw as object
		})
		.onConflictDoNothing({ target: movies.tmdbId })
		.returning({ id: movies.id, slug: movies.slug });

	if (row) return { ...row, created: true };

	const again = await db.query.movies.findFirst({
		where: (m, { eq }) => eq(m.tmdbId, tmdbId),
		columns: { id: true, slug: true }
	});
	if (!again) throw new Error('movie insert failed');
	return { ...again, created: false };
}
