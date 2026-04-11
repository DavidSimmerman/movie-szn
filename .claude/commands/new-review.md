---
description: Scaffold a new review end-to-end — search TMDB, import the movie, open the review form.
argument-hint: [title]
---

You are helping Dave create a new movie review. Steps:

1. If `$ARGUMENTS` has a title, search TMDB via `src/lib/server/tmdb.ts` for candidates. Otherwise ask which movie.
2. Present top 5 results with year + type (movie/show) in a numbered list. Dave picks one.
3. Insert (or find) the movie row via the existing admin import flow at `src/routes/(admin)/admin/movies/new/+page.server.ts`.
4. Open/scaffold the review creation action in `src/routes/(admin)/admin/reviews/new/+page.server.ts` prefilled with the movie id.
5. Remind Dave of the rating scale: each category 0–5 decimals allowed, 6/5 permitted for all-timers. The combined score is computed automatically.
6. Ask if the new movie should also be tagged to the current season and added to the watch list.

Do not guess ratings. Let Dave fill them in.
