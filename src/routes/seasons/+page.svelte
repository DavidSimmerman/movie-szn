<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>seasons · movie-szn</title></svelte:head>

<main class="relative min-h-dvh">
	<div class="mx-auto max-w-[56rem] px-6 py-12">
		<header class="mb-10 flex items-center justify-between">
			<a href="/" class="text-display text-lg italic">
				movie<span class="text-[color:var(--color-accent)]">-</span>szn
			</a>
			<nav
				class="text-mono flex gap-6 text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				<a class="transition hover:text-[color:var(--color-text)]" href="/reviews">reviews</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/watchlist">watchlist</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/suggest">suggest</a>
			</nav>
		</header>

		<p class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
			◦ by the year ◦
		</p>
		<h1 class="text-display mt-2 text-6xl italic">seasons</h1>
		<p class="mt-3 max-w-xl text-[color:var(--color-muted)]">
			every movie season, april through august. the core of the site.
		</p>

		{#if data.seasons.length === 0}
			<p class="mt-12 text-[color:var(--color-muted)]">no seasons yet.</p>
		{:else}
			<ul class="mt-12 grid gap-4 md:grid-cols-2">
				{#each data.seasons as s (s.id)}
					<li>
						<a
							href="/seasons/{s.slug}"
							class="block rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 transition hover:border-[color:var(--color-accent)]"
						>
							<p
								class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
							>
								{s.startsAt} → {s.endsAt}
							</p>
							<p class="text-display mt-2 text-3xl italic">{s.name}</p>
							<p class="text-mono mt-3 text-xs text-[color:var(--color-muted)]">
								{s.movieCount}
								{s.movieCount === 1 ? 'movie' : 'movies'}
							</p>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</main>
