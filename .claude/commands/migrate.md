---
description: Generate and review a new Drizzle migration after a schema change.
argument-hint: <migration name (kebab-case)>
---

1. Check `git status` to confirm there's a pending change to `src/lib/server/db/schema.ts`.
2. Run `npx drizzle-kit generate --name=$ARGUMENTS`.
3. Read the generated file under `drizzle/` and summarize what changed.
4. Flag anything that looks dangerous:
   - DROP COLUMN / DROP TABLE — confirm with Dave before proceeding
   - NOT NULL added to existing column without a default — needs a backfill step
   - Raw SQL blocks that aren't generated columns, CHECKs, EXCLUDEs, or triggers
5. Remind Dave that the migration will run automatically on next container boot via `scripts/migrate.js`.

Do **not** run `drizzle-kit push` — that's dev-local only and skips migrations.
