import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$server/db';
import { suggestions } from '$db/schema';
import type { Actions, PageServerLoad } from './$types';

const statusSchema = z.enum(['pending', 'watching', 'added', 'declined']);

export const load: PageServerLoad = async () => {
	if (!db) return { suggestions: [] };
	const rows = await db
		.select()
		.from(suggestions)
		.orderBy(desc(suggestions.voteCount), desc(suggestions.createdAt));
	return { suggestions: rows };
};

export const actions: Actions = {
	setStatus: async ({ request }) => {
		if (!db) return fail(503);
		const body = await request.formData();
		const parsed = z
			.object({ id: z.uuid(), status: statusSchema })
			.safeParse({ id: body.get('id'), status: body.get('status') });
		if (!parsed.success) return fail(400);
		await db
			.update(suggestions)
			.set({ status: parsed.data.status })
			.where(eq(suggestions.id, parsed.data.id));
		return { ok: true };
	},
	remove: async ({ request }) => {
		if (!db) return fail(503);
		const body = await request.formData();
		const id = body.get('id');
		if (typeof id !== 'string') return fail(400);
		await db.delete(suggestions).where(eq(suggestions.id, id));
		return { ok: true };
	}
};
