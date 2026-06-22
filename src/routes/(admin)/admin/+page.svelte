<script lang="ts">
	let { data } = $props();

	const cards = $derived([
		['movies', data.counts.movies],
		['reviews', data.counts.reviews],
		['seasons', data.counts.seasons],
		['watch list', data.counts.watchList],
		...(data.isAdmin ? ([['pending suggestions', data.counts.pendingSuggestions]] as const) : [])
	] as const);
</script>

<svelte:head>
	<title>admin · movie-szn</title>
</svelte:head>

<h1 class="text-display mb-8 text-5xl italic">projection booth</h1>

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
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		{#each cards as [label, value] (label)}
			<article
				class="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
			>
				<p
					class="text-mono mb-3 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					{label}
				</p>
				<p class="text-display text-5xl">{value}</p>
			</article>
		{/each}
	</div>
{/if}
