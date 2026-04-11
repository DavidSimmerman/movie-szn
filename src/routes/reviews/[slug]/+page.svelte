<script lang="ts">
	import HeroScore from '$lib/components/HeroScore.svelte';
	import RatingFilmstrip from '$lib/components/RatingFilmstrip.svelte';
	import { toBreakdown, toNumber } from '$lib/ratings';

	let { data } = $props();
	const ratings = $derived(toBreakdown(data.review));
	const score = $derived(toNumber(data.review.combinedScore));
</script>

<svelte:head>
	<title>{data.movie.title} · movie-szn</title>
	<meta name="description" content="Dave's review of {data.movie.title} ({data.movie.year})" />
</svelte:head>

<main class="relative min-h-dvh">
	{#if data.movie.backdropUrl}
		<div
			class="absolute inset-x-0 top-0 h-[70vh] overflow-hidden"
			aria-hidden="true"
		>
			<img
				src={data.movie.backdropUrl}
				alt=""
				class="h-full w-full object-cover opacity-40"
			/>
			<div
				class="absolute inset-0"
				style="background: linear-gradient(180deg, transparent 0%, var(--color-bg) 85%);"
			></div>
		</div>
	{/if}

	<div class="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
		<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
			<filter id="grain-review">
				<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain-review)" />
		</svg>
	</div>

	<div class="relative mx-auto max-w-[72rem] px-6 py-12">
		<header class="mb-10 flex items-center justify-between">
			<a href="/" class="text-display text-lg italic">
				movie<span class="text-[color:var(--color-accent)]">-</span>szn
			</a>
			<nav class="text-mono flex gap-6 text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
				<a class="transition hover:text-[color:var(--color-text)]" href="/reviews">reviews</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/watchlist">watchlist</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/suggest">suggest</a>
			</nav>
		</header>

		<div class="grid gap-12 md:grid-cols-[auto_1fr]">
			{#if data.movie.posterUrl}
				<img
					src={data.movie.posterUrl}
					alt={data.movie.title}
					class="w-56 rounded-[var(--radius-card)] border border-[color:var(--color-border)] shadow-bulb md:w-72"
				/>
			{/if}

			<div>
				<p
					class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
				>
					◦ dave's review ◦
				</p>
				<h1 class="text-display mt-2 text-6xl leading-[0.9] italic md:text-7xl">
					{data.movie.title}
				</h1>
				<p class="text-mono mt-3 text-sm text-[color:var(--color-muted)]">
					{data.movie.year} · {data.movie.type}{#if data.movie.runtimeMinutes} · {data.movie.runtimeMinutes}m{/if}
				</p>

				<div class="mt-8">
					<HeroScore {score} />
				</div>

				{#if data.movie.overview}
					<p class="mt-8 max-w-2xl text-[color:var(--color-muted)]">{data.movie.overview}</p>
				{/if}
			</div>
		</div>

		<section class="mt-16">
			<p
				class="text-mono mb-4 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
			>
				◦ the breakdown ◦
			</p>
			<div
				class="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8"
			>
				<RatingFilmstrip {ratings} />
			</div>
		</section>

		{#if data.review.notes}
			<section class="mt-16 max-w-2xl">
				<p
					class="text-mono mb-4 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					◦ notes ◦
				</p>
				<div class="prose text-lg leading-relaxed whitespace-pre-wrap text-[color:var(--color-text)]">
					{data.review.notes}
				</div>
			</section>
		{/if}
	</div>
</main>
