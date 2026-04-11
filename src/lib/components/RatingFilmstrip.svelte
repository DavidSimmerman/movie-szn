<script lang="ts">
	import { RATING_MAX, type RatingBreakdown, CATEGORIES } from '$lib/ratings';

	type Props = {
		ratings: RatingBreakdown;
		compact?: boolean;
	};

	const { ratings, compact = false }: Props = $props();

	function cells(value: number) {
		const out: number[] = [];
		for (let i = 1; i <= RATING_MAX; i++) {
			const diff = value - (i - 1);
			const fill = Math.max(0, Math.min(1, diff));
			out.push(fill);
		}
		return out;
	}
</script>

<div class="flex" class:gap-6={!compact} class:gap-3={compact}>
	{#each CATEGORIES as cat (cat.key)}
		{@const value = ratings[cat.key]}
		{@const filled = cells(value)}
		<div class="flex flex-col items-center gap-2">
			<div class="flex flex-col-reverse gap-[2px]">
				{#each filled as fill, i (i)}
					{@const isBonus = i === 5}
					<div
						class="relative overflow-hidden rounded-[2px] border"
						class:h-6={!compact}
						class:h-4={compact}
						class:w-12={!compact}
						class:w-8={compact}
						class:border-[color:var(--color-border)]={!isBonus || fill === 0}
						class:border-[color:var(--color-gold)]={isBonus && fill > 0}
						style="background: var(--color-surface);"
					>
						<div
							class="absolute inset-0 origin-bottom transition-transform duration-500"
							style="transform: scaleY({fill}); background: {isBonus ? 'var(--color-gold)' : 'var(--color-accent)'};"
						></div>
						<div
							class="absolute top-[2px] left-[2px] h-[3px] w-[3px] rounded-full bg-[color:var(--color-bg)]/60"
						></div>
						<div
							class="absolute top-[2px] right-[2px] h-[3px] w-[3px] rounded-full bg-[color:var(--color-bg)]/60"
						></div>
					</div>
				{/each}
			</div>
			<div class="text-center">
				<p
					class="text-mono tracking-wider text-[color:var(--color-muted)] uppercase"
					class:text-xs={!compact}
					class:text-[0.55rem]={compact}
				>
					{cat.label}
				</p>
				<p
					class="text-mono tabular-nums"
					class:text-sm={!compact}
					class:text-xs={compact}
					class:text-[color:var(--color-gold)]={value > 5}
				>
					{value.toFixed(2)}
				</p>
			</div>
		</div>
	{/each}
</div>
