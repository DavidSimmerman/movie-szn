<script lang="ts">
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import PosterCard from '$lib/components/PosterCard.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { toNumber } from '$lib/ratings';

	let { data } = $props();

	const rankLabel: Record<string, string> = {
		first: 'winner',
		second: 'runner-up',
		third: 'third',
		honorable: 'honorable'
	};

	const SLOT_ORDER = [3, 1, 0, 2, 4] as const;

	type Pick = NonNullable<typeof data.awardsPreview>['picks'][number];

	const arrangedPicks = $derived(() => {
		if (!data.awardsPreview) return [] as { pick: Pick; tier: 'hero' | 'mid' | 'edge' }[];
		const picks = data.awardsPreview.picks;
		const tiers: ('hero' | 'mid' | 'edge')[] = ['edge', 'mid', 'hero', 'mid', 'edge'];
		return SLOT_ORDER.map((idx, slot) =>
			picks[idx] ? { pick: picks[idx], tier: tiers[slot] } : null
		).filter((x): x is { pick: Pick; tier: 'hero' | 'mid' | 'edge' } => x !== null);
	});
</script>

<svelte:head><title>{data.season.name} · movie-szn</title></svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<FilmGrain id="grain-season" />

	<SiteHeader
		pill={data.admin ? { href: `/admin/seasons/${data.season.slug}`, label: 'admin' } : null}
	/>

	<div class="relative mx-auto max-w-[72rem] px-6 pt-10 pb-12">
		<p class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
			◦ {data.season.startsAt} → {data.season.endsAt} ◦
		</p>
		<h1 class="text-display mt-2 text-6xl italic">{data.season.name}</h1>

		{#if data.awardsPreview}
			{@const preview = data.awardsPreview}
			<section class="awards-preview" aria-labelledby="awards-preview-heading">
				<header class="awards-preview__head">
					<p class="awards-preview__kicker">◦ now showing ◦</p>
					<h2 id="awards-preview-heading" class="awards-preview__title">Season Awards</h2>
					<p class="awards-preview__sub">
						{preview.totalCategories}
						{preview.totalCategories === 1 ? 'category' : 'categories'}
						of superlatives, ranked & ribboned
					</p>
				</header>

				<ul class="awards-preview__grid">
					{#each arrangedPicks() as { pick, tier } (pick.categoryId)}
						<li class="awards-preview__pick awards-preview__pick--{tier}">
							<a href="/reviews/{pick.movieSlug}" class="awards-preview__card">
								{#if pick.posterUrl}
									<img
										src={pick.posterUrl}
										alt={pick.title}
										loading="lazy"
										class="awards-preview__poster"
									/>
								{:else}
									<div class="awards-preview__poster awards-preview__poster--empty"></div>
								{/if}
								<span class="awards-preview__ribbon">{rankLabel[pick.rank] ?? pick.rank}</span>
								<div class="awards-preview__meta">
									<p class="awards-preview__movie">{pick.title}</p>
									<p class="awards-preview__year">{pick.year}</p>
								</div>
							</a>
							<p class="awards-preview__category">{pick.categoryName}</p>
						</li>
					{/each}
				</ul>

				<a href="/seasons/{data.season.slug}/awards" class="awards-preview__cta">
					<span>See all awards</span>
					<span aria-hidden="true" class="awards-preview__arrow">→</span>
				</a>
			</section>
		{/if}

		{#if data.movies.length === 0}
			<p class="mt-12 text-[color:var(--color-muted)]">nothing tagged for this season yet.</p>
		{:else}
			<header class="mt-16 mb-6 flex items-baseline gap-4">
				<span
					class="text-mono text-[0.6rem] tracking-[0.35em] text-[color:var(--color-accent)] uppercase"
				>
					◦ ranked ◦
				</span>
				<h2 class="text-display text-2xl italic sm:text-3xl">top rated this season</h2>
				<span class="hidden h-px flex-1 bg-[color:var(--color-border)] sm:block" aria-hidden="true"
				></span>
				<span
					class="text-mono hidden text-[0.65rem] tracking-[0.2em] text-[color:var(--color-muted)] sm:inline"
				>
					{data.movies.length}
					{data.movies.length === 1 ? 'title' : 'titles'}
				</span>
			</header>
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
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

<style>
	.awards-preview {
		position: relative;
		margin: 3rem auto 0;
		max-width: 64rem;
		padding: 2rem 2rem 1.75rem;
		border: 1px solid color-mix(in oklch, var(--color-gold) 30%, transparent);
		border-radius: 20px;
		background:
			radial-gradient(
				ellipse 70% 90% at 50% 0%,
				color-mix(in oklch, var(--color-gold) 10%, transparent),
				transparent 70%
			),
			linear-gradient(
				180deg,
				color-mix(in oklch, var(--color-surface) 92%, transparent),
				color-mix(in oklch, var(--color-bg) 94%, transparent)
			);
		box-shadow:
			inset 0 1px 0 color-mix(in oklch, var(--color-gold) 25%, transparent),
			0 30px 60px -40px color-mix(in oklch, var(--color-gold) 55%, transparent),
			0 0 80px -40px color-mix(in oklch, var(--color-accent) 40%, transparent);
		text-align: center;
		isolation: isolate;
	}

	.awards-preview__head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 1.75rem;
	}

	.awards-preview__kicker {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.4em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	.awards-preview__title {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 500;
		font-size: clamp(2.25rem, 4vw, 3rem);
		line-height: 1;
		letter-spacing: -0.02em;
		color: var(--color-text);
	}

	.awards-preview__sub {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		color: var(--color-muted);
		max-width: 30ch;
	}

	.awards-preview__grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem 1rem;
		margin: 0 0 1.75rem;
		padding: 0;
		list-style: none;
		align-items: end;
	}

	@media (min-width: 640px) {
		.awards-preview__grid {
			grid-template-columns: repeat(5, 1fr);
			gap: 1rem;
			padding: 1.5rem 0 0;
		}
	}

	.awards-preview__pick {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	@media (min-width: 640px) {
		.awards-preview__pick--hero {
			transform: translateY(-1rem);
		}
		.awards-preview__pick--mid {
			transform: translateY(-0.25rem);
		}
		.awards-preview__pick--edge .awards-preview__card {
			opacity: 0.92;
		}
	}

	.awards-preview__card {
		position: relative;
		display: block;
		aspect-ratio: 2 / 3;
		border-radius: var(--radius-card);
		overflow: hidden;
		border: 1px solid color-mix(in oklch, var(--color-border) 80%, transparent);
		background: var(--color-surface);
		text-decoration: none;
		color: inherit;
		transition:
			transform 300ms ease,
			border-color 300ms ease,
			box-shadow 300ms ease;
	}

	.awards-preview__card:hover {
		transform: translateY(-3px);
		border-color: color-mix(in oklch, var(--color-gold) 55%, transparent);
		box-shadow:
			0 24px 48px -24px oklch(0% 0 0 / 0.8),
			0 0 40px -10px color-mix(in oklch, var(--color-gold) 40%, transparent);
	}

	.awards-preview__pick--hero .awards-preview__card {
		border-color: color-mix(in oklch, var(--color-gold) 55%, transparent);
		box-shadow:
			0 30px 60px -28px oklch(0% 0 0 / 0.85),
			0 0 50px -12px color-mix(in oklch, var(--color-gold) 45%, transparent);
	}

	.awards-preview__poster {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 500ms ease;
	}

	.awards-preview__card:hover .awards-preview__poster {
		transform: scale(1.04);
	}

	.awards-preview__poster--empty {
		background: var(--color-surface-2);
	}

	.awards-preview__ribbon {
		position: absolute;
		top: 0.6rem;
		left: 0.6rem;
		z-index: 2;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.55rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-gold);
		background: color-mix(in oklch, var(--color-gold) 18%, var(--color-bg));
		border: 1px solid color-mix(in oklch, var(--color-gold) 55%, transparent);
		backdrop-filter: blur(6px);
	}

	.awards-preview__meta {
		position: absolute;
		inset: auto 0 0 0;
		padding: 1.75rem 0.75rem 0.7rem;
		background: linear-gradient(
			to top,
			var(--color-bg) 0%,
			color-mix(in oklch, var(--color-bg) 70%, transparent) 55%,
			transparent 100%
		);
		text-align: left;
	}

	.awards-preview__movie {
		font-family: var(--font-display);
		font-size: 0.88rem;
		line-height: 1.15;
		color: var(--color-text);
	}

	.awards-preview__year {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.15em;
		color: var(--color-muted);
		margin-top: 0.15rem;
	}

	.awards-preview__category {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.25em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.awards-preview__cta {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.85rem 1.75rem;
		border-radius: 999px;
		border: 1px solid color-mix(in oklch, var(--color-accent) 60%, transparent);
		background: color-mix(in oklch, var(--color-accent) 10%, transparent);
		color: var(--color-accent);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		text-decoration: none;
		transition:
			background 250ms ease,
			border-color 250ms ease,
			transform 250ms ease,
			box-shadow 250ms ease;
	}

	.awards-preview__cta:hover {
		background: color-mix(in oklch, var(--color-accent) 22%, transparent);
		border-color: color-mix(in oklch, var(--color-accent) 90%, transparent);
		transform: translateY(-1px);
		box-shadow: 0 14px 32px -18px color-mix(in oklch, var(--color-accent) 70%, transparent);
	}

	.awards-preview__arrow {
		display: inline-block;
		transition: transform 250ms ease;
	}

	.awards-preview__cta:hover .awards-preview__arrow {
		transform: translateX(3px);
	}

	@media (prefers-reduced-motion: reduce) {
		.awards-preview__card,
		.awards-preview__poster,
		.awards-preview__cta,
		.awards-preview__arrow {
			transition: none;
		}
		.awards-preview__card:hover,
		.awards-preview__cta:hover,
		.awards-preview__pick--hero,
		.awards-preview__pick--mid {
			transform: none;
		}
		.awards-preview__card:hover .awards-preview__poster,
		.awards-preview__cta:hover .awards-preview__arrow {
			transform: none;
		}
	}
</style>
