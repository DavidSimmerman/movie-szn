---
description: Search TMDB and print the movie JSON ready to paste into a seed or import manually.
argument-hint: <title>
---

Use `src/lib/server/tmdb.ts` (or a fresh fetch to `api.themoviedb.org/3/search/multi?query=...&api_key=$TMDB_API_KEY`) to search for `$ARGUMENTS`.

Output the top 5 results as a numbered list with:

- title
- year
- type (movie/tv)
- tmdb_id
- brief overview (one line)

Then output the full JSON blob for whichever result Dave picks, formatted for pasting into `scripts/seed.ts` or the movie import form.

Do not insert into the DB from this command — it's read-only research.
