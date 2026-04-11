<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import RatingFilmstrip from '$lib/components/RatingFilmstrip.svelte';
	import { combinedScore, formatScore, isFlex, type RatingBreakdown } from '$lib/ratings';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	const { form, enhance, submitting, message } = superForm(data.form, {
		dataType: 'json'
	});

	const ratings = $derived<RatingBreakdown>({
		production: $form.production,
		storyPlot: $form.storyPlot,
		misc: $form.misc,
		daveFactor: $form.daveFactor
	});
	const score = $derived(combinedScore(ratings));
	const flex = $derived(isFlex(score));

	const CATEGORY_KEYS = ['production', 'storyPlot', 'misc', 'daveFactor'] as const;
	const CATEGORY_LABELS: Record<(typeof CATEGORY_KEYS)[number], string> = {
		production: 'production',
		storyPlot: 'story / plot',
		misc: 'misc',
		daveFactor: 'dave factor'
	};
</script>

<svelte:head><title>new review · admin</title></svelte:head>

<div class="mb-8 flex items-start gap-6">
	{#if data.movie.posterUrl}
		<img src={data.movie.posterUrl} alt="" class="h-48 w-32 rounded object-cover" />
	{/if}
	<div class="flex-1">
		<p
			class="text-mono text-[0.65rem] tracking-[0.3em] text-[color:var(--color-accent)] uppercase"
		>
			{data.editing ? '◦ edit review ◦' : '◦ new review ◦'}
		</p>
		<h1 class="text-display mt-1 text-5xl italic">{data.movie.title}</h1>
		<p class="text-mono mt-2 text-sm text-[color:var(--color-muted)]">
			{data.movie.year} · {data.movie.type}
		</p>
	</div>
</div>

<form method="POST" use:enhance class="space-y-10">
	<input type="hidden" name="movieId" bind:value={$form.movieId} />

	<section>
		<div
			class="mb-6 flex items-baseline gap-3 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
		>
			<p
				class="text-mono text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
			>
				live score
			</p>
			<p
				class="text-display text-6xl tabular-nums"
				class:text-[color:var(--color-gold)]={flex}
			>
				{formatScore(score)}
			</p>
			<p class="text-mono text-sm text-[color:var(--color-muted)]">/ 10</p>
			{#if flex}
				<span
					class="text-mono ml-2 rounded-full border border-[color:var(--color-gold)] px-3 py-1 text-xs tracking-[0.3em] text-[color:var(--color-gold)] uppercase"
				>
					★ flex
				</span>
			{/if}
		</div>
		<div class="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
			<RatingFilmstrip {ratings} />
		</div>
	</section>

	<div class="grid gap-6 md:grid-cols-2">
		{#each CATEGORY_KEYS as key (key)}
			<label class="block">
				<div class="mb-2 flex items-baseline justify-between">
					<span
						class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
					>
						{CATEGORY_LABELS[key]}
					</span>
					<span
						class="text-mono text-lg tabular-nums"
						class:text-[color:var(--color-gold)]={$form[key] > 5}
					>
						{$form[key].toFixed(2)}
					</span>
				</div>
				<input
					type="range"
					min="0"
					max="6"
					step="0.25"
					bind:value={$form[key]}
					class="w-full accent-[color:var(--color-accent)]"
				/>
				<div class="text-mono mt-1 flex justify-between text-[0.6rem] text-[color:var(--color-muted)]">
					<span>0</span>
					<span>2.5</span>
					<span>5</span>
					<span class="text-[color:var(--color-gold)]">6 (flex)</span>
				</div>
			</label>
		{/each}
	</div>

	<div>
		<label class="mb-2 block">
			<span class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
				watched on
			</span>
			<input
				type="date"
				bind:value={$form.watchedAt}
				class="text-mono mt-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
			/>
		</label>
	</div>

	<div>
		<label class="block">
			<span class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
				notes
			</span>
			<textarea
				bind:value={$form.notes}
				rows="8"
				placeholder="write it up. what worked, what didn't, who nailed it."
				class="mt-2 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-3 outline-none focus:border-[color:var(--color-accent)]"
			></textarea>
		</label>
	</div>

	{#if $message}
		<p class="text-mono text-xs text-[color:var(--color-accent)]">{$message}</p>
	{/if}

	<div class="flex gap-4">
		<button
			type="submit"
			disabled={$submitting}
			class="text-mono rounded-md bg-[color:var(--color-accent)] px-6 py-3 text-sm tracking-wider text-[color:var(--color-bg)] uppercase transition hover:opacity-90 disabled:opacity-50"
		>
			{$submitting ? 'saving...' : data.editing ? 'update review' : 'publish review'}
		</button>
		<a
			href="/admin/reviews"
			class="text-mono self-center text-xs tracking-wider text-[color:var(--color-muted)] uppercase hover:text-[color:var(--color-text)]"
		>
			cancel
		</a>
	</div>
</form>
