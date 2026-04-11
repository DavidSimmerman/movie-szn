import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$server/db';
import { movies } from '$db/schema';
import { fetchTmdbDetails, searchTmdb, type TmdbSearchResult } from '$server/tmdb';
import { buildMovieSlug } from '$server/slug';
import type { Actions, PageServerLoad } from './$types';

const importSchema = z.object({
	tmdbId: z.coerce.number().int().positive(),
	type: z.enum(['movie', 'show'])
});

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') ?? '';
	let results: TmdbSearchResult[] = [];
	let error: string | null = null;
	if (query) {
		try {
			results = await searchTmdb(query);
		} catch (err) {
			error = err instanceof Error ? err.message : 'tmdb search failed';
		}
	}
	return { query, results, error };
};

export const actions: Actions = {
	import: async ({ request }) => {
		if (!db) return fail(503, { error: 'database not configured' });

		const form = await request.formData();
		const parsed = importSchema.safeParse({
			tmdbId: form.get('tmdbId'),
			type: form.get('type')
		});
		if (!parsed.success) return fail(400, { error: 'invalid input' });

		const details = await fetchTmdbDetails(parsed.data.tmdbId, parsed.data.type);
		if (!details.year) return fail(400, { error: 'missing release year' });

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

		if (!row) {
			// already existed — look it up and redirect
			const existing = await db.query.movies.findFirst({
				where: (m, { eq }) => eq(m.tmdbId, details.id),
				columns: { slug: true }
			});
			if (existing) throw redirect(303, `/admin/reviews/new?movieSlug=${existing.slug}`);
			return fail(500, { error: 'insert failed' });
		}

		throw redirect(303, `/admin/reviews/new?movieSlug=${row.slug}`);
	}
};
