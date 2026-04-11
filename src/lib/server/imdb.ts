import * as cheerio from 'cheerio';

export type ImdbExtracted = {
	title: string;
	year: number | null;
	type: 'movie' | 'show';
	runtimeMinutes: number | null;
	overview: string;
	posterUrl: string | null;
	imdbId: string;
};

const USER_AGENT = 'Mozilla/5.0 (compatible; movie-szn/0.1; +personal movie review project)';

function imdbIdFromUrl(url: string): string | null {
	const match = url.match(/\/title\/(tt\d+)/);
	return match ? match[1] : null;
}

function parseRuntime(raw: unknown): number | null {
	if (typeof raw !== 'string') return null;
	// ISO-8601 duration like "PT2H22M"
	const iso = raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
	if (iso) {
		const h = parseInt(iso[1] ?? '0', 10);
		const m = parseInt(iso[2] ?? '0', 10);
		return h * 60 + m;
	}
	return null;
}

/**
 * Fetch an IMDB title page and extract metadata from the JSON-LD <script> block.
 * This is a manual fallback for movies TMDB doesn't have — use sparingly.
 */
export async function scrapeImdbUrl(url: string): Promise<ImdbExtracted> {
	const imdbId = imdbIdFromUrl(url);
	if (!imdbId) throw new Error('not a valid imdb title url');

	const res = await fetch(url, {
		headers: {
			'User-Agent': USER_AGENT,
			'Accept-Language': 'en-US,en;q=0.9'
		}
	});
	if (!res.ok) throw new Error(`imdb fetch failed: ${res.status}`);

	const html = await res.text();
	const $ = cheerio.load(html);

	let data: Record<string, unknown> | null = null;
	$('script[type="application/ld+json"]').each((_, el) => {
		if (data) return;
		try {
			const parsed = JSON.parse($(el).contents().text());
			if (parsed && (parsed['@type'] === 'Movie' || parsed['@type'] === 'TVSeries')) {
				data = parsed;
			}
		} catch {
			// ignore malformed blocks
		}
	});

	if (!data) throw new Error('no json-ld metadata found on page');

	const node = data as Record<string, unknown>;
	const typeRaw = node['@type'];
	const type: 'movie' | 'show' = typeRaw === 'TVSeries' ? 'show' : 'movie';

	const title = typeof node.name === 'string' ? node.name : '(untitled)';
	const datePublished = node.datePublished as string | undefined;
	const year = datePublished ? parseInt(datePublished.slice(0, 4), 10) || null : null;
	const description =
		typeof node.description === 'string' ? node.description.replace(/\s+/g, ' ').trim() : '';
	const posterUrl = typeof node.image === 'string' ? node.image : null;
	const runtimeMinutes = parseRuntime(node.duration);

	return {
		title,
		year,
		type,
		runtimeMinutes,
		overview: description,
		posterUrl,
		imdbId
	};
}
