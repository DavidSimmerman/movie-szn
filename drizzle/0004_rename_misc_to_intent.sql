ALTER TABLE "reviews" DROP COLUMN "combined_score";--> statement-breakpoint
ALTER TABLE "reviews" RENAME COLUMN "misc" TO "intent";--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_ratings_range";--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_ratings_range" CHECK ("reviews"."production" BETWEEN 0 AND 6
				AND "reviews"."acting" BETWEEN 0 AND 6
				AND "reviews"."story_plot" BETWEEN 0 AND 6
				AND "reviews"."intent" BETWEEN 0 AND 6
				AND "reviews"."dave_factor" BETWEEN 0 AND 6);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "combined_score" numeric(4, 2) GENERATED ALWAYS AS (((production + acting + story_plot + intent + dave_factor) / 5.0 * 2.0)) STORED;
