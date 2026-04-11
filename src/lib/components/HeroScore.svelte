<script lang="ts">
	import { formatScore, isFlex, scoreTier } from '$lib/ratings';

	type Props = {
		score: number;
	};

	const { score }: Props = $props();
	const flex = $derived(isFlex(score));
	const tier = $derived(scoreTier(score));
	const pct = $derived(Math.min(score / 10, 1.2));
	const formatted = $derived(formatScore(score));
	const [intPart, decPart] = $derived(formatted.split('.') as [string, string]);
</script>

<div class="flex flex-col">
	<div class="text-mono flex items-baseline gap-2 tabular-nums">
		<span
			class="text-display text-[clamp(5rem,15vw,9rem)] leading-none"
			class:text-[color:var(--color-gold)]={flex}
		>
			{intPart}<span class="text-[0.45em] align-super">.{decPart}</span>
		</span>
		<span class="text-mono text-lg text-[color:var(--color-muted)]">/ 10</span>
		{#if flex}
			<span
				class="text-mono ml-3 self-center rounded-full border border-[color:var(--color-gold)] px-3 py-1 text-xs tracking-[0.3em] text-[color:var(--color-gold)] uppercase"
			>
				★ flex
			</span>
		{/if}
	</div>
	<div class="mt-2 h-[3px] w-full max-w-md overflow-visible rounded-full bg-[color:var(--color-surface-2)]">
		<div
			class="h-full rounded-full"
			class:bg-[color:var(--color-accent)]={tier !== 'flex' && tier !== 'peak'}
			class:bg-[color:var(--color-gold)]={tier === 'peak' || tier === 'flex'}
			style="width: {Math.min(pct * 100, 120)}%"
		></div>
	</div>
</div>
