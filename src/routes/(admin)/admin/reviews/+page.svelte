<script lang="ts">
	import { toNumber, formatScore } from '$lib/ratings';

	let { data } = $props();
</script>

<svelte:head><title>reviews · admin</title></svelte:head>

<div class="mb-8 flex items-end justify-between">
	<h1 class="text-display text-4xl italic">reviews</h1>
	<a
		href="/admin/movies/new"
		class="text-mono rounded-md border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-4 py-2 text-xs tracking-wider text-[color:var(--color-accent)] uppercase"
	>
		+ new review
	</a>
</div>

{#if data.reviews.length === 0}
	<p class="text-[color:var(--color-muted)]">
		no reviews yet — import a movie first, then write its review.
	</p>
{:else}
	<ul class="divide-y divide-[color:var(--color-border)]">
		{#each data.reviews as r (r.id)}
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
