<script lang="ts">
	import PosterCard from '$lib/components/PosterCard.svelte';
	import { toNumber } from '$lib/ratings';

	let { data } = $props();
</script>

<svelte:head>
	<title>reviews · movie-szn</title>
</svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<div class="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
		<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
			<filter id="grain-reviews">
				<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain-reviews)" />
		</svg>
	</div>

	<div class="relative mx-auto max-w-[72rem] px-6 py-12">
		<header class="mb-10 flex items-center justify-between">
			<a href="/" class="text-display text-lg italic">
				movie<span class="text-[color:var(--color-accent)]">-</span>szn
			</a>
			<nav
				class="text-mono flex gap-6 text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				<a class="text-[color:var(--color-accent)]" href="/reviews">reviews</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/watchlist">watchlist</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/suggest">suggest</a>
			</nav>
		</header>

		<p class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
			◦ the archive ◦
		</p>
		<h1 class="text-display mt-2 text-6xl italic">every review</h1>

		{#if data.reviews.length === 0}
			<p class="mt-12 text-[color:var(--color-muted)]">no reviews yet.</p>
		{:else}
			<div class="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
				{#each data.reviews as r (r.id)}
					<PosterCard
						title={r.title}
						year={r.year}
						slug={r.slug}
						posterUrl={r.posterUrl}
						score={toNumber(r.combinedScore)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</main>
