CREATE TABLE "voter_names" (
	"voter_hash" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
