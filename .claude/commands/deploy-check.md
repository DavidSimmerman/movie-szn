---
description: Pre-deploy sanity check — builds the Dockerfile, runs migrations against a throwaway DB, verifies /healthz.
---

1. Run `npm run check` — svelte-check must pass.
2. Run `npm run lint` — prettier + eslint must pass.
3. Run `npm run test` — vitest must pass.
4. Run `docker build -t movie-szn:preflight .` — image must build.
5. Boot a throwaway container locally with `docker run --rm -d -p 3001:3000 -e DATABASE_URL=... -e ORIGIN=http://localhost:3001 movie-szn:preflight` — wait 5 seconds.
6. `curl http://localhost:3001/healthz` — must return `200 ok`.
7. Kill the container.
8. Report results. If all green: "ready to deploy". If not: list the failures with remediation.

Do not actually deploy from this command — only validate.
