<script lang="ts">
	import PosterCard from '$lib/components/PosterCard.svelte';
	import ProjectorTitle from '$lib/components/ProjectorTitle.svelte';
	import SeasonMarquee from '$lib/components/SeasonMarquee.svelte';
	import { toNumber } from '$lib/ratings';

	let { data } = $props();
	const year = new Date().getFullYear();
</script>

<main class="relative min-h-dvh overflow-hidden">
	<div class="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
		<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
			<filter id="grain">
				<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain)" />
		</svg>
	</div>

	<div class="relative mx-auto flex min-h-dvh max-w-[72rem] flex-col px-6 py-10">
		<header class="flex items-center justify-between">
			<span class="text-mono text-xs tracking-[0.3em] text-[color:var(--color-muted)] uppercase">
				◦ now showing ◦
			</span>
			<nav
				class="text-mono flex gap-6 text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				<a class="transition hover:text-[color:var(--color-text)]" href="/reviews">reviews</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/watchlist">watchlist</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/suggest">suggest</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/seasons">seasons</a>
			</nav>
		</header>

		<section class="flex flex-1 flex-col justify-center py-16">
			<p class="text-mono mb-6 text-xs tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
				a dave joint · {data.currentSeason?.name ?? `movie season ${year}`}
			</p>
			<h1 class="text-display text-[clamp(4rem,14vw,12rem)] leading-[0.85] italic">
				<ProjectorTitle text="movie-szn" accent="-" />
			</h1>
			<p class="mt-6 max-w-xl text-lg text-[color:var(--color-muted)]">
				four scores. one verdict. and a standing ovation reserved for the
				<span class="text-[color:var(--color-gold)] italic">12/10</span>.
			</p>
		</section>
	</div>

	{#if data.currentSeason && data.seasonMovies.length > 0}
		<SeasonMarquee seasonName={data.currentSeason.name} items={data.seasonMovies} />
	{/if}

	<div class="relative mx-auto max-w-[72rem] px-6 py-16">
		{#if data.latest.length > 0}
			<section>
				<p
					class="text-mono mb-6 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					◦ latest reviews ◦
				</p>
				<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
					{#each data.latest as r (r.id)}
						<PosterCard
							title={r.title}
							year={r.year}
							slug={r.slug}
							posterUrl={r.posterUrl}
							score={toNumber(r.combinedScore)}
						/>
					{/each}
				</div>
			</section>
		{:else}
			<section>
				<p
					class="text-mono mb-6 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					◦ coming soon ◦
				</p>
				<p class="text-[color:var(--color-muted)]">
					no reviews yet. check back when the lights go down.
				</p>
			</section>
		{/if}

		<footer
			class="text-mono mt-16 flex items-center justify-between border-t border-[color:var(--color-border)] pt-6 text-xs text-[color:var(--color-muted)]"
		>
			<span>© {year} dave</span>
			<a href="/rss.xml" class="hover:text-[color:var(--color-text)]">rss</a>
		</footer>
	</div>
</main>
