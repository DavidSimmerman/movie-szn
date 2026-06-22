import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { SESSION_COOKIE, authenticate, createSession } from '$server/auth';
import type { Actions, PageServerLoad } from './$types';

const schema = z.object({
	username: z.string().min(1, 'username required'),
	password: z.string().min(1, 'password required'),
	next: z.string().optional()
});

/** Only allow same-origin relative paths as a post-login redirect target. */
function safeNext(next: string | undefined): string {
	return next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(303, safeNext(url.searchParams.get('next') ?? undefined));
	}
	const form = await superValidate(
		{ next: url.searchParams.get('next') ?? '/admin' },
		zod4(schema)
	);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(schema));
		if (!form.valid) return fail(400, { form });

		const user = await authenticate(form.data.username, form.data.password);
		if (!user) {
			return message(form, 'incorrect username or password', { status: 401 });
		}

		const { id, expiresAt } = await createSession(user.id);
		cookies.set(SESSION_COOKIE, id, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			expires: expiresAt
		});

		throw redirect(303, safeNext(form.data.next));
	}
};
