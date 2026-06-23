import { sql } from 'drizzle-orm';
import {
	boolean,
	check,
	customType,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
	dataType() {
		return 'bytea';
	}
});

export const mediaType = pgEnum('media_type', ['movie', 'show']);
export const suggestionStatus = pgEnum('suggestion_status', [
	'pending',
	'watching',
	'added',
	'declined'
]);
export const awardRank = pgEnum('award_rank', ['first', 'second', 'third', 'honorable']);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	username: text('username').notNull().unique(),
	name: text('name').notNull(),
	avatarUrl: text('avatar_url'),
	passwordHash: text('password_hash').notNull(),
	isAdmin: boolean('is_admin').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// Uploaded avatar blobs live here (not on `users`) so user lookups never pull the
// bytes. `users.avatar_url` points at /avatar/<username> when one is stored.
export const userAvatars = pgTable('user_avatars', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	data: bytea('data').notNull(),
	contentType: text('content_type').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const movies = pgTable(
	'movies',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		slug: text('slug').notNull().unique(),
		title: text('title').notNull(),
		year: integer('year').notNull(),
		type: mediaType('type').notNull(),
		tmdbId: integer('tmdb_id').unique(),
		imdbId: text('imdb_id').unique(),
		overview: text('overview'),
		runtimeMinutes: integer('runtime_minutes'),
		posterUrl: text('poster_url'),
		backdropUrl: text('backdrop_url'),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('movies_year_idx').on(t.year), index('movies_type_idx').on(t.type)]
);

export const reviews = pgTable(
	'reviews',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		movieId: uuid('movie_id')
			.notNull()
			.references(() => movies.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		production: numeric('production', { precision: 3, scale: 2 }).notNull(),
		acting: numeric('acting', { precision: 3, scale: 2 }).notNull(),
		storyPlot: numeric('story_plot', { precision: 3, scale: 2 }).notNull(),
		intent: numeric('intent', { precision: 3, scale: 2 }).notNull(),
		daveFactor: numeric('dave_factor', { precision: 3, scale: 2 }).notNull(),
		combinedScore: numeric('combined_score', {
			precision: 4,
			scale: 2
		}).generatedAlwaysAs(
			sql`((production + acting + story_plot + intent + dave_factor) / 5.0 * 2.0)`
		),
		notes: text('notes').notNull().default(''),
		watchedAt: date('watched_at'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('reviews_user_movie_unique').on(t.userId, t.movieId),
		check(
			'reviews_ratings_range',
			sql`${t.production} BETWEEN 0 AND 6
				AND ${t.acting} BETWEEN 0 AND 6
				AND ${t.storyPlot} BETWEEN 0 AND 6
				AND ${t.intent} BETWEEN 0 AND 6
				AND ${t.daveFactor} BETWEEN 0 AND 6`
		)
	]
);

export const seasons = pgTable(
	'seasons',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		slug: text('slug').notNull(),
		name: text('name').notNull(),
		startsAt: date('starts_at').notNull(),
		endsAt: date('ends_at').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [uniqueIndex('seasons_user_slug_unique').on(t.userId, t.slug)]
);

export const movieSeasons = pgTable(
	'movie_seasons',
	{
		movieId: uuid('movie_id')
			.notNull()
			.references(() => movies.id, { onDelete: 'cascade' }),
		seasonId: uuid('season_id')
			.notNull()
			.references(() => seasons.id, { onDelete: 'cascade' }),
		addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [primaryKey({ columns: [t.movieId, t.seasonId] })]
);

export const watchList = pgTable(
	'watch_list',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		movieId: uuid('movie_id')
			.notNull()
			.references(() => movies.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
		notes: text('notes'),
		addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('watch_list_user_movie_unique').on(t.userId, t.movieId),
		index('watch_list_position_idx').on(t.position)
	]
);

export const suggestions = pgTable('suggestions', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	year: integer('year'),
	imdbUrl: text('imdb_url'),
	submitterName: text('submitter_name'),
	notes: text('notes'),
	status: suggestionStatus('status').notNull().default('pending'),
	resolvedMovieId: uuid('resolved_movie_id').references(() => movies.id, { onDelete: 'set null' }),
	voteCount: integer('vote_count').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const suggestionVotes = pgTable(
	'suggestion_votes',
	{
		suggestionId: uuid('suggestion_id')
			.notNull()
			.references(() => suggestions.id, { onDelete: 'cascade' }),
		voterHash: text('voter_hash').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [primaryKey({ columns: [t.suggestionId, t.voterHash] })]
);

export const voterNames = pgTable('voter_names', {
	voterHash: text('voter_hash').primaryKey(),
	name: text('name').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const awardCategories = pgTable(
	'award_categories',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		seasonId: uuid('season_id')
			.notNull()
			.references(() => seasons.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		tagline: text('tagline'),
		allowsMultiple: boolean('allows_multiple').notNull().default(false),
		sortOrder: integer('sort_order').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('award_categories_season_name_unique').on(t.seasonId, t.name),
		index('award_categories_season_order_idx').on(t.seasonId, t.sortOrder)
	]
);

export const awardWinners = pgTable(
	'award_winners',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		categoryId: uuid('category_id')
			.notNull()
			.references(() => awardCategories.id, { onDelete: 'cascade' }),
		reviewId: uuid('review_id')
			.notNull()
			.references(() => reviews.id, { onDelete: 'cascade' }),
		rank: awardRank('rank').notNull(),
		note: text('note'),
		sortOrder: integer('sort_order').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('award_winners_unique_podium')
			.on(t.categoryId, t.rank)
			.where(sql`${t.rank} <> 'honorable'`),
		uniqueIndex('award_winners_unique_review').on(t.categoryId, t.reviewId)
	]
);

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const rateLimits = pgTable(
	'rate_limits',
	{
		bucket: text('bucket').notNull(),
		windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
		count: integer('count').notNull().default(0)
	},
	(t) => [primaryKey({ columns: [t.bucket, t.windowStart] })]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;
export type WatchListEntry = typeof watchList.$inferSelect;
export type Suggestion = typeof suggestions.$inferSelect;
export type SuggestionVote = typeof suggestionVotes.$inferSelect;
export type AwardCategory = typeof awardCategories.$inferSelect;
export type NewAwardCategory = typeof awardCategories.$inferInsert;
export type AwardWinner = typeof awardWinners.$inferSelect;
export type NewAwardWinner = typeof awardWinners.$inferInsert;
