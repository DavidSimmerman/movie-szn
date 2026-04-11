---
description: Run the cinema-designer subagent across recently changed UI files.
---

1. Run `git diff --name-only` to find changed files under `src/routes/`, `src/lib/components/`, or `src/app.css`.
2. If there are Svelte/CSS changes, invoke the `cinema-designer` subagent (via the Task tool with subagent_type="cinema-designer") to review them.
3. Summarize the report back to Dave with the most important ⚠️ drift items called out.

If no UI files changed, say so and stop.
