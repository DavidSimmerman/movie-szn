<script lang="ts">
	type Props = {
		value: number;
		max?: number;
		size?: 'sm' | 'md';
	};

	const { value, max = 5, size = 'sm' }: Props = $props();

	const STAR_PATH =
		'M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.08 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z';

	const stars = $derived(
		Array.from({ length: max }, (_, i) => Math.max(0, Math.min(1, value - i)))
	);
</script>

<div role="img" aria-label="{value} out of {max} stars" class="flex gap-[3px]">
	{#each stars as fill, i (i)}
		<div
			class="relative"
			class:h-4={size === 'sm'}
			class:w-4={size === 'sm'}
			class:h-5={size === 'md'}
			class:w-5={size === 'md'}
		>
			<svg
				viewBox="0 0 24 24"
				class="absolute inset-0 h-full w-full"
				fill="none"
				stroke="var(--color-border)"
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
					style="width: {size === 'md' ? '1.25rem' : '1rem'};"
					fill="var(--color-accent)"
					aria-hidden="true"
				>
					<path d={STAR_PATH} />
				</svg>
			</div>
		</div>
	{/each}
</div>
