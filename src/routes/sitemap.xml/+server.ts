import { env } from '$env/dynamic/private';
import { db } from '$server/db';
import { movies, seasons } from '$db/schema';

export const GET = async ({ url }) => {
	const origin = env.ORIGIN || url.origin;

	const staticPaths = ['/', '/reviews', '/watchlist', '/suggest', '/seasons'];

	const entries: string[] = [];
	for (const p of staticPaths) {
		entries.push(`\t<url><loc>${origin}${p}</loc></url>`);
	}

	if (db) {
		const movieRows = await db.select({ slug: movies.slug }).from(movies);
		for (const m of movieRows) {
			entries.push(`\t<url><loc>${origin}/reviews/${m.slug}</loc></url>`);
		}
		const seasonRows = await db.select({ slug: seasons.slug }).from(seasons);
		for (const s of seasonRows) {
			entries.push(`\t<url><loc>${origin}/seasons/${s.slug}</loc></url>`);
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
