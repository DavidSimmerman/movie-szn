<script lang="ts">
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import PosterCard from '$lib/components/PosterCard.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { toNumber } from '$lib/ratings';

	let { data } = $props();
</script>

<svelte:head>
	<title>reviews · movie-szn</title>
</svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<FilmGrain id="grain-reviews" />

	<SiteHeader />

	<div class="relative mx-auto max-w-[72rem] px-6 pt-10 pb-12">
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
