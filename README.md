# movie-szn

A personal, cinematic movie & TV review site built around the concept of "movie season" — April through the end of August, when the watching gets serious. Dave is the sole reviewer. The public can suggest what to watch next and upvote each other's picks, no signup required.

**Live at [movie-szn.simmerman.tech](https://movie-szn.simmerman.tech)**

<a href="https://movie-szn.simmerman.tech">
  <img src="docs/preview.png" alt="movie-szn — a time of year dedicated to giving great movies the attention they deserve" width="100%" />
</a>

## Why movie season?

movie-szn started as a frustration with holiday movies. Every Christmas morning my family puts on _A Christmas Story_ and leaves it running. I can't stand it, but I've seen it at least once a year for my entire life — which makes it, by raw count, the movie I've watched more than any other. Nothing else comes close.

It isn't just my family. People talk about their yearly Christmas rewatch like a ritual, and fair enough. But ask those same people to name their favorite films and a holiday movie almost never makes the cut. The ones they love most and the ones they watch most end up on two different lists, and it's those yearly holiday rewatches quietly running up the count.

So where's the love for the actual greats? Why don't we make a tradition of rewatching the all-time classics every year?

I'm a sports guy — college basketball, college football, the NFL. September through April there are usually four games running at once and a movie doesn't make the screen. The other half of the year is a sports dead zone (baseball aside — yuck), so I carved it off and called it movie season: time to rewatch the ones I love and finally get to the ones I've been meaning to.

This site documents each season to keep track of the movies I really enjoy, and gives friends a chance to suggest picks and ride along on the fun.

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
