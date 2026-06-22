-- Multi-user: users table + per-user ownership on reviews/seasons/watch_list.
-- Hand-written (drizzle snapshots had pre-existing drift). Backfills all existing
-- rows to the owner ("dave"); migrate.js sets the owner's real password hash from
-- ADMIN_PASSWORD_HASH on boot.
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
INSERT INTO "users" ("username", "name", "password_hash", "is_admin")
VALUES ('dave', 'Dave', 'pending-setup', true)
ON CONFLICT ("username") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "user_id" uuid;--> statement-breakpoint
UPDATE "reviews" SET "user_id" = (SELECT "id" FROM "users" WHERE "is_admin" = true ORDER BY "created_at" LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP INDEX "reviews_movie_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_user_movie_unique" ON "reviews" USING btree ("user_id","movie_id");--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "user_id" uuid;--> statement-breakpoint
UPDATE "seasons" SET "user_id" = (SELECT "id" FROM "users" WHERE "is_admin" = true ORDER BY "created_at" LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" DROP CONSTRAINT "seasons_slug_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_user_slug_unique" ON "seasons" USING btree ("user_id","slug");--> statement-breakpoint
-- season date ranges are now no-overlap *per user* (each reviewer has their own calendar).
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "seasons" DROP CONSTRAINT "seasons_no_overlap";--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_no_overlap" EXCLUDE USING gist ("user_id" WITH =, daterange("starts_at", "ends_at", '[]') WITH &&);--> statement-breakpoint
ALTER TABLE "watch_list" ADD COLUMN "user_id" uuid;--> statement-breakpoint
UPDATE "watch_list" SET "user_id" = (SELECT "id" FROM "users" WHERE "is_admin" = true ORDER BY "created_at" LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "watch_list" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_list" ADD CONSTRAINT "watch_list_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_list" DROP CONSTRAINT "watch_list_movie_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "watch_list_user_movie_unique" ON "watch_list" USING btree ("user_id","movie_id");--> statement-breakpoint
DELETE FROM "sessions";--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
