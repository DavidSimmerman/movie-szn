CREATE TYPE "public"."media_type" AS ENUM('movie', 'show');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'watching', 'added', 'declined');--> statement-breakpoint
CREATE TABLE "movie_seasons" (
	"movie_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movie_seasons_movie_id_season_id_pk" PRIMARY KEY("movie_id","season_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"year" integer NOT NULL,
	"type" "media_type" NOT NULL,
	"tmdb_id" integer,
	"imdb_id" text,
	"overview" text,
	"runtime_minutes" integer,
	"poster_url" text,
	"backdrop_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "movies_tmdb_id_unique" UNIQUE("tmdb_id"),
	CONSTRAINT "movies_imdb_id_unique" UNIQUE("imdb_id")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"bucket" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_bucket_window_start_pk" PRIMARY KEY("bucket","window_start")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movie_id" uuid NOT NULL,
	"production" numeric(3, 2) NOT NULL,
	"story_plot" numeric(3, 2) NOT NULL,
	"misc" numeric(3, 2) NOT NULL,
	"dave_factor" numeric(3, 2) NOT NULL,
	"combined_score" numeric(4, 2) GENERATED ALWAYS AS (((production + story_plot + misc + dave_factor) / 4.0 * 2.0)) STORED,
	"notes" text DEFAULT '' NOT NULL,
	"watched_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_ratings_range" CHECK ("reviews"."production" BETWEEN 0 AND 6
				AND "reviews"."story_plot" BETWEEN 0 AND 6
				AND "reviews"."misc" BETWEEN 0 AND 6
				AND "reviews"."dave_factor" BETWEEN 0 AND 6)
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"starts_at" date NOT NULL,
	"ends_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seasons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestion_votes" (
	"suggestion_id" uuid NOT NULL,
	"voter_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suggestion_votes_suggestion_id_voter_hash_pk" PRIMARY KEY("suggestion_id","voter_hash")
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"imdb_url" text,
	"submitter_name" text,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"resolved_movie_id" uuid,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movie_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"notes" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_list_movie_id_unique" UNIQUE("movie_id")
);
--> statement-breakpoint
ALTER TABLE "movie_seasons" ADD CONSTRAINT "movie_seasons_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_seasons" ADD CONSTRAINT "movie_seasons_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestion_votes" ADD CONSTRAINT "suggestion_votes_suggestion_id_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_resolved_movie_id_movies_id_fk" FOREIGN KEY ("resolved_movie_id") REFERENCES "public"."movies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_list" ADD CONSTRAINT "watch_list_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movies_year_idx" ON "movies" USING btree ("year");--> statement-breakpoint
CREATE INDEX "movies_type_idx" ON "movies" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_movie_unique" ON "reviews" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "watch_list_position_idx" ON "watch_list" USING btree ("position");--> statement-breakpoint
-- postgres features drizzle can't express natively
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "seasons"
	ADD CONSTRAINT "seasons_no_overlap"
	EXCLUDE USING gist (daterange(starts_at, ends_at, '[]') WITH &&);--> statement-breakpoint
CREATE OR REPLACE FUNCTION suggestion_vote_count_fn()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT' THEN
		UPDATE suggestions SET vote_count = vote_count + 1 WHERE id = NEW.suggestion_id;
	ELSIF TG_OP = 'DELETE' THEN
		UPDATE suggestions SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.suggestion_id;
	END IF;
	RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER suggestion_vote_count_trg
	AFTER INSERT OR DELETE ON suggestion_votes
	FOR EACH ROW EXECUTE FUNCTION suggestion_vote_count_fn();