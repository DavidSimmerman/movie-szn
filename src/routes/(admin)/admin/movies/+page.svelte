<script lang="ts">
	let { data } = $props();

	let filter = $state('');

	const filtered = $derived(
		data.movies.filter((m) => {
			if (!filter) return true;
			const q = filter.toLowerCase();
			return m.title.toLowerCase().includes(q) || String(m.year).includes(q);
		})
	);
</script>

<svelte:head><title>movies · admin</title></svelte:head>

<div class="mb-6 flex items-end justify-between gap-4">
	<div>
		<h1 class="text-display text-4xl italic">the library</h1>
		<p class="text-mono mt-1 text-xs text-[color:var(--color-muted)]">
			{data.movies.length} imported
		</p>
	</div>
	<a
		href="/admin/movies/new"
		class="text-mono rounded-md border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-4 py-2 text-xs tracking-wider text-[color:var(--color-accent)] uppercase transition hover:bg-[color:var(--color-accent)]/20"
	>
		+ import from tmdb
	</a>
</div>

{#if data.movies.length === 0}
	<p class="text-[color:var(--color-muted)]">nothing here yet.</p>
{:else}
	<div class="mb-4 flex items-center gap-3">
		<input
			type="search"
			bind:value={filter}
			placeholder="filter the library…"
			class="text-mono flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)]"
		/>
		{#if filter}
			<p class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
				{filtered.length} / {data.movies.length}
			</p>
		{/if}
	</div>

	{#if filtered.length === 0}
		<p class="text-mono text-xs text-[color:var(--color-muted)]">nothing matches.</p>
	{:else}
		<ul class="divide-y divide-[color:var(--color-border)]">
			{#each filtered as movie (movie.id)}
				<li class="flex items-center gap-4 py-4">
					{#if movie.posterUrl}
						<img src={movie.posterUrl} alt="" class="h-16 w-11 rounded object-cover" />
					{:else}
						<div class="h-16 w-11 rounded bg-[color:var(--color-surface-2)]"></div>
					{/if}
					<div class="flex-1">
						<p class="text-display text-lg">{movie.title}</p>
						<p class="text-mono text-xs text-[color:var(--color-muted)]">
							{movie.year} · {movie.type}
						</p>
					</div>
					<a
						href="/admin/reviews/new?movieSlug={movie.slug}"
						class="text-mono text-xs tracking-wider text-[color:var(--color-accent)] uppercase hover:text-[color:var(--color-text)]"
					>
						review →
					</a>
				</li>
			{/each}
		</ul>
	{/if}
{/if}
