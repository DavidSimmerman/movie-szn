import { error, fail, redirect } from '@sveltejs/kit';
import { desc, eq, inArray, and, notInArray } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { db } from '$server/db';
import { movies, movieSeasons, reviews, seasons, watchList } from '$db/schema';
import type { Actions, PageServerLoad } from './$types';

const rating = z.coerce.number().min(0).max(6);

const reviewSchema = z.object({
	movieId: z.uuid(),
	production: rating,
	acting: rating,
	storyPlot: rating,
	intent: rating,
	daveFactor: rating,
	notes: z.string().default(''),
	seasonIds: z.array(z.uuid()).default([])
});

export const load: PageServerLoad = async ({ url }) => {
	if (!db) throw error(503, 'database not configured');
	const slug = url.searchParams.get('movieSlug');
	if (!slug) throw error(400, 'movieSlug query param required');
	const movie = await db.query.movies.findFirst({
		where: eq(movies.slug, slug),
		columns: {
			id: true,
			slug: true,
			title: true,
			year: true,
			type: true,
			posterUrl: true,
			backdropUrl: true,
			overview: true
		}
	});
	if (!movie) throw error(404, 'movie not found');

	const existing = await db.query.reviews.findFirst({
		where: eq(reviews.movieId, movie.id)
	});

	const allSeasons = await db.select().from(seasons).orderBy(desc(seasons.startsAt));
	const latestSeasonId = allSeasons[0]?.id;

	const taggedRows = await db
		.select({ seasonId: movieSeasons.seasonId })
		.from(movieSeasons)
		.where(eq(movieSeasons.movieId, movie.id));
	const tagged = taggedRows.map((r) => r.seasonId);

	const defaultSeasonIds = existing ? tagged : latestSeasonId ? [latestSeasonId] : [];

	const form = await superValidate(
		{
			movieId: movie.id,
			production: existing?.production ? Number(existing.production) : 2.5,
			acting: existing?.acting ? Number(existing.acting) : 2.5,
			storyPlot: existing?.storyPlot ? Number(existing.storyPlot) : 2.5,
			intent: existing?.intent ? Number(existing.intent) : 2.5,
			daveFactor: existing?.daveFactor ? Number(existing.daveFactor) : 2.5,
			notes: existing?.notes ?? '',
			seasonIds: defaultSeasonIds
		},
		zod4(reviewSchema)
	);

	return { form, movie, editing: !!existing, seasons: allSeasons, latestSeasonId };
};

export const actions: Actions = {
	default: async ({ request }) => {
		if (!db) return fail(503);
		const form = await superValidate(request, zod4(reviewSchema));
		if (!form.valid) return fail(400, { form });

		const existing = await db.query.reviews.findFirst({
			where: eq(reviews.movieId, form.data.movieId),
			columns: { id: true }
		});

		const values = {
			movieId: form.data.movieId,
			production: form.data.production.toFixed(2),
			acting: form.data.acting.toFixed(2),
			storyPlot: form.data.storyPlot.toFixed(2),
			intent: form.data.intent.toFixed(2),
			daveFactor: form.data.daveFactor.toFixed(2),
			notes: form.data.notes,
			updatedAt: new Date()
		};

		if (existing) {
			await db.update(reviews).set(values).where(eq(reviews.id, existing.id));
		} else {
			await db.insert(reviews).values(values);
		}

		const wanted = form.data.seasonIds;
		if (wanted.length === 0) {
			await db.delete(movieSeasons).where(eq(movieSeasons.movieId, form.data.movieId));
		} else {
			await db
				.delete(movieSeasons)
				.where(
					and(
						eq(movieSeasons.movieId, form.data.movieId),
						notInArray(movieSeasons.seasonId, wanted)
					)
				);
			const existingTags = await db
				.select({ seasonId: movieSeasons.seasonId })
				.from(movieSeasons)
				.where(
					and(eq(movieSeasons.movieId, form.data.movieId), inArray(movieSeasons.seasonId, wanted))
				);
			const have = new Set(existingTags.map((r) => r.seasonId));
			const toInsert = wanted.filter((id) => !have.has(id));
			if (toInsert.length > 0) {
				await db
					.insert(movieSeasons)
					.values(toInsert.map((seasonId) => ({ movieId: form.data.movieId, seasonId })))
					.onConflictDoNothing();
			}
		}

		await db.delete(watchList).where(eq(watchList.movieId, form.data.movieId));

		const movie = await db.query.movies.findFirst({
			where: eq(movies.id, form.data.movieId),
			columns: { slug: true }
		});

		if (movie) throw redirect(303, `/reviews/${movie.slug}`);
		return message(form, 'saved');
	}
};
