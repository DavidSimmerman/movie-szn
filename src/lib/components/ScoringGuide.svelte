<script lang="ts">
	import { CATEGORIES } from '$lib/ratings';

	type Props = { factorLabel?: string; factorName?: string };
	const { factorLabel, factorName = 'dave' }: Props = $props();

	const DESCRIPTIONS: Record<(typeof CATEGORIES)[number]['key'], string> = {
		production:
			'visual effects, camera work, sound, design. how good is one given frame and how well are they stitched together.',
		acting:
			'how convincing is the cast and how well do they fit their roles? do they help immerse you in their world, or does unbelievable acting pull you right back out of it?',
		storyPlot:
			'how well the emotions and deeper meanings are conveyed, plus the pacing and events that keep your interest along the way.',
		intent:
			'whatever the movie is actually trying to do — action, comedy, world-building, or making the audience solve a puzzle.',
		daveFactor: 'pure bias.'
	};

	function label(cat: (typeof CATEGORIES)[number]): string {
		return cat.key === 'daveFactor' && factorLabel ? factorLabel : cat.label;
	}
	function describe(cat: (typeof CATEGORIES)[number]): string {
		return cat.key === 'daveFactor'
			? `pure bias. how much ${factorName} personally liked the movie.`
			: DESCRIPTIONS[cat.key];
	}

	const SCALE: Array<{ mark: string; note: string }> = [
		{ mark: '2.0', note: 'awful' },
		{ mark: '4.0', note: 'bad' },
		{ mark: '5.0', note: 'average' },
		{ mark: '7.5', note: 'good' },
		{ mark: '9.0', note: 'amazing' },
		{ mark: '10', note: 'perfect' }
	];
</script>

<div
	class="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 sm:p-8"
>
	<div
		class="text-display max-w-[62ch] space-y-4 text-base leading-relaxed text-[color:var(--color-muted)] italic sm:text-lg"
	>
		<p>
			every movie is scored across the five criteria below. each is rated out of 5 stars and starts
			at a 2.5★ baseline — that's an average movie. ratings move up or down from there.
		</p>
		<p>
			a rare 6th <span class="text-[color:var(--color-gold)] not-italic">★</span> is reserved for the
			most excellent films — the ones that do something better than the genre has any right to expect.
		</p>
	</div>

	<dl class="mt-8 divide-y divide-[color:var(--color-border)]">
		{#each CATEGORIES as cat (cat.key)}
			<div class="rubric-row grid items-start gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6 sm:py-6">
				<dt
					class="text-mono pt-1 text-[0.7rem] tracking-[0.25em] text-[color:var(--color-accent)] uppercase"
				>
					{label(cat)}
				</dt>
				<dd
					class="text-display flex items-center text-base leading-relaxed italic sm:min-h-[5.5rem] sm:text-lg"
				>
					<span>{describe(cat)}</span>
				</dd>
			</div>
		{/each}
	</dl>

	<div class="mt-10 border-t border-[color:var(--color-border)] pt-6">
		<p
			class="text-mono mb-4 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
		>
			◦ the scale ◦
		</p>
		<ul class="text-mono space-y-1 text-sm">
			{#each SCALE as row (row.mark)}
				<li class="flex items-baseline gap-4">
					<span class="w-20 shrink-0 text-right text-[color:var(--color-text)] tabular-nums">
						{row.mark}
					</span>
					<span class="text-[color:var(--color-muted)]">{row.note}</span>
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.rubric-row {
		transition: border-color 120ms ease-out;
		border-left: 1px solid transparent;
		padding-left: 0.75rem;
		margin-left: -0.75rem;
	}
	.rubric-row:hover {
		border-left-color: var(--color-accent);
	}
	@media (prefers-reduced-motion: reduce) {
		.rubric-row {
			transition: none;
		}
	}
</style>
