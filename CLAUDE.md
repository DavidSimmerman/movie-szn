# movie-szn

Personal movie & TV review site built around "movie season" (April–August) tagging. Dave is the sole reviewer; public can suggest and upvote without accounts. Self-hosted on Coolify.

## Commands

```
npm run dev               # vite dev (needs `npm run db:up` first)
npm run build             # production build
npm run check             # svelte-check + tsc
npm run lint              # prettier --check + eslint
npm run format            # prettier --write
npm run test              # vitest (unit)
npm run e2e               # playwright smokes

npm run db:up             # start local postgres (docker compose)
npm run db:down           # stop local postgres
npm run db:generate       # drizzle-kit generate (after schema changes)
npm run db:push           # dev-only: push schema without migration files
npm run db:migrate        # apply migrations (prod path, runs in container too)
npm run db:studio         # drizzle-kit studio (UI at localhost:4983)
npm run db:seed           # tsx scripts/seed.ts

npm run hash-password -- <password>   # print argon2id hash for ADMIN_PASSWORD_HASH
```

## Stack

Svelte 5 runes · SvelteKit · TS strict · Tailwind v4 (`@theme` in `src/app.css`, **no** `tailwind.config.js`) · Drizzle + `postgres.js` · `sveltekit-superforms` + zod · `@node-rs/argon2` · `cheerio` · `pino` · adapter-node + Coolify + Dockerfile.

## Architecture map

- `src/lib/server/db/schema.ts` — all tables. `combined_score` is a Postgres generated column. Ratings are `numeric(3,2)`, constrained 0–6.
- `src/lib/server/db/index.ts` — drizzle client, DB-null-safe for local dev without `DATABASE_URL`.
- `src/lib/server/auth.ts` — hand-rolled sessions (argon2id admin password, DB-backed session rows).
- `src/lib/server/ratelimit.ts` — fixed hourly windows via UPSERT on `(bucket, window_start)`.
- `src/lib/server/tmdb.ts` / `imdb.ts` — metadata fetchers. IMDB parses JSON-LD.
- `src/lib/server/visitor.ts` — voter hash = `sha256(ipHash + vid cookie + AUTH_SECRET)`.
- `src/hooks.server.ts` — sets `event.locals.admin` + `visitorId`, guards `/admin/*`, serves the OAuth discovery documents, and re-implements SvelteKit's CSRF check (disabled in `svelte.config.js`) with `/token` exempt.
- `src/routes/mcp/+server.ts` — read-only MCP server (one tool, `get_library`) for the Claude connector. `src/lib/server/library.ts` builds the payload; `src/lib/server/oauth.ts` + `/authorize`, `/token`, `/register` are the authorization server. Verify with `npm run mcp:smoke -- <origin>`.
- `src/routes/(admin)/` — protected route group; the `(admin)/+layout.server.ts` enforces the session.
- `src/app.css` — design tokens live here in `@theme`. No separate config file.
- `scripts/migrate.js` — runs on container boot before the app starts.

## Conventions

- **Svelte 5 runes only.** `$state`, `$derived`, `$props`, `$effect`. Never `let x = writable(...)`, never `$:`.
- **Server-only code lives under `src/lib/server/`** — never import from client code. Use the `$server` / `$db` aliases.
- **Forms** use `sveltekit-superforms` + a colocated zod schema. Always progressively enhance.
- **DB writes** go through Drizzle's query builder. Raw SQL (`sql\`...\``) only for generated columns, triggers, and EXCLUDE constraints.
- **Slugs** are derived once at movie insert (`slugify(title) + '-' + year`) and never regenerated — stable URLs.
- **Timestamps** are `timestamp({ withTimezone: true })`, always. Dates (not timestamps) for `watched_at` and season bounds.
- **Ratings** are stored as `numeric(3,2)`. Pass strings to Drizzle, not numbers. Display via `Number()` at the last moment.
- **Rate limits** use `(bucket, date_trunc('hour', now()))` as composite key. Don't try to do sliding windows in SQL.
- **Imports** prefer named, absolute via `$lib`, `$server`, `$db`. Avoid relative dotdot paths.

## Design system (cinematic)

Tokens in `src/app.css` under `@theme`. Do not add colors outside the palette without updating tokens.

- Palette: obsidian `--color-bg`, amber `--color-accent` (projector bulb), crimson `--color-accent-2` (curtain), gold `--color-gold` (for the 6/5 flex — reserve for ratings > 10 only).
- Fonts: `--font-display` Fraunces (headings, hero), `--font-sans` Inter (body), `--font-mono` JetBrains Mono (ratings, labels, metadata chips).
- **Signature motion** — use these, don't invent new ones:
  - Projector flicker on first hero load per session.
  - Film grain overlay via SVG `feTurbulence`.
  - Rating count-up with spring easing (600ms).
  - Poster-card lift with warm glow shadow.
  - Scroll-driven backdrop parallax via CSS `animation-timeline: view()`.
  - Marquee ticker for current-season titles.
  - Curtain transition (home → review only).
- **Everything must respect `prefers-reduced-motion`**. The global CSS already kills durations under that media query; don't re-enable animations inside components without checking.

## Don't

- Don't write `tailwind.config.js` — tokens go in `@theme`.
- Don't use `real`/`double precision` for ratings — `numeric` only.
- Don't store `is_active` on seasons — compute from `now() BETWEEN starts_at AND ends_at`.
- Don't add auth libraries. Lucia is archived; the custom session module is ~40 lines and lives in `src/lib/server/auth.ts`.
- Don't commit `.env*` files (only `.env.example`).
- Don't add JS for things CSS can do (transitions, parallax, hover effects).
- Don't add inline comments explaining WHAT code does — only non-obvious WHY, and only when necessary.
- Don't introduce state managers. Page state belongs in `$state`; server state belongs in `load` functions.
- Don't skip `prefers-reduced-motion` in any new animation.
- Don't generate slugs more than once per movie.
- Don't trust client-supplied IPs — read via `ADDRESS_HEADER`.

## Environment

All env vars documented in `.env.example`. For local dev: `cp .env.example .env.local` and fill in. Generate the admin hash with `npm run hash-password -- yourpassword`. Generate `AUTH_SECRET` with `openssl rand -base64 32`.

## Deployment

Coolify watches the git repo, builds with the root `Dockerfile` (multi-stage, node:22-alpine, npm), and runs `node scripts/migrate.js && node build` on start. Health check at `/healthz`. Required env vars for Coolify:

```
DATABASE_URL, ORIGIN, PROTOCOL_HEADER=x-forwarded-proto,
HOST_HEADER=x-forwarded-host, ADDRESS_HEADER=x-forwarded-for,
ADMIN_PASSWORD_HASH, AUTH_SECRET, TMDB_API_KEY, LOG_LEVEL=info,
MCP_AUTH_PASSWORD
```

**Coolify gotchas**: set the health check path to `/healthz` (default is `/`). Use a persistent volume for the Postgres service. Turn on scheduled PG backups in the UI. Mount a persistent volume at `/app/og-cache` so the Playwright-generated OG preview (`scripts/og-screenshot.js`, refreshed every 3h by `src/lib/server/og-schedule.ts`) survives restarts.
