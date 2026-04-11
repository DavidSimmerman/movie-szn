<script lang="ts">
	let { data, form } = $props();
	// svelte-ignore state_referenced_locally
	let query = $state(data.query);
</script>

<svelte:head><title>import movie · admin</title></svelte:head>

<h1 class="text-display mb-8 text-4xl italic">import a movie</h1>

<form method="GET" class="mb-8 flex gap-3">
	<input
		name="q"
		bind:value={query}
		placeholder="search tmdb (dune, severance, ...)"
		class="text-mono flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-3 outline-none focus:border-[color:var(--color-accent)]"
	/>
	<button
		class="text-mono rounded-md bg-[color:var(--color-accent)] px-5 py-3 text-sm tracking-wider text-[color:var(--color-bg)] uppercase"
	>
		search
	</button>
</form>

{#if data.error}
	<p class="text-mono mb-4 text-xs text-[color:var(--color-danger)]">{data.error}</p>
{/if}
{#if form?.error}
	<p class="text-mono mb-4 text-xs text-[color:var(--color-danger)]">{form.error}</p>
{/if}

{#if data.results.length > 0}
	<ul class="grid gap-3">
		{#each data.results as r (r.id + r.type)}
			<li
				class="flex items-start gap-4 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
			>
				{#if r.posterUrl}
					<img src={r.posterUrl} alt="" class="h-28 w-[4.7rem] rounded object-cover" />
				{:else}
					<div class="h-28 w-[4.7rem] rounded bg-[color:var(--color-surface-2)]"></div>
				{/if}
				<div class="flex-1">
					<p class="text-display text-xl">{r.title}</p>
					<p class="text-mono text-xs text-[color:var(--color-muted)]">
						{r.year ?? '????'} · {r.type}
					</p>
					<p class="mt-2 line-clamp-3 text-sm text-[color:var(--color-muted)]">{r.overview}</p>
				</div>
				<form method="POST" action="?/import" class="shrink-0">
					<input type="hidden" name="tmdbId" value={r.id} />
					<input type="hidden" name="type" value={r.type} />
					<button
						class="text-mono rounded-md border border-[color:var(--color-accent)] px-3 py-2 text-xs tracking-wider text-[color:var(--color-accent)] uppercase transition hover:bg-[color:var(--color-accent)]/10"
					>
						import
					</button>
				</form>
			</li>
		{/each}
	</ul>
{:else if data.query}
	<p class="text-[color:var(--color-muted)]">no results.</p>
{/if}
