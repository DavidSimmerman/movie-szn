ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "traits" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "users" SET
	"bio" = 'Sole proprietor of movie szn. Watches everything twice — once for the story, once for the craft — and is firmly convinced a great needle-drop can rescue a shaky third act. Harshest on the films he loves most.',
	"traits" = '[{"label":"Overly Critical","stars":4},{"label":"Sucker for a Twist","stars":4.5},{"label":"Allergic to Slow Burns","stars":3.5}]'::jsonb
WHERE "username" = 'dave' AND "bio" IS NULL;