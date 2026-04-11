import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { db } from '$server/db';
import { movies, reviews } from '$db/schema';
import type { Actions, PageServerLoad } from './$types';

const rating = z.coerce.number().min(0).max(6);

const reviewSchema = z.object({
	movieId: z.uuid(),
	production: rating,
	storyPlot: rating,
	misc: rating,
	daveFactor: rating,
	notes: z.string().default(''),
	watchedAt: z
		.string()
		.optional()
		.transform((s) => (s ? s : undefined))
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

	const form = await superValidate(
		{
			movieId: movie.id,
			production: existing?.production ? Number(existing.production) : 3,
			storyPlot: existing?.storyPlot ? Number(existing.storyPlot) : 3,
			misc: existing?.misc ? Number(existing.misc) : 3,
			daveFactor: existing?.daveFactor ? Number(existing.daveFactor) : 3,
			notes: existing?.notes ?? '',
			watchedAt: existing?.watchedAt ?? undefined
		},
		zod4(reviewSchema)
	);

	return { form, movie, editing: !!existing };
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
			storyPlot: form.data.storyPlot.toFixed(2),
			misc: form.data.misc.toFixed(2),
			daveFactor: form.data.daveFactor.toFixed(2),
			notes: form.data.notes,
			watchedAt: form.data.watchedAt ?? null,
			updatedAt: new Date()
		};

		if (existing) {
			await db.update(reviews).set(values).where(eq(reviews.id, existing.id));
		} else {
			await db.insert(reviews).values(values);
		}

		const movie = await db.query.movies.findFirst({
			where: eq(movies.id, form.data.movieId),
			columns: { slug: true }
		});

		if (movie) throw redirect(303, `/reviews/${movie.slug}`);
		return message(form, 'saved');
	}
};
