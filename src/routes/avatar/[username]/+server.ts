import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$server/db';
import { userAvatars, users } from '$db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	if (!db) throw error(503, 'database not configured');

	const rows = await db
		.select({ data: userAvatars.data, contentType: userAvatars.contentType })
		.from(userAvatars)
		.innerJoin(users, eq(users.id, userAvatars.userId))
		.where(eq(users.username, params.username))
		.limit(1);
	const avatar = rows[0];
	if (!avatar) throw error(404, 'no avatar');

	return new Response(new Uint8Array(avatar.data), {
		headers: {
			'content-type': avatar.contentType,
			'x-content-type-options': 'nosniff',
			// the avatar_url is versioned (?v=updatedAt), so a hit is safe to cache hard
			'cache-control': 'public, max-age=31536000, immutable'
		}
	});
};
