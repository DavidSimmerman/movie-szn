import { fail } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { db } from '$server/db';
import { suggestions, suggestionVotes, voterNames } from '$db/schema';
import { checkRateLimit } from '$server/ratelimit';
import { hashIp, voterHash } from '$server/visitor';
import { upsertMovieFromTmdb } from '$server/movies';
import type { Actions, PageServerLoad } from './$types';

const emptyToUndef = (v: unknown) => (v === '' || v == null ? undefined : v);

const schema = z.object({
	title: z.string().max(200).optional().default(''),
	year: z.preprocess(emptyToUndef, z.coerce.number().int().min(1900).max(2100).optional()),
	submitterName: z.string().max(60).optional().default(''),
	notes: z.string().max(1000).optional().default(''),
	tmdbId: z.preprocess(
		emptyToUndef,
		z.coerce.number({ error: 'pick a movie from the search' }).int().positive()
	),
	tmdbType: z.preprocess(emptyToUndef, z.enum(['movie', 'show']))
});

const voteSchema = z.object({
	suggestionId: z.uuid()
});

export const load: PageServerLoad = async ({ locals }) => {
	const form = await superValidate(zod4(schema));

	if (!db) return { form, suggestions: [], voted: new Set<string>() };

	const rows = await db
		.select({
			id: suggestions.id,
			title: suggestions.title,
			year: suggestions.year,
			imdbUrl: suggestions.imdbUrl,
			status: suggestions.status,
			voteCount: suggestions.voteCount,
			createdAt: suggestions.createdAt
		})
		.from(suggestions)
		.where(sql`${suggestions.status} IN ('pending', 'watching')`)
		.orderBy(desc(suggestions.voteCount), desc(suggestions.createdAt))
		.limit(100);

	const vh = voterHash(null, locals.visitorId);
	const votedRows = await db
		.select({ id: suggestionVotes.suggestionId })
		.from(suggestionVotes)
		.where(eq(suggestionVotes.voterHash, vh));
	const voted = new Set(votedRows.map((r) => r.id));

	return { form, suggestions: rows, voted };
};

export const actions: Actions = {
	submit: async ({ request, locals, getClientAddress }) => {
		if (!db) return fail(503);
		const form = await superValidate(request, zod4(schema));
		if (!form.valid) return fail(400, { form });

		const ip = (() => {
			try {
				return getClientAddress();
			} catch {
				return null;
			}
		})();

		const submitter = form.data.submitterName?.trim() || null;
		const notes = form.data.notes?.trim() || null;

		let movie;
		try {
			movie = await upsertMovieFromTmdb(form.data.tmdbId, form.data.tmdbType);
		} catch (err) {
			return message(form, err instanceof Error ? err.message : 'tmdb fetch failed', {
				status: 502
			});
		}

		const dupe = await db.query.suggestions.findFirst({
			where: (s, { eq: e, and: a, ne }) =>
				a(e(s.resolvedMovieId, movie.id), ne(s.status, 'declined')),
			columns: { id: true }
		});
		if (dupe) {
			return message(form, 'already in the queue — go upvote it ↓');
		}

		await db.insert(suggestions).values({
			title: form.data.title?.trim() || 'untitled',
			year: form.data.year ?? null,
			imdbUrl: null,
			submitterName: submitter,
			notes,
			resolvedMovieId: movie.id
		});

		if (submitter) {
			const vh = voterHash(ip, locals.visitorId);
			await db
				.insert(voterNames)
				.values({ voterHash: vh, name: submitter })
				.onConflictDoUpdate({
					target: voterNames.voterHash,
					set: { name: submitter, updatedAt: new Date() }
				});
		}

		return message(form, 'suggestion added — thanks!');
	},

	vote: async ({ request, locals, getClientAddress }) => {
		if (!db) return fail(503);
		const body = await request.formData();
		const parsed = voteSchema.safeParse({ suggestionId: body.get('suggestionId') });
		if (!parsed.success) return fail(400);

		const ip = (() => {
			try {
				return getClientAddress();
			} catch {
				return null;
			}
		})();

		const rl = await checkRateLimit(`vote:ip:${hashIp(ip)}`, 30, 'hour');
		if (!rl.allowed) return fail(429);

		const vh = voterHash(ip, locals.visitorId);

		// try insert — UNIQUE(suggestion_id, voter_hash) makes this idempotent
		try {
			await db
				.insert(suggestionVotes)
				.values({ suggestionId: parsed.data.suggestionId, voterHash: vh })
				.onConflictDoNothing();
		} catch {
			// swallow — duplicate vote is a no-op
		}

		return { ok: true };
	},

	unvote: async ({ request, locals, getClientAddress }) => {
		if (!db) return fail(503);
		const body = await request.formData();
		const parsed = voteSchema.safeParse({ suggestionId: body.get('suggestionId') });
		if (!parsed.success) return fail(400);

		const ip = (() => {
			try {
				return getClientAddress();
			} catch {
				return null;
			}
		})();

		const vh = voterHash(ip, locals.visitorId);

		await db
			.delete(suggestionVotes)
			.where(
				and(
					eq(suggestionVotes.suggestionId, parsed.data.suggestionId),
					eq(suggestionVotes.voterHash, vh)
				)
			);

		return { ok: true };
	}
};
