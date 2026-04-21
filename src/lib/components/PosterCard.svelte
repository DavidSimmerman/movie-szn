<script lang="ts">
	import { formatPublicScore, scoreTier } from '$lib/ratings';

	type Props = {
		title: string;
		year: number;
		slug: string;
		posterUrl: string | null;
		score: number | null;
	};

	const { title, year, slug, posterUrl, score }: Props = $props();
	const tier = $derived(score == null ? null : scoreTier(score));
</script>

<a
	href="/reviews/{slug}"
	class="group relative block aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] transition duration-200 hover:-translate-y-2 hover:shadow-[0_30px_60px_-30px_oklch(0%_0_0_/_0.8),0_0_40px_-10px_oklch(78%_0.19_65_/_0.3)]"
>
	{#if posterUrl}
		<img
			src={posterUrl}
			alt={title}
			loading="lazy"
			class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
		/>
	{:else}
		<div
			class="flex h-full w-full items-center justify-center bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]"
		>
			<span class="text-mono text-xs tracking-wider uppercase">no poster</span>
		</div>
	{/if}
	<div
		class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/60 to-transparent p-4 pt-12"
	>
		<p class="text-display text-lg leading-tight">{title}</p>
		<p class="text-mono text-xs text-[color:var(--color-muted)]">{year}</p>
	</div>
	{#if score != null}
		<div
			class="absolute top-3 right-3 rounded-full border bg-[color:var(--color-bg)]/85 px-3 py-1 shadow-[0_4px_20px_-4px_oklch(0%_0_0_/_0.6)] backdrop-blur-md"
			class:border-[color:var(--color-gold)]={tier === 'flex'}
			class:border-[color:var(--color-border)]={tier !== 'flex'}
			class:text-[color:var(--color-gold)]={tier === 'peak' || tier === 'flex'}
			class:text-[color:var(--color-accent)]={tier === 'high'}
			class:text-[color:var(--color-text)]={tier === 'mid'}
			class:text-[color:var(--color-danger)]={tier === 'low'}
			class:flex-glow-ring={tier === 'flex'}
		>
			<span
				class="text-mono text-sm leading-none font-medium tabular-nums"
				class:flex-glow={tier === 'flex'}
			>
				{formatPublicScore(score)}
			</span>
		</div>
	{/if}
</a>
