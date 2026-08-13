import { asc, desc, eq } from 'drizzle-orm';
import { db } from '$server/db';
import {
	awardCategories,
	awardWinners,
	listItems,
	lists,
	movies,
	movieSeasons,
	reviews,
	seasons,
	users,
	watchList
} from '$db/schema';

// The whole review library in one payload. The dataset is a personal collection
// (tens to low hundreds of titles), so it's cheaper to dump it than to make a
// client round-trip per movie. Six flat queries, joined in memory by id.

export type LibraryReview = {
	reviewer: string;
	production: number;
	acting: number;
	storyPlot: number;
	intent: number;
	daveFactor: number;
	combinedScore: number | null;
	notes: string;
	watchedAt: string | null;
};

export type LibraryAward = {
	season: string;
	category: string;
	tagline: string | null;
	rank: string;
	note: string | null;
	reviewer: string;
};

export type LibraryEntry = {
	slug: string;
	title: string;
	year: number;
	type: 'movie' | 'show';
	runtimeMinutes: number | null;
	overview: string | null;
	imdbId: string | null;
	tmdbId: number | null;
	// Season slugs repeat across reviewers (each keeps their own "2025"), so a tag
	// is only unambiguous with its owner.
	seasons: { slug: string; owner: string }[];
	reviews: LibraryReview[];
	awards: LibraryAward[];
};

export type Library = {
	owner: string | null;
	ratingScale: string;
	reviewers: { username: string; name: string; isAdmin: boolean; bio: string | null }[];
	seasons: { slug: string; name: string; startsAt: string; endsAt: string; owner: string }[];
	titles: LibraryEntry[];
	lists: {
		slug: string;
		name: string;
		description: string | null;
		orderMode: string;
		owner: string;
		titles: { slug: string; title: string; year: number }[];
	}[];
	watchlist: {
		position: number;
		title: string;
		year: number;
		slug: string;
		notes: string | null;
		owner: string;
	}[];
};

const RATING_SCALE =
	'Each of the five categories (production, acting, storyPlot, intent, daveFactor) is scored 0–6, ' +
	'where 5 is a perfect score and 6 is the rare "6 out of 5" flex. combinedScore is the mean of the ' +
	'five doubled onto a 0–10 scale, so anything above 10 means at least one category got a 6.';

const num = (v: string | null) => (v == null ? null : Number(v));

export async function buildLibrary(): Promise<Library> {
	if (!db) throw new Error('DATABASE_URL is not set');

	const [reviewerRows, seasonRows, reviewRows, seasonTagRows, awardRows, watchRows, listRows] =
		await Promise.all([
			db
				.select({
					username: users.username,
					name: users.name,
					isAdmin: users.isAdmin,
					bio: users.bio
				})
				.from(users)
				.orderBy(asc(users.createdAt)),
			db
				.select({
					slug: seasons.slug,
					name: seasons.name,
					startsAt: seasons.startsAt,
					endsAt: seasons.endsAt,
					owner: users.username
				})
				.from(seasons)
				.innerJoin(users, eq(users.id, seasons.userId))
				.orderBy(desc(seasons.startsAt)),
			db
				.select({
					movieId: movies.id,
					slug: movies.slug,
					title: movies.title,
					year: movies.year,
					type: movies.type,
					runtimeMinutes: movies.runtimeMinutes,
					overview: movies.overview,
					imdbId: movies.imdbId,
					tmdbId: movies.tmdbId,
					reviewId: reviews.id,
					reviewer: users.username,
					production: reviews.production,
					acting: reviews.acting,
					storyPlot: reviews.storyPlot,
					intent: reviews.intent,
					daveFactor: reviews.daveFactor,
					combinedScore: reviews.combinedScore,
					notes: reviews.notes,
					watchedAt: reviews.watchedAt
				})
				.from(reviews)
				.innerJoin(movies, eq(movies.id, reviews.movieId))
				.innerJoin(users, eq(users.id, reviews.userId))
				.orderBy(desc(reviews.combinedScore)),
			db
				.select({ movieId: movieSeasons.movieId, slug: seasons.slug, owner: users.username })
				.from(movieSeasons)
				.innerJoin(seasons, eq(seasons.id, movieSeasons.seasonId))
				.innerJoin(users, eq(users.id, seasons.userId)),
			db
				.select({
					reviewId: awardWinners.reviewId,
					rank: awardWinners.rank,
					note: awardWinners.note,
					isSpoiler: awardWinners.isSpoiler,
					category: awardCategories.name,
					tagline: awardCategories.tagline,
					season: seasons.slug,
					reviewer: users.username
				})
				.from(awardWinners)
				.innerJoin(awardCategories, eq(awardCategories.id, awardWinners.categoryId))
				.innerJoin(seasons, eq(seasons.id, awardCategories.seasonId))
				.innerJoin(reviews, eq(reviews.id, awardWinners.reviewId))
				.innerJoin(users, eq(users.id, reviews.userId))
				.orderBy(asc(awardCategories.sortOrder), asc(awardWinners.sortOrder)),
			db
				.select({
					position: watchList.position,
					notes: watchList.notes,
					title: movies.title,
					year: movies.year,
					slug: movies.slug,
					owner: users.username
				})
				.from(watchList)
				.innerJoin(movies, eq(movies.id, watchList.movieId))
				.innerJoin(users, eq(users.id, watchList.userId))
				.orderBy(asc(watchList.position)),
			// Curated lists are pure taste signal — what got grouped with what, and
			// under what name. A list can hold a title that was never reviewed.
			db
				.select({
					listId: lists.id,
					slug: lists.slug,
					name: lists.name,
					description: lists.description,
					orderMode: lists.orderMode,
					owner: users.username,
					movieSlug: movies.slug,
					movieTitle: movies.title,
					movieYear: movies.year
				})
				.from(lists)
				.innerJoin(users, eq(users.id, lists.userId))
				.leftJoin(listItems, eq(listItems.listId, lists.id))
				.leftJoin(movies, eq(movies.id, listItems.movieId))
				.orderBy(desc(lists.updatedAt), asc(listItems.position))
		]);

	const seasonsByMovie = new Map<string, { slug: string; owner: string }[]>();
	for (const t of seasonTagRows) {
		const list = seasonsByMovie.get(t.movieId) ?? [];
		list.push({ slug: t.slug, owner: t.owner });
		seasonsByMovie.set(t.movieId, list);
	}

	const awardsByReview = new Map<string, LibraryAward[]>();
	for (const a of awardRows) {
		const list = awardsByReview.get(a.reviewId) ?? [];
		list.push({
			season: a.season,
			category: a.category,
			tagline: a.tagline,
			rank: a.rank,
			// Spoiler notes stay out of the payload — the site hides them behind a
			// reveal, and a model has no way to re-hide one.
			note: a.isSpoiler ? null : a.note,
			reviewer: a.reviewer
		});
		awardsByReview.set(a.reviewId, list);
	}

	const titles = new Map<string, LibraryEntry>();
	for (const r of reviewRows) {
		let entry = titles.get(r.movieId);
		if (!entry) {
			entry = {
				slug: r.slug,
				title: r.title,
				year: r.year,
				type: r.type,
				runtimeMinutes: r.runtimeMinutes,
				overview: r.overview,
				imdbId: r.imdbId,
				tmdbId: r.tmdbId,
				seasons: seasonsByMovie.get(r.movieId) ?? [],
				reviews: [],
				awards: []
			};
			titles.set(r.movieId, entry);
		}
		entry.reviews.push({
			reviewer: r.reviewer,
			production: Number(r.production),
			acting: Number(r.acting),
			storyPlot: Number(r.storyPlot),
			intent: Number(r.intent),
			daveFactor: Number(r.daveFactor),
			combinedScore: num(r.combinedScore),
			notes: r.notes,
			watchedAt: r.watchedAt
		});
		entry.awards.push(...(awardsByReview.get(r.reviewId) ?? []));
	}

	const listsBySlug = new Map<string, Library['lists'][number]>();
	for (const r of listRows) {
		let list = listsBySlug.get(r.listId);
		if (!list) {
			list = {
				slug: r.slug,
				name: r.name,
				description: r.description,
				orderMode: r.orderMode,
				owner: r.owner,
				titles: []
			};
			listsBySlug.set(r.listId, list);
		}
		// The left join yields one null-movie row for an empty list.
		if (r.movieSlug) {
			list.titles.push({ slug: r.movieSlug, title: r.movieTitle!, year: r.movieYear! });
		}
	}

	return {
		owner: reviewerRows.find((u) => u.isAdmin)?.username ?? reviewerRows[0]?.username ?? null,
		ratingScale: RATING_SCALE,
		reviewers: reviewerRows,
		seasons: seasonRows,
		titles: [...titles.values()],
		lists: [...listsBySlug.values()],
		watchlist: watchRows
	};
}
