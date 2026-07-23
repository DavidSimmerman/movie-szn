<script lang="ts">
	let { data } = $props();

	const cards = $derived([
		['movies', data.counts.movies, '/admin/movies'],
		['reviews', data.counts.reviews, '/admin/reviews'],
		['seasons', data.counts.seasons, '/admin/seasons'],
		['watch list', data.counts.watchList, '/admin/watchlist'],
		...(data.isAdmin
			? ([['pending suggestions', data.counts.pendingSuggestions, '/admin/suggestions']] as const)
			: [])
	] as const);

	const fmtDate = (d: string) =>
		new Date(d + 'T00:00:00')
			.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
			.toLowerCase();

	const score = (s: string | null) => (s === null ? '—' : Number(s).toFixed(1));
</script>

<svelte:head>
	<title>admin · movie-szn</title>
</svelte:head>

<div class="mb-8 flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="text-display text-5xl italic">projection booth</h1>
		{#if data.currentSeason}
			<a
				href="/admin/seasons/{data.currentSeason.slug}"
				class="text-mono mt-3 inline-block text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase transition hover:text-[color:var(--color-accent)]"
			>
				● {data.currentSeason.name} · {data.currentSeason.tagged} tagged · ends {fmtDate(
					data.currentSeason.endsAt
				)}
			</a>
		{/if}
	</div>
	{#if data.dbReady}
		<div class="flex flex-wrap items-center gap-3">
			<a
				href="/admin/movies/new"
				class="text-mono rounded-full border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 px-4 py-2 text-xs tracking-wider text-[color:var(--color-accent)] uppercase transition hover:bg-[color:var(--color-accent)]/20"
			>
				+ import &amp; review
			</a>
			<a
				href="/admin/watchlist"
				class="text-mono rounded-full border border-[color:var(--color-border)] px-4 py-2 text-xs tracking-wider text-[color:var(--color-muted)] uppercase transition hover:text-[color:var(--color-text)]"
			>
				+ watchlist
			</a>
			<a
				href="/admin/seasons"
				class="text-mono rounded-full border border-[color:var(--color-border)] px-4 py-2 text-xs tracking-wider text-[color:var(--color-muted)] uppercase transition hover:text-[color:var(--color-text)]"
			>
				+ season
			</a>
		</div>
	{/if}
</div>

{#if !data.dbReady}
	<div
		class="rounded-[var(--radius-card)] border border-[color:var(--color-accent-2)]/40 bg-[color:var(--color-surface)] p-6"
	>
		<p class="text-mono text-xs tracking-wider text-[color:var(--color-accent-2)] uppercase">
			database not configured
		</p>
		<p class="mt-2 text-sm text-[color:var(--color-muted)]">
			set <code class="text-mono">DATABASE_URL</code> in your env to see counts.
		</p>
	</div>
{:else}
	<div class="grid grid-cols-2 gap-4 {cards.length === 5 ? 'md:grid-cols-5' : 'md:grid-cols-4'}">
		{#each cards as [label, value, href] (label)}
			<a
				{href}
				class="group rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 transition hover:border-[color:var(--color-accent)]/50"
			>
				<p
					class="text-mono mb-3 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase transition group-hover:text-[color:var(--color-accent)]"
				>
					{label}
					<span class="opacity-0 transition group-hover:opacity-100">→</span>
				</p>
				<p
					class="text-display text-5xl {label === 'pending suggestions' && value > 0
						? 'text-[color:var(--color-accent)]'
						: ''}"
				>
					{value}
				</p>
			</a>
		{/each}
	</div>

	<div class="mt-10 grid gap-6 lg:grid-cols-2">
		<section
			class="min-w-0 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
		>
			<div class="mb-4 flex items-baseline justify-between">
				<h2
					class="text-mono text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					latest reviews
				</h2>
				<a
					href="/admin/reviews"
					class="text-mono -m-2 p-2 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase transition hover:text-[color:var(--color-accent)]"
				>
					all →
				</a>
			</div>
			{#if data.latestReviews.length === 0}
				<p class="text-sm text-[color:var(--color-muted)]">
					nothing reviewed yet — <a
						class="text-[color:var(--color-accent)]"
						href="/admin/movies/new">import something</a
					>.
				</p>
			{:else}
				<ul class="divide-y divide-[color:var(--color-border)]">
					{#each data.latestReviews as r (r.slug)}
						<li class="flex items-center justify-between gap-3 py-2.5">
							<span class="min-w-0">
								<a
									href="/admin/reviews/new?movieSlug={r.slug}"
									class="block truncate text-sm transition hover:text-[color:var(--color-accent)]"
								>
									{r.title}
								</a>
								<span class="text-mono text-[0.65rem] text-[color:var(--color-muted)]"
									>{r.year}</span
								>
							</span>
							<span class="text-mono shrink-0 text-sm text-[color:var(--color-accent)]">
								{score(r.combinedScore)}
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if data.isAdmin}
			<section
				class="min-w-0 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
			>
				<div class="mb-4 flex items-baseline justify-between">
					<h2
						class="text-mono text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
					>
						on deck · most upvoted
					</h2>
					<a
						href="/admin/suggestions"
						class="text-mono -m-2 p-2 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase transition hover:text-[color:var(--color-accent)]"
					>
						all →
					</a>
				</div>
				{#if data.pendingSuggestions.length === 0}
					<p class="text-sm text-[color:var(--color-muted)]">
						no pending suggestions. quiet out there.
					</p>
				{:else}
					<ul class="divide-y divide-[color:var(--color-border)]">
						{#each data.pendingSuggestions as s (s.id)}
							<li class="flex items-center justify-between gap-3 py-2.5">
								<span class="min-w-0">
									<span class="block truncate text-sm">
										{s.title}
										{#if s.year}<span class="text-[color:var(--color-muted)]">({s.year})</span>{/if}
									</span>
									{#if s.submitterName}
										<span class="text-mono text-[0.65rem] text-[color:var(--color-muted)]">
											from {s.submitterName}
										</span>
									{/if}
								</span>
								<span class="text-mono shrink-0 text-sm text-[color:var(--color-muted)]">
									▲ {s.voteCount}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}
	</div>
{/if}
