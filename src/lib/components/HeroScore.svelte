<script lang="ts">
	import { onMount } from 'svelte';
	import { Spring } from 'svelte/motion';
	import { formatPublicScore, isFlex, scoreTier } from '$lib/ratings';

	type Props = {
		score: number;
	};

	const { score }: Props = $props();
	const flex = $derived(isFlex(score));
	const tier = $derived(scoreTier(score));

	// ~600ms settle, per the design system's count-up spec
	const spring = new Spring(0, { stiffness: 0.3, damping: 0.8 });
	const animatedScore = $derived(Math.min(spring.current, score));
	const formatted = $derived(formatPublicScore(animatedScore));
	const [intPart, decPart] = $derived(formatted.split('.') as [string, string | undefined]);
	const pct = $derived(Math.min(animatedScore / 10, 1));

	onMount(() => {
		if (typeof window === 'undefined') return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		spring.set(score, { instant: reduce });
	});
</script>

<div class="flex flex-col">
	<div class="text-mono flex items-baseline gap-2 tabular-nums">
		<span
			class="text-display text-[clamp(5rem,15vw,9rem)] leading-none transition-colors"
			class:text-[color:var(--color-gold)]={flex}
			class:flex-glow={flex}
		>
			{intPart}{#if decPart}<span class="align-super text-[0.45em]">.{decPart}</span>{/if}
		</span>
		<span class="text-mono text-lg text-[color:var(--color-muted)]">/ 10</span>
	</div>
	<div
		class="mt-2 h-[3px] w-full max-w-md overflow-visible rounded-full bg-[color:var(--color-surface-2)]"
	>
		<div
			class="h-full rounded-full transition-[width] duration-500"
			class:bg-[color:var(--color-accent)]={tier !== 'flex'}
			class:bg-[color:var(--color-gold)]={tier === 'flex'}
			style="width: {pct * 100}%"
		></div>
	</div>
</div>
