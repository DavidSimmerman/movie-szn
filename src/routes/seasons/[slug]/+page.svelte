<script lang="ts">
	import PosterCard from '$lib/components/PosterCard.svelte';
	import { toNumber } from '$lib/ratings';

	let { data } = $props();
</script>

<svelte:head><title>{data.season.name} · movie-szn</title></svelte:head>

<main class="relative min-h-dvh">
	<div class="mx-auto max-w-[72rem] px-6 py-12">
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
			◦ {data.season.startsAt} → {data.season.endsAt} ◦
		</p>
		<h1 class="text-display mt-2 text-6xl italic">{data.season.name}</h1>

		{#if data.movies.length === 0}
			<p class="mt-12 text-[color:var(--color-muted)]">nothing tagged for this season yet.</p>
		{:else}
			<div class="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
				{#each data.movies as m (m.id)}
					<PosterCard
						title={m.title}
						year={m.year}
						slug={m.slug}
						posterUrl={m.posterUrl}
						score={m.combinedScore != null ? toNumber(m.combinedScore) : null}
					/>
				{/each}
			</div>
		{/if}
	</div>
</main>
