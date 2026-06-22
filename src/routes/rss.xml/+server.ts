import { env } from '$env/dynamic/private';
import { desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import { movies, reviews } from '$db/schema';
import { getViewUser } from '$server/users';
import { toNumber, formatPublicScore } from '$lib/ratings';

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET = async ({ url }) => {
	const origin = env.ORIGIN || url.origin;

	let body = '';
	const owner = await getViewUser(null);
	if (db && owner) {
		const rows = await db
			.select({
				slug: movies.slug,
				title: movies.title,
				year: movies.year,
				notes: reviews.notes,
				combinedScore: reviews.combinedScore,
				createdAt: reviews.createdAt
			})
			.from(reviews)
			.innerJoin(movies, eq(movies.id, reviews.movieId))
			.where(eq(reviews.userId, owner.id))
			.orderBy(desc(reviews.createdAt))
			.limit(40);

		body = rows
			.map((r) => {
				const score = formatPublicScore(toNumber(r.combinedScore));
				const link = `${origin}/reviews/${r.slug}`;
				const description = `<![CDATA[<p><strong>${score}/10</strong></p><p>${escapeXml(
					r.notes || ''
				).slice(0, 500)}</p>]]>`;
				return `<item>
		<title>${escapeXml(r.title)} (${r.year}) — ${score}/10</title>
		<link>${link}</link>
		<guid isPermaLink="true">${link}</guid>
		<pubDate>${r.createdAt.toUTCString()}</pubDate>
		<description>${description}</description>
	</item>`;
			})
			.join('\n\t');
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
	<title>movie-szn</title>
	<link>${origin}</link>
	<description>dave reviews movies and tv. four scores, one verdict.</description>
	<language>en-us</language>
	<atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
	${body}
</channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=600'
		}
	});
};
