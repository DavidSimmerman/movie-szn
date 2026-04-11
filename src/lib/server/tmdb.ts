import { env } from '$env/dynamic/private';

const BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

export type TmdbSearchResult = {
	id: number;
	title: string;
	year: number | null;
	type: 'movie' | 'show';
	overview: string;
	posterUrl: string | null;
	backdropUrl: string | null;
};

export type TmdbMovieDetails = TmdbSearchResult & {
	runtimeMinutes: number | null;
	imdbId: string | null;
	raw: unknown;
};

function apiKey(): string {
	const k = env.TMDB_API_KEY;
	if (!k) throw new Error('TMDB_API_KEY not set');
	return k;
}

function yearFromDate(s: string | null | undefined): number | null {
	if (!s) return null;
	const n = parseInt(s.slice(0, 4), 10);
	return Number.isFinite(n) ? n : null;
}

function img(path: string | null | undefined, base: string): string | null {
	return path ? `${base}${path}` : null;
}

export async function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
	if (!query.trim()) return [];
	const url = new URL(`${BASE}/search/multi`);
	url.searchParams.set('query', query);
	url.searchParams.set('include_adult', 'false');
	url.searchParams.set('language', 'en-US');
	url.searchParams.set('api_key', apiKey());

	const res = await fetch(url);
	if (!res.ok) throw new Error(`tmdb search failed: ${res.status}`);

	const data = (await res.json()) as {
		results: Array<{
			id: number;
			media_type: string;
			title?: string;
			name?: string;
			release_date?: string;
			first_air_date?: string;
			overview?: string;
			poster_path?: string | null;
			backdrop_path?: string | null;
		}>;
	};

	return data.results
		.filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
		.slice(0, 10)
		.map((r) => ({
			id: r.id,
			title: r.title ?? r.name ?? '(untitled)',
			year: yearFromDate(r.release_date ?? r.first_air_date),
			type: r.media_type === 'tv' ? ('show' as const) : ('movie' as const),
			overview: r.overview ?? '',
			posterUrl: img(r.poster_path, POSTER_BASE),
			backdropUrl: img(r.backdrop_path, BACKDROP_BASE)
		}));
}

export async function fetchTmdbDetails(
	tmdbId: number,
	type: 'movie' | 'show'
): Promise<TmdbMovieDetails> {
	const path = type === 'movie' ? `movie/${tmdbId}` : `tv/${tmdbId}`;
	const url = new URL(`${BASE}/${path}`);
	url.searchParams.set('api_key', apiKey());
	url.searchParams.set('language', 'en-US');
	if (type === 'movie') url.searchParams.set('append_to_response', 'external_ids');

	const res = await fetch(url);
	if (!res.ok) throw new Error(`tmdb details failed: ${res.status}`);
	const d = (await res.json()) as {
		id: number;
		title?: string;
		name?: string;
		release_date?: string;
		first_air_date?: string;
		overview?: string;
		poster_path?: string | null;
		backdrop_path?: string | null;
		runtime?: number | null;
		episode_run_time?: number[];
		imdb_id?: string | null;
		external_ids?: { imdb_id?: string | null };
	};

	const runtimeMinutes =
		type === 'movie'
			? (d.runtime ?? null)
			: (d.episode_run_time && d.episode_run_time[0]) || null;

	return {
		id: d.id,
		title: d.title ?? d.name ?? '(untitled)',
		year: yearFromDate(d.release_date ?? d.first_air_date),
		type,
		overview: d.overview ?? '',
		posterUrl: img(d.poster_path, POSTER_BASE),
		backdropUrl: img(d.backdrop_path, BACKDROP_BASE),
		runtimeMinutes,
		imdbId: d.imdb_id ?? d.external_ids?.imdb_id ?? null,
		raw: d
	};
}
