<script lang="ts">
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import PosterCard from '$lib/components/PosterCard.svelte';
	import ProjectorTitle from '$lib/components/ProjectorTitle.svelte';
	import ScoringGuide from '$lib/components/ScoringGuide.svelte';
	import SeasonMarquee from '$lib/components/SeasonMarquee.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { toNumber } from '$lib/ratings';

	let { data } = $props();
	const year = new Date().getFullYear();
	const seasonLabel = $derived(data.currentSeason?.name ?? `movie season ${year}`);
	const reelsLabel = $derived(
		data.seasonReviewCount > 0
			? `${data.seasonReviewCount} ${data.seasonReviewCount === 1 ? 'movie' : 'movies'} reviewed`
			: 'now in session'
	);
</script>

<main class="relative min-h-dvh overflow-hidden">
	<FilmGrain id="grain-home" />

	<SiteHeader />

	<div class="relative mx-auto flex min-h-dvh max-w-[72rem] flex-col px-6 pb-10">
		<section class="flex flex-1 flex-col justify-center py-16">
			<p class="text-mono mb-6 text-xs tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
				◦ {seasonLabel} · {reelsLabel} ◦
			</p>
			<h1 class="text-display text-[clamp(4rem,14vw,12rem)] leading-[0.85] italic">
				<ProjectorTitle text="movie-szn" accent="-" />
			</h1>
			<p class="mt-6 max-w-xl text-lg text-[color:var(--color-muted)]">
				a time of year dedicated to giving great movies the attention they deserve.
			</p>
		</section>
	</div>

	{#if data.currentSeason && data.seasonMovies.length > 0}
		<SeasonMarquee seasonName={data.currentSeason.name} items={data.seasonMovies} />
	{/if}

	<div class="relative mx-auto max-w-[72rem] px-6 py-16">
		<section class="mb-20">
			<p
				class="text-mono mb-6 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
			>
				◦ director's note ◦
			</p>
			<article
				class="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 sm:p-10"
			>
				<div
					class="text-display max-w-[56ch] space-y-5 text-lg leading-relaxed text-[color:var(--color-muted)] italic sm:text-xl"
				>
					<p>
						movie-szn started as a frustration with holiday movies. every christmas morning my
						family puts on <em>A Christmas Story</em> and leaves it running. i can't stand it, but
						i've seen it at least once a year for my entire life — which makes it, by
						raw count, the movie i've watched more than any other. nothing else comes close.
					</p>
					<p>
						it isn't just my family. people talk about their yearly christmas rewatch like a
						ritual, and fair enough. but ask those same people to name their favorite films and a
						holiday movie almost never makes the cut. the ones they love most and the ones they
						watch most end up on two different lists, and it's those yearly holiday rewatches
						quietly running up the count.
					</p>
					<p class="text-[color:var(--color-accent)]">
						so where's the love for the actual greats? why don't we make a tradition of rewatching
						the all-time classics every year?
					</p>
					<p>
						i'm a sports guy — college basketball, college football, the nfl. september through
						april there are usually four games running at once and a movie doesn't make the screen.
						the other half of the year is a sports dead zone (baseball aside — yuck), so i carved
						it off and called it movie season: time to rewatch the ones i love and finally get to
						the ones i've been meaning to.
					</p>
					<p>
						this site documents each season to keep track of the movies i really enjoy, and gives
						friends a chance to suggest picks and ride along on the fun.
					</p>
				</div>
				<p
					class="text-mono mt-8 text-right text-xs tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					— dave
				</p>
			</article>
		</section>

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

		<section class="mt-20">
			<p
				class="text-mono mb-6 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
			>
				◦ how it's scored ◦
			</p>
			<ScoringGuide />
		</section>

		<footer
			class="text-mono mt-16 flex items-center justify-between border-t border-[color:var(--color-border)] pt-6 text-xs text-[color:var(--color-muted)]"
		>
			<span>© {year} dave</span>
			<a href="/rss.xml" class="hover:text-[color:var(--color-text)]">rss</a>
		</footer>
	</div>
</main>
