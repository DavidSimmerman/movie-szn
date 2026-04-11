import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies } from '$db/schema';
import { scrapeImdbUrl } from '$server/imdb';
import { buildMovieSlug } from '$server/slug';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) throw error(403);
	if (!db) throw error(503);

	const body = await request.json().catch(() => null);
	const url = body && typeof body.url === 'string' ? body.url : '';
	if (!url) throw error(400, 'url required');

	const extracted = await scrapeImdbUrl(url);
	if (!extracted.year) throw error(400, 'could not determine year');

	const existing = await db.query.movies.findFirst({
		where: eq(movies.imdbId, extracted.imdbId),
		columns: { id: true, slug: true }
	});
	if (existing) {
		return json({ created: false, slug: existing.slug });
	}

	const slug = await buildMovieSlug(extracted.title, extracted.year);
	const [row] = await db
		.insert(movies)
		.values({
			slug,
			title: extracted.title,
			year: extracted.year,
			type: extracted.type,
			imdbId: extracted.imdbId,
			overview: extracted.overview,
			runtimeMinutes: extracted.runtimeMinutes,
			posterUrl: extracted.posterUrl,
			metadata: { source: 'imdb-scrape', raw: extracted }
		})
		.returning({ slug: movies.slug });

	return json({ created: true, slug: row.slug });
};
