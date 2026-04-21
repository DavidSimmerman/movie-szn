<script lang="ts">
	type MarqueeItem = { title: string; year: number; slug: string };

	type Props = {
		seasonName: string;
		items: MarqueeItem[];
	};

	const { seasonName, items }: Props = $props();

	// duplicate so the scroll loops seamlessly
	const doubled = $derived([...items, ...items]);
</script>

<div
	class="relative overflow-hidden border-y border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-4"
>
	<div
		class="text-mono absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full border border-[color:var(--color-accent)] bg-[color:var(--color-bg)] px-3 py-1 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-accent)] uppercase"
	>
		{seasonName}
	</div>
	<div class="marquee-wrap pl-[11rem] sm:pl-[14rem]">
		<div class="marquee-track text-display flex gap-10 text-2xl whitespace-nowrap italic">
			{#each doubled as item, i (i + '-' + item.slug)}
				<a href="/reviews/{item.slug}" class="transition hover:text-[color:var(--color-accent)]">
					{item.title}
					<span class="text-mono text-sm text-[color:var(--color-muted)]">{item.year}</span>
				</a>
				<span aria-hidden="true" class="text-[color:var(--color-accent)]">◦</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.marquee-wrap {
		mask-image: linear-gradient(
			90deg,
			transparent,
			black 11rem,
			black calc(100% - 3rem),
			transparent
		);
	}
	@media (min-width: 640px) {
		.marquee-wrap {
			mask-image: linear-gradient(
				90deg,
				transparent,
				black 14rem,
				black calc(100% - 3rem),
				transparent
			);
		}
	}
	.marquee-track {
		animation: marquee 45s linear infinite;
	}
	.marquee-wrap:hover .marquee-track {
		animation-play-state: paused;
	}
	@keyframes marquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.marquee-track {
			animation: none;
		}
	}
</style>
