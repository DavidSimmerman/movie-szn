import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { checkRateLimit } from '$server/ratelimit';
import { SESSION_COOKIE, createSession, verifyAdminPassword } from '$server/auth';
import { hashIp } from '$server/visitor';
import type { Actions, PageServerLoad } from './$types';

const schema = z.object({
	password: z.string().min(1, 'password required'),
	next: z.string().optional()
});

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.admin) {
		const next = url.searchParams.get('next') ?? '/admin';
		throw redirect(303, next);
	}
	const form = await superValidate(
		{ next: url.searchParams.get('next') ?? '/admin' },
		zod4(schema)
	);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const form = await superValidate(request, zod4(schema));
		if (!form.valid) return fail(400, { form });

		const ip = (() => {
			try {
				return getClientAddress();
			} catch {
				return null;
			}
		})();

		const rl = await checkRateLimit(`login:ip:${hashIp(ip)}`, 5, 'hour');
		if (!rl.allowed) {
			return message(form, 'too many attempts — try again later', { status: 429 });
		}

		const ok = await verifyAdminPassword(form.data.password);
		if (!ok) {
			return message(form, 'incorrect password', { status: 401 });
		}

		const { id, expiresAt } = await createSession();
		cookies.set(SESSION_COOKIE, id, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			expires: expiresAt
		});

		throw redirect(303, form.data.next || '/admin');
	}
};
