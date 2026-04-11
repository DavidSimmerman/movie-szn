import { fail } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { db } from '$server/db';
import { suggestions, suggestionVotes } from '$db/schema';
import { checkRateLimit } from '$server/ratelimit';
import { hashIp, voterHash } from '$server/visitor';
import type { Actions, PageServerLoad } from './$types';

const schema = z.object({
	title: z.string().min(1, 'title required').max(200),
	year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal('')),
	imdbUrl: z.string().optional().default(''),
	submitterName: z.string().max(60).optional().default('')
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
			submitterName: suggestions.submitterName,
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
	submit: async ({ request, getClientAddress }) => {
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

		const rl = await checkRateLimit(`suggest:ip:${hashIp(ip)}`, 3, 'hour');
		if (!rl.allowed) {
			return message(form, 'too many suggestions this hour — try again later', { status: 429 });
		}

		const year = form.data.year === '' ? null : ((form.data.year as number | undefined) ?? null);

		await db.insert(suggestions).values({
			title: form.data.title.trim(),
			year,
			imdbUrl: form.data.imdbUrl?.trim() || null,
			submitterName: form.data.submitterName?.trim() || null
		});

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
