<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>movies · admin</title></svelte:head>

<div class="mb-8 flex items-end justify-between">
	<h1 class="text-display text-4xl italic">the library</h1>
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
	<ul class="divide-y divide-[color:var(--color-border)]">
		{#each data.movies as movie (movie.id)}
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
					href="/reviews/{movie.slug}"
					class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase hover:text-[color:var(--color-text)]"
				>
					view →
				</a>
			</li>
		{/each}
	</ul>
{/if}
