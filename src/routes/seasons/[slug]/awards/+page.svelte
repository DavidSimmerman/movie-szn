<script lang="ts">
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { formatPublicScore, toNumber } from '$lib/ratings';

	type Rank = 'first' | 'second' | 'third' | 'honorable';

	type Winner = {
		id: string;
		categoryId: string;
		rank: Rank;
		note: string | null;
		sortOrder: number;
		movieSlug: string;
		title: string;
		year: number;
		posterUrl: string | null;
		backdropUrl: string | null;
		combinedScore: string | null;
	};

	type Category = {
		id: string;
		name: string;
		tagline: string | null;
		allowsMultiple: boolean;
		sortOrder: number;
		winners: Winner[];
	};

	let { data } = $props();

	function findWinner(cat: Category, rank: Rank): Winner | null {
		return cat.winners.find((w) => w.rank === rank) ?? null;
	}

	function honorable(cat: Category): Winner[] {
		return cat.winners
			.filter((w) => w.rank === 'honorable')
			.sort((a, b) => a.sortOrder - b.sortOrder);
	}

	const heroBackdrop = $derived(() => {
		for (const c of data.categories) {
			const first = c.winners.find((w) => w.rank === 'first') ?? c.winners[0];
			if (first?.backdropUrl) return first.backdropUrl;
		}
		return null;
	});
</script>

<svelte:head><title>{data.season.name} · awards · movie-szn</title></svelte:head>

<main class="awards-main relative min-h-dvh">
	{#if heroBackdrop()}
		<div
			class="hero-backdrop pointer-events-none fixed inset-x-0 top-0 h-[55vh] bg-cover bg-center opacity-25"
			style="background-image: url({heroBackdrop()})"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none fixed inset-x-0 top-0 h-[55vh] bg-gradient-to-b from-transparent via-[color:var(--color-bg)]/60 to-[color:var(--color-bg)]"
			aria-hidden="true"
		></div>
	{/if}

	<SiteHeader
		pill={data.admin
			? { href: `/admin/seasons/${data.season.slug}/awards`, label: 'edit awards' }
			: null}
	/>

	<div class="relative mx-auto max-w-[78rem] px-6 pt-10 pb-12">
		<section class="mb-16 text-center">
			<p
				class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
			>
				◦ {data.season.startsAt} → {data.season.endsAt} ◦
			</p>
			<h1 class="text-display mt-2 text-5xl italic sm:text-6xl">{data.season.name}</h1>
			<p
				class="text-display awards-title mt-4 text-[clamp(2.75rem,14vw,8rem)] text-[color:var(--color-gold)]"
			>
				AWARDS
			</p>
		</section>

		{#if data.categories.length === 0}
			<p class="text-center text-[color:var(--color-muted)]">
				no awards handed out yet — check back when dave has seen a few more films.
			</p>
		{/if}

		<div class="space-y-24">
			{#each data.categories as cat (cat.id)}
				{@const first = findWinner(cat, 'first')}
				{@const second = findWinner(cat, 'second')}
				{@const third = findWinner(cat, 'third')}
				{@const hm = honorable(cat)}
				<section class="category-section">
					<header class="mb-8 text-center">
						<h2 class="text-display text-3xl italic sm:text-4xl">{cat.name}</h2>
						{#if cat.tagline}
							<p
								class="text-mono mt-2 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
							>
								{cat.tagline}
							</p>
						{/if}
					</header>

					{#if cat.allowsMultiple}
						<!-- Multi-pick: flat poster row -->
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
							{#each hm as w (w.id)}
								<a
									href="/reviews/{w.movieSlug}"
									class="award-card group relative block aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
								>
									{#if w.posterUrl}
										<img
											src={w.posterUrl}
											alt={w.title}
											loading="lazy"
											class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
										/>
									{/if}
									<div
										class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/70 to-transparent p-3 pt-10"
									>
										<p class="text-display text-sm leading-tight">{w.title}</p>
										{#if w.note}
											<p class="text-display mt-0.5 text-xs text-[color:var(--color-muted)] italic">
												{w.note}
											</p>
										{/if}
										<p
											class="text-mono mt-1 text-[0.65rem] tracking-wider text-[color:var(--color-muted)]"
										>
											{w.year}
										</p>
									</div>
								</a>
							{/each}
						</div>
					{:else}
						<!-- Podium -->
						<div class="podium grid gap-6">
							{#if first}
								{@const score = first.combinedScore != null ? toNumber(first.combinedScore) : null}
								<article class="podium-slot podium-first">
									<span class="medal medal-gold">WINNER</span>
									<a
										href="/reviews/{first.movieSlug}"
										class="podium-first-card award-card group relative block aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] border-2 border-[color:var(--color-gold)]/70 bg-[color:var(--color-surface)]"
									>
										{#if first.posterUrl}
											<img
												src={first.posterUrl}
												alt={first.title}
												loading="lazy"
												class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
											/>
										{/if}
										<div
											class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/80 to-transparent p-5 pt-14"
										>
											<p class="text-display text-xl leading-tight">{first.title}</p>
											{#if first.note}
												<p class="text-display mt-1 text-sm text-[color:var(--color-text)] italic">
													{first.note}
												</p>
											{/if}
											<p
												class="text-mono mt-2 text-[0.65rem] tracking-wider text-[color:var(--color-muted)]"
											>
												{first.year}{#if score != null}
													· {formatPublicScore(score)}{/if}
											</p>
										</div>
									</a>
								</article>
							{:else}
								<div class="podium-slot podium-first podium-empty">
									<span class="text-mono text-xs tracking-wider uppercase"
										>winner · to be announced</span
									>
								</div>
							{/if}

							{#if second}
								{@const score =
									second.combinedScore != null ? toNumber(second.combinedScore) : null}
								<article class="podium-slot podium-second">
									<a
										href="/reviews/{second.movieSlug}"
										class="award-card group relative block aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] border-2 border-[color:var(--color-silver)]/60 bg-[color:var(--color-surface)] shadow-[0_20px_40px_-20px_oklch(0%_0_0_/_0.7)]"
									>
										{#if second.posterUrl}
											<img
												src={second.posterUrl}
												alt={second.title}
												loading="lazy"
												class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
											/>
										{/if}
										<span class="medal medal-silver">II</span>
										<div
											class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/75 to-transparent p-4 pt-12"
										>
											<p class="text-display text-base leading-tight">{second.title}</p>
											{#if second.note}
												<p
													class="text-display mt-0.5 text-xs text-[color:var(--color-muted)] italic"
												>
													{second.note}
												</p>
											{/if}
											<p
												class="text-mono mt-1 text-[0.65rem] tracking-wider text-[color:var(--color-muted)]"
											>
												{second.year}{#if score != null}
													· {formatPublicScore(score)}{/if}
											</p>
										</div>
									</a>
								</article>
							{:else}
								<div class="podium-slot podium-second podium-empty">
									<span class="text-mono text-xs tracking-wider uppercase">runner-up · —</span>
								</div>
							{/if}

							{#if third}
								{@const score = third.combinedScore != null ? toNumber(third.combinedScore) : null}
								<article class="podium-slot podium-third">
									<a
										href="/reviews/{third.movieSlug}"
										class="award-card group relative block aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] border-2 border-[color:var(--color-bronze)]/55 bg-[color:var(--color-surface)] shadow-[0_20px_40px_-20px_oklch(0%_0_0_/_0.7)]"
									>
										{#if third.posterUrl}
											<img
												src={third.posterUrl}
												alt={third.title}
												loading="lazy"
												class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
											/>
										{/if}
										<span class="medal medal-bronze">III</span>
										<div
											class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/75 to-transparent p-4 pt-12"
										>
											<p class="text-display text-base leading-tight">{third.title}</p>
											{#if third.note}
												<p
													class="text-display mt-0.5 text-xs text-[color:var(--color-muted)] italic"
												>
													{third.note}
												</p>
											{/if}
											<p
												class="text-mono mt-1 text-[0.65rem] tracking-wider text-[color:var(--color-muted)]"
											>
												{third.year}{#if score != null}
													· {formatPublicScore(score)}{/if}
											</p>
										</div>
									</a>
								</article>
							{:else}
								<div class="podium-slot podium-third podium-empty">
									<span class="text-mono text-xs tracking-wider uppercase">third · —</span>
								</div>
							{/if}
						</div>

						{#if hm.length > 0}
							<div class="mt-12">
								<p
									class="text-mono mb-4 text-center text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
								>
									◦ honorable mentions ◦
								</p>
								<ul class="flex flex-wrap justify-center gap-4">
									{#each hm as w (w.id)}
										<li class="hm-item">
											<a
												href="/reviews/{w.movieSlug}"
												class="group flex w-36 flex-col gap-2 sm:w-40"
											>
												<div
													class="relative aspect-[2/3] overflow-hidden rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] transition group-hover:border-[color:var(--color-accent)]"
												>
													{#if w.posterUrl}
														<img
															src={w.posterUrl}
															alt={w.title}
															loading="lazy"
															class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
														/>
													{/if}
												</div>
												<div class="text-center">
													<p
														class="text-display text-sm leading-tight transition group-hover:text-[color:var(--color-accent)]"
													>
														{w.title}
													</p>
													{#if w.note}
														<p
															class="text-display mt-0.5 text-xs text-[color:var(--color-muted)] italic"
														>
															{w.note}
														</p>
													{/if}
													<p
														class="text-mono mt-1 text-[0.65rem] tracking-wider text-[color:var(--color-muted)]"
													>
														{w.year}
													</p>
												</div>
											</a>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					{/if}
				</section>
			{/each}
		</div>
	</div>
</main>

<style>
	.awards-title {
		font-variant: small-caps;
		letter-spacing: 0.2em;
	}

	.podium {
		grid-template-columns: 1fr;
	}
	@media (min-width: 640px) {
		.podium {
			grid-template-columns: 1fr 1.3fr 1fr;
			grid-auto-flow: dense;
			align-items: end;
			gap: 1.5rem;
		}
		.podium-slot {
			grid-row: 1;
			position: relative;
		}
		.podium-first {
			grid-column: 2;
			transform: translateY(-2rem);
			z-index: 2;
		}
		.podium-second {
			grid-column: 1;
		}
		.podium-third {
			grid-column: 3;
		}
	}

	.podium-first-card {
		box-shadow:
			0 40px 80px -30px oklch(0% 0 0 / 0.8),
			0 0 60px -10px color-mix(in oklab, var(--color-gold) 45%, transparent);
	}

	.hm-item {
		transition: transform 200ms ease;
	}
	.hm-item:hover {
		transform: translateY(-2px);
	}

	.podium-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 2/3;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-card);
		color: var(--color-muted);
		background: color-mix(in oklab, var(--color-surface) 50%, transparent);
	}

	.medal {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		z-index: 2;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		backdrop-filter: blur(8px);
	}
	.medal-gold {
		background: color-mix(in oklab, var(--color-gold) 20%, var(--color-bg));
		color: var(--color-gold);
		border: 1px solid color-mix(in oklab, var(--color-gold) 60%, transparent);
	}
	.medal-silver {
		background: color-mix(in oklab, var(--color-silver) 18%, var(--color-bg));
		color: var(--color-silver);
		border: 1px solid color-mix(in oklab, var(--color-silver) 60%, transparent);
	}
	.medal-bronze {
		background: color-mix(in oklab, var(--color-bronze) 18%, var(--color-bg));
		color: var(--color-bronze);
		border: 1px solid color-mix(in oklab, var(--color-bronze) 55%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.podium-slot {
			transform: none !important;
		}
		.award-card :global(img) {
			transition: none !important;
		}
	}
</style>
