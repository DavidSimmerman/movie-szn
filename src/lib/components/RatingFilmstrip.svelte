<script lang="ts">
	import { RATING_MAX, type RatingBreakdown, CATEGORIES } from '$lib/ratings';

	type Props = {
		ratings: RatingBreakdown;
		compact?: boolean;
		/** Overrides the "dave factor" label with the review author's, e.g. "rob factor". */
		factorLabel?: string;
	};

	const { ratings, compact = false, factorLabel }: Props = $props();

	function cells(value: number) {
		const out: number[] = [];
		for (let i = 1; i <= RATING_MAX; i++) {
			const diff = value - (i - 1);
			const fill = Math.max(0, Math.min(1, diff));
			out.push(fill);
		}
		return out;
	}

	const STAR_PATH =
		'M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.08 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z';
</script>

<div
	class={compact ? '' : 'gap-x-6 lg:gap-x-4'}
	class:grid={!compact}
	class:grid-cols-2={!compact}
	class:lg:grid-cols-5={!compact}
	class:gap-y-8={!compact}
	class:flex={compact}
	class:flex-wrap={compact}
	class:justify-between={compact}
	class:gap-y-4={compact}
	class:gap-x-2={compact}
>
	{#each CATEGORIES as cat (cat.key)}
		{@const value = ratings[cat.key]}
		{@const filled = cells(value)}
		<div class="flex flex-col items-start gap-2">
			<div class="flex" class:gap-1={!compact} class:gap-[2px]={compact}>
				{#each filled as fill, i (i)}
					{@const isBonus = i === 5}
					{#if !isBonus || fill > 0}
						{@const outlineColor = isBonus ? 'var(--color-gold)' : 'var(--color-border)'}
						{@const fillColor = isBonus ? 'var(--color-gold)' : 'var(--color-accent)'}
						<div
							class="relative"
							class:h-6={!compact}
							class:w-6={!compact}
							class:h-4={compact}
							class:w-4={compact}
						>
							<svg
								viewBox="0 0 24 24"
								class="absolute inset-0 h-full w-full"
								fill="none"
								stroke={outlineColor}
								stroke-width="1.4"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d={STAR_PATH} />
							</svg>
							<div
								class="absolute inset-0 overflow-hidden transition-[width] duration-500"
								style="width: {fill * 100}%;"
							>
								<svg
									viewBox="0 0 24 24"
									class="h-full"
									style="width: {compact ? '1rem' : '1.5rem'};"
									fill={fillColor}
									aria-hidden="true"
								>
									<path d={STAR_PATH} />
								</svg>
							</div>
						</div>
					{/if}
				{/each}
			</div>
			<div>
				<p
					class="text-mono tracking-wider text-[color:var(--color-muted)] uppercase"
					class:text-xs={!compact}
					class:text-[0.65rem]={compact}
				>
					{cat.key === 'daveFactor' && factorLabel ? factorLabel : cat.label}
				</p>
				<p
					class="text-display leading-none font-semibold text-[color:var(--color-text)] tabular-nums"
					class:text-3xl={!compact}
					class:mt-1={!compact}
					class:text-lg={compact}
					class:text-[color:var(--color-gold)]={value > 5}
				>
					{value.toFixed(2)}
				</p>
			</div>
		</div>
	{/each}
</div>
