<script lang="ts">
	import { page } from '$app/state';
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import PosterCard from '$lib/components/PosterCard.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { profilePrefix } from '$lib/profile';
	import { formatPublicScore, scoreTier } from '$lib/ratings';

	let { data } = $props();
	const prefix = $derived(profilePrefix(page.url.pathname));

	const podium = $derived(data.movies.slice(0, 3));
	const rest = $derived(data.movies.slice(3));

	// #1 gold, #2 silver, #3 bronze — straight from the theme tokens.
	const ACCENT = ['var(--color-gold)', 'var(--color-silver)', 'var(--color-bronze)'];
	// Center the winner: 2nd left, 1st middle, 3rd right.
	const ORDER = [2, 1, 3];
	const PLINTH = [2.75, 1.75, 1];
</script>

<svelte:head><title>{data.list.name} · lists · movie-szn</title></svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<FilmGrain id="grain-list" />

	<SiteHeader />

	<div class="relative mx-auto max-w-[64rem] px-6 pt-10 pb-16">
		<a
			href="{prefix}/lists"
			class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase transition hover:text-[color:var(--color-accent)]"
		>
			← all lists
		</a>

		<header class="mt-4">
			<p
				class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
			>
				◦ {data.list.orderMode === 'rating' ? 'ranked by rating' : 'custom order'} ◦
			</p>
			<h1 class="text-display mt-2 text-5xl italic sm:text-6xl">{data.list.name}</h1>
			{#if data.list.description}
				<p class="mt-3 max-w-2xl text-[color:var(--color-muted)]">{data.list.description}</p>
			{/if}
			<p class="text-mono mt-3 text-xs text-[color:var(--color-muted)]">
				{data.movies.length}
				{data.movies.length === 1 ? 'title' : 'titles'}
			</p>
		</header>

		{#if data.movies.length === 0}
			<p class="mt-16 text-[color:var(--color-muted)]">this list is empty.</p>
		{:else}
			<section class="mx-auto mt-12 grid max-w-[40rem] grid-cols-3 items-end gap-3 sm:gap-4">
				{#each podium as m, i (m.slug)}
					{@const tier = m.score == null ? null : scoreTier(m.score)}
					<div class="flex flex-col" style="order:{ORDER[i]}">
						<a
							href="{prefix}/reviews/{m.slug}"
							class="group hover:shadow-bulb relative block aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] border bg-[color:var(--color-surface)] transition duration-200 hover:-translate-y-2"
							style="border-color:{ACCENT[i]}"
							class:podium-first={i === 0}
						>
							{#if m.posterUrl}
								<img
									src={m.posterUrl}
									alt={m.title}
									class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]"
								>
									<span class="text-mono text-xs tracking-wider uppercase">no poster</span>
								</div>
							{/if}
							<span
								class="text-display absolute top-1 left-2 z-10 text-2xl leading-none font-semibold [text-shadow:0_2px_12px_oklch(0%_0_0_/_0.85)] sm:text-3xl"
								style="color:{ACCENT[i]}"
								aria-hidden="true"
							>
								#{i + 1}
							</span>
							{#if m.score != null}
								<div
									class="absolute top-2 right-2 rounded-full border bg-[color:var(--color-bg)]/85 px-2 py-0.5 backdrop-blur-md"
									class:border-[color:var(--color-gold)]={tier === 'flex'}
									class:border-[color:var(--color-border)]={tier !== 'flex'}
									class:flex-glow-ring={tier === 'flex'}
								>
									<span
										class="text-mono text-xs leading-none font-medium tabular-nums"
										class:text-[color:var(--color-gold)]={tier === 'flex'}
										class:text-[color:var(--color-accent)]={tier === 'peak' || tier === 'high'}
										class:text-[color:var(--color-text)]={tier === 'mid'}
										class:text-[color:var(--color-danger)]={tier === 'low'}
										class:flex-glow={tier === 'flex'}
									>
										{formatPublicScore(m.score)}
									</span>
								</div>
							{/if}
							<div
								class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/60 to-transparent p-3 pt-10"
							>
								<p class="text-display text-sm leading-tight sm:text-base">{m.title}</p>
								<p class="text-mono text-[0.7rem] text-[color:var(--color-muted)]">{m.year}</p>
							</div>
						</a>
						<div
							class="mt-2 rounded-sm border-t-2 bg-gradient-to-b from-[color:var(--color-surface-2)] to-transparent"
							style="height:{PLINTH[i]}rem;border-color:{ACCENT[i]}"
						></div>
					</div>
				{/each}
			</section>

			{#if rest.length > 0}
				<section class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
					{#each rest as m, i (m.slug)}
						<PosterCard
							title={m.title}
							year={m.year}
							slug={m.slug}
							posterUrl={m.posterUrl}
							score={m.score}
							rank={i + 4}
						/>
					{/each}
				</section>
			{/if}
		{/if}
	</div>
</main>

<style>
	.podium-first {
		transform: scale(1.06);
	}
	.podium-first:hover {
		transform: scale(1.06) translateY(-0.5rem);
	}
	@media (prefers-reduced-motion: reduce) {
		.podium-first,
		.podium-first:hover {
			transform: none;
		}
	}
</style>
