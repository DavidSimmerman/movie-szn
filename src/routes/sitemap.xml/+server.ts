import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews, seasons, users } from '$db/schema';
import { getViewUser } from '$server/users';
import { profileHref } from '$lib/profile';

export const GET = async ({ url }) => {
	const origin = env.ORIGIN || url.origin;

	const staticPaths = ['/', '/reviews', '/watchlist', '/suggest', '/seasons'];

	const entries: string[] = [];
	for (const p of staticPaths) {
		entries.push(`\t<url><loc>${origin}${p}</loc></url>`);
	}

	const owner = await getViewUser(null);
	if (db && owner) {
		const reviewRows = await db
			.select({ slug: movies.slug, username: users.username })
			.from(reviews)
			.innerJoin(movies, eq(movies.id, reviews.movieId))
			.innerJoin(users, eq(users.id, reviews.userId));
		for (const r of reviewRows) {
			const path = profileHref(`/reviews/${r.slug}`, r.username, owner.username);
			entries.push(`\t<url><loc>${origin}${path}</loc></url>`);
		}

		const seasonRows = await db
			.select({ slug: seasons.slug, username: users.username })
			.from(seasons)
			.innerJoin(users, eq(users.id, seasons.userId));
		for (const s of seasonRows) {
			const path = profileHref(`/seasons/${s.slug}`, s.username, owner.username);
			entries.push(`\t<url><loc>${origin}${path}</loc></url>`);
		}
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
