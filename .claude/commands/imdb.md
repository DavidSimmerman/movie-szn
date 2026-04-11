---
description: Manually scrape an IMDB URL into a movie JSON blob via the JSON-LD block.
argument-hint: <imdb url>
---

Use `src/lib/server/imdb.ts` (the `scrapeImdbUrl` function) to fetch `$ARGUMENTS` and extract the movie metadata from its embedded JSON-LD `<script>` block.

Print the extracted fields:

- title
- year
- type (movie/show)
- runtime minutes
- poster_url
- backdrop_url (if any)
- overview
- imdb_id

This is the manual fallback when TMDB doesn't have a movie. Do not hit the DB — just print the JSON for Dave to paste into the import form.

Respect IMDB's servers: one request per invocation, polite User-Agent, no retries.
