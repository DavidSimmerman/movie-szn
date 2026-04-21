CREATE TYPE "public"."award_rank" AS ENUM('first', 'second', 'third', 'honorable');--> statement-breakpoint
CREATE TABLE "award_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"allows_multiple" boolean DEFAULT false NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "award_winners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"review_id" uuid NOT NULL,
	"rank" "award_rank" NOT NULL,
	"note" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "award_categories" ADD CONSTRAINT "award_categories_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_winners" ADD CONSTRAINT "award_winners_category_id_award_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."award_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_winners" ADD CONSTRAINT "award_winners_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "award_categories_season_name_unique" ON "award_categories" USING btree ("season_id", "name");--> statement-breakpoint
CREATE INDEX "award_categories_season_order_idx" ON "award_categories" USING btree ("season_id", "sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "award_winners_unique_podium" ON "award_winners" USING btree ("category_id", "rank") WHERE "rank" <> 'honorable';--> statement-breakpoint
CREATE UNIQUE INDEX "award_winners_unique_review" ON "award_winners" USING btree ("category_id", "review_id");
