<script lang="ts">
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import HeroScore from '$lib/components/HeroScore.svelte';
	import RatingFilmstrip from '$lib/components/RatingFilmstrip.svelte';
	import ScoringGuideDialog from '$lib/components/ScoringGuideDialog.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { toBreakdown, toNumber } from '$lib/ratings';

	let { data } = $props();
	const ratings = $derived(toBreakdown(data.review));
	const score = $derived(toNumber(data.review.combinedScore));

	function rankLabel(rank: 'first' | 'second' | 'third' | 'honorable', multi: boolean) {
		if (multi) return 'PICK';
		if (rank === 'first') return 'WINNER';
		if (rank === 'second') return 'II';
		if (rank === 'third') return 'III';
		return 'HM';
	}
	function rankClass(rank: 'first' | 'second' | 'third' | 'honorable', multi: boolean) {
		if (multi) return 'award-pick';
		if (rank === 'first') return 'award-gold';
		if (rank === 'second') return 'award-silver';
		if (rank === 'third') return 'award-bronze';
		return 'award-hm';
	}
</script>

<svelte:head>
	<title>{data.movie.title} · movie-szn</title>
	<meta name="description" content="Dave's review of {data.movie.title} ({data.movie.year})" />
</svelte:head>

<main class="relative min-h-dvh">
	{#if data.movie.backdropUrl}
		<div class="backdrop absolute inset-x-0 top-0 h-[70vh] overflow-hidden" aria-hidden="true">
			<img src={data.movie.backdropUrl} alt="" class="h-full w-full object-cover opacity-40" />
			<div
				class="absolute inset-0"
				style="background: linear-gradient(180deg, transparent 0%, var(--color-bg) 85%);"
			></div>
		</div>
	{/if}

	<FilmGrain id="grain-review" />

	<SiteHeader />

	<div class="relative mx-auto max-w-[72rem] px-6 pt-10 pb-12">
		<div class="grid gap-12 lg:grid-cols-[auto_1fr]">
			{#if data.movie.posterUrl}
				<img
					src={data.movie.posterUrl}
					alt={data.movie.title}
					class="shadow-bulb w-56 rounded-[var(--radius-card)] border border-[color:var(--color-border)] lg:w-72"
				/>
			{/if}

			<div>
				<p
					class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
				>
					◦ dave's review ◦
				</p>
				<h1 class="text-display mt-2 text-5xl leading-[0.95] italic sm:text-6xl lg:text-7xl">
					{data.movie.title}
				</h1>
				<p class="text-mono mt-3 text-sm text-[color:var(--color-muted)]">
					{data.movie.year} · {data.movie.type}{#if data.movie.runtimeMinutes}
						· {data.movie.runtimeMinutes}m{/if}
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
			<div class="mb-4 flex items-center justify-between gap-3">
				<p
					class="text-mono text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					◦ the breakdown ◦
				</p>
				<ScoringGuideDialog />
			</div>
			<div
				class="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8"
			>
				<RatingFilmstrip {ratings} />
			</div>
		</section>

		{#if data.awards.length > 0}
			<section class="mt-16">
				<p
					class="text-mono mb-4 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					◦ awards ◦
				</p>
				<ul class="space-y-2">
					{#each data.awards as a, i (i)}
						<li
							class="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"
						>
							<span class="award-badge text-mono {rankClass(a.rank, a.allowsMultiple)}">
								{rankLabel(a.rank, a.allowsMultiple)}
							</span>
							<div class="min-w-0 flex-1">
								<p class="text-display text-lg leading-tight italic">{a.categoryName}</p>
								{#if a.note}
									<p class="text-display text-sm text-[color:var(--color-muted)] italic">
										— {a.note}
									</p>
								{/if}
							</div>
							<a
								href="/seasons/{a.seasonSlug}/awards"
								class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase transition hover:text-[color:var(--color-accent)]"
							>
								{a.seasonName} →
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</main>

<style>
	.backdrop > img {
		animation: backdrop-parallax linear;
		animation-timeline: view();
		animation-range: entry 0% cover 60%;
		will-change: transform;
	}
	@keyframes backdrop-parallax {
		from {
			transform: translate3d(0, 0, 0) scale(1.02);
		}
		to {
			transform: translate3d(0, 8%, 0) scale(1.12);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.backdrop > img {
			animation: none;
		}
	}

	.award-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 3.5rem;
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		border: 1px solid var(--color-border);
	}
	.award-gold {
		color: var(--color-gold);
		background: color-mix(in oklab, var(--color-gold) 18%, var(--color-bg));
		border-color: color-mix(in oklab, var(--color-gold) 60%, transparent);
	}
	.award-silver {
		color: var(--color-silver);
		background: color-mix(in oklab, var(--color-silver) 18%, var(--color-bg));
		border-color: color-mix(in oklab, var(--color-silver) 60%, transparent);
	}
	.award-bronze {
		color: var(--color-bronze);
		background: color-mix(in oklab, var(--color-bronze) 18%, var(--color-bg));
		border-color: color-mix(in oklab, var(--color-bronze) 55%, transparent);
	}
	.award-hm {
		color: var(--color-muted);
	}
	.award-pick {
		color: var(--color-accent);
		border-color: color-mix(in oklab, var(--color-accent) 50%, transparent);
	}
</style>
