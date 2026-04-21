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
		acting: $form.acting,
		storyPlot: $form.storyPlot,
		intent: $form.intent,
		daveFactor: $form.daveFactor
	});
	const score = $derived(combinedScore(ratings));
	const flex = $derived(isFlex(score));

	const CATEGORY_KEYS = ['production', 'acting', 'storyPlot', 'intent', 'daveFactor'] as const;
	const CATEGORY_LABELS: Record<(typeof CATEGORY_KEYS)[number], string> = {
		production: 'production',
		acting: 'acting',
		storyPlot: 'story / plot',
		intent: 'intent',
		daveFactor: 'dave factor'
	};
</script>

<svelte:head><title>new review · admin</title></svelte:head>

<div class="mb-8 flex items-start gap-6">
	{#if data.movie.posterUrl}
		<img src={data.movie.posterUrl} alt="" class="h-48 w-32 rounded object-cover" />
	{/if}
	<div class="flex-1">
		<p class="text-mono text-[0.65rem] tracking-[0.3em] text-[color:var(--color-accent)] uppercase">
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
			<p class="text-display text-6xl tabular-nums" class:text-[color:var(--color-gold)]={flex}>
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
		<div
			class="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
		>
			<RatingFilmstrip {ratings} />
		</div>
	</section>

	<div class="grid gap-6 md:grid-cols-2">
		{#each CATEGORY_KEYS as key (key)}
			<label class="block">
				<div class="mb-2 flex items-baseline justify-between">
					<span class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
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
				<div class="text-mono relative mt-1 h-4 text-[0.65rem] text-[color:var(--color-muted)]">
					<span class="absolute left-0">0</span>
					<span class="absolute left-[41.6667%] -translate-x-1/2">2.5</span>
					<span class="absolute left-[83.3333%] -translate-x-1/2">5</span>
					<span class="absolute right-0 text-[color:var(--color-gold)]">6 (flex)</span>
				</div>
			</label>
		{/each}
	</div>

	{#if data.seasons.length > 0}
		<div>
			<p class="text-mono mb-3 text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
				seasons
			</p>
			<div class="flex flex-wrap gap-2">
				{#each data.seasons as s (s.id)}
					{@const checked = $form.seasonIds.includes(s.id)}
					{@const isLatest = s.id === data.latestSeasonId}
					<label
						class="text-mono flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs tracking-wider uppercase transition"
						class:border-[color:var(--color-accent)]={checked}
						class:bg-[color:var(--color-accent)]={checked}
						class:text-[color:var(--color-bg)]={checked}
						class:border-[color:var(--color-border)]={!checked}
						class:text-[color:var(--color-muted)]={!checked}
					>
						<input
							type="checkbox"
							class="sr-only"
							{checked}
							onchange={(e) => {
								if ((e.currentTarget as HTMLInputElement).checked) {
									$form.seasonIds = [...$form.seasonIds, s.id];
								} else {
									$form.seasonIds = $form.seasonIds.filter((id) => id !== s.id);
								}
							}}
						/>
						<span>{checked ? '✓' : '+'}</span>
						<span>{s.name}</span>
						{#if isLatest}
							<span
								class="text-[0.55rem] tracking-[0.2em]"
								class:text-[color:var(--color-bg)]={checked}
								class:text-[color:var(--color-accent)]={!checked}
							>
								latest
							</span>
						{/if}
					</label>
				{/each}
			</div>
			<p class="text-mono mt-2 text-[0.6rem] text-[color:var(--color-muted)]">
				new reviews are auto-tagged to the latest season. uncheck to opt out.
			</p>
		</div>
	{/if}

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
