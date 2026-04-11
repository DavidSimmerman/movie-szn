# movie-szn

A personal, cinematic movie & TV review site built around the concept of "movie season" — April through the end of August, when the watching gets serious. Dave is the sole reviewer. The public can suggest what to watch next and upvote each other's picks, no signup required.

## The rating system

Four category scores, each 0–5 with decimals. You can rate a category `6/5` when you really loved it. The combined score is `(production + story_plot + misc + dave_factor) / 4 × 2`, so it lives on a /10 scale — except when every category maxes out, and then you get a **12/10 flex**.

| Category     | Covers                                                              |
| ------------ | ------------------------------------------------------------------- |
| Production   | craft, cinematography, direction, sound design                      |
| Story / plot | writing, pacing, structure, payoff                                  |
| Misc         | humor, world building, vibes, the stuff that doesn't fit the others |
| Dave factor  | how much Dave personally enjoyed it                                 |

## Features

- **Reviews** — one per movie or show, with per-category scores and a notes writeup
- **Watch list** — Dave's ordered queue of what's coming up
- **Suggestions** — public can submit a movie and upvote others
- **Seasons** — tag movies to a movie season (April–end of August)

## Running locally

You need Docker and Node 22+.

```bash
npm install
npm run db:up          # start local postgres
cp .env.example .env.local
# fill in ADMIN_PASSWORD_HASH (npm run hash-password -- yourpass) + AUTH_SECRET (openssl rand -base64 32) + TMDB_API_KEY
npm run db:push        # push schema to local db
npm run db:seed        # seed dev data (optional)
npm run dev            # open http://localhost:5173
```

## Deployment (Coolify)

1. Push this repo to git
2. In Coolify, create a new application from the repo, build pack = **Dockerfile**
3. Create a Postgres service in the same project; use its internal connection string for `DATABASE_URL`
4. Configure env vars (see `.env.example` and `CLAUDE.md` for the full list Coolify needs — `ORIGIN`, `PROTOCOL_HEADER`, `HOST_HEADER`, `ADDRESS_HEADER` are **mandatory** for adapter-node behind a reverse proxy)
5. Set the health check path to `/healthz`
6. Deploy

Migrations run automatically on container start via `scripts/migrate.js`.

## See also

- `CLAUDE.md` — conventions, architecture, design system
