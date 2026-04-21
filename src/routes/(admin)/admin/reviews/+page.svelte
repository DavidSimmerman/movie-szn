<script lang="ts">
	import { toNumber, formatScore } from '$lib/ratings';

	let { data } = $props();

	let filter = $state('');

	const filtered = $derived(
		data.reviews.filter((r) => {
			if (!filter) return true;
			const q = filter.toLowerCase();
			return r.title.toLowerCase().includes(q) || String(r.year).includes(q);
		})
	);
</script>

<svelte:head><title>reviews · admin</title></svelte:head>

<div class="mb-6 flex items-end justify-between gap-4">
	<div>
		<h1 class="text-display text-4xl italic">reviews</h1>
		<p class="text-mono mt-1 text-xs text-[color:var(--color-muted)]">
			{data.reviews.length} published
		</p>
	</div>
	<a
		href="/admin/movies/new"
		class="text-mono rounded-md border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-4 py-2 text-xs tracking-wider text-[color:var(--color-accent)] uppercase"
	>
		+ import &amp; review
	</a>
</div>

{#if data.reviews.length === 0}
	<p class="text-[color:var(--color-muted)]">
		no reviews yet — import a movie first, then write its review.
	</p>
{:else}
	<div class="mb-4 flex items-center gap-3">
		<input
			type="search"
			bind:value={filter}
			placeholder="filter reviews…"
			class="text-mono flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)]"
		/>
		{#if filter}
			<p class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
				{filtered.length} / {data.reviews.length}
			</p>
		{/if}
	</div>

	{#if filtered.length === 0}
		<p class="text-mono text-xs text-[color:var(--color-muted)]">nothing matches.</p>
	{:else}
		<ul class="divide-y divide-[color:var(--color-border)]">
			{#each filtered as r (r.id)}
				{@const score = toNumber(r.combinedScore)}
				<li class="flex items-center justify-between py-4">
					<div>
						<p class="text-display text-lg">{r.title}</p>
						<p class="text-mono text-xs text-[color:var(--color-muted)]">{r.year}</p>
					</div>
					<div class="flex items-center gap-4">
						<span
							class="text-mono text-xl tabular-nums"
							class:text-[color:var(--color-gold)]={score > 10}
						>
							{formatScore(score)}
						</span>
						<a
							href="/admin/reviews/new?movieSlug={r.slug}"
							class="text-mono text-xs tracking-wider text-[color:var(--color-accent)] uppercase hover:text-[color:var(--color-text)]"
						>
							edit
						</a>
						<a
							href="/reviews/{r.slug}"
							class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase hover:text-[color:var(--color-text)]"
						>
							view →
						</a>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
{/if}
