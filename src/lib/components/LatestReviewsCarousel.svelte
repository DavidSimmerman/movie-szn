<script lang="ts">
	import { onMount } from 'svelte';
	import PosterCard from './PosterCard.svelte';
	import { toNumber } from '$lib/ratings';

	type Item = {
		id: string;
		title: string;
		year: number;
		slug: string;
		posterUrl: string | null;
		combinedScore: string | number | null;
	};

	const { items }: { items: Item[] } = $props();

	let track: HTMLDivElement | undefined = $state();
	let current = $state(0);
	let maxStart = $state(0);
	let paused = $state(false);
	let reducedMotion = $state(false);

	function cardStride(): number {
		if (!track) return 0;
		const first = track.children[0] as HTMLElement | undefined;
		const second = track.children[1] as HTMLElement | undefined;
		if (!first) return 0;
		if (second) return second.offsetLeft - first.offsetLeft;
		return first.getBoundingClientRect().width;
	}

	function recompute() {
		if (!track) return;
		const stride = cardStride();
		if (!stride) {
			maxStart = 0;
			return;
		}
		const visible = Math.max(1, Math.round(track.clientWidth / stride));
		maxStart = Math.max(0, items.length - visible);
		if (current > maxStart) current = maxStart;
	}

	function goTo(index: number, smooth = true) {
		if (!track) return;
		const stride = cardStride();
		if (!stride) return;
		let target = index;
		if (target > maxStart) target = 0;
		else if (target < 0) target = maxStart;
		current = target;
		track.scrollTo({ left: target * stride, behavior: smooth ? 'smooth' : 'auto' });
	}

	function next() {
		goTo(current + 1);
	}

	function prev() {
		goTo(current - 1);
	}

	function onScroll() {
		if (!track) return;
		const stride = cardStride();
		if (!stride) return;
		current = Math.min(maxStart, Math.max(0, Math.round(track.scrollLeft / stride)));
	}

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		recompute();
		const ro = new ResizeObserver(recompute);
		if (track) ro.observe(track);
		const id = reducedMotion
			? null
			: setInterval(() => {
					if (!paused && document.visibilityState === 'visible') next();
				}, 5000);
		return () => {
			ro.disconnect();
			if (id) clearInterval(id);
		};
	});
</script>

<div
	class="relative"
	role="region"
	aria-roledescription="carousel"
	aria-label="Latest reviews"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
	onfocusin={() => (paused = true)}
	onfocusout={() => (paused = false)}
>
	<div
		bind:this={track}
		onscroll={onScroll}
		class="reel -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-6 pb-4"
	>
		{#each items as r (r.id)}
			<div class="reel-item shrink-0 snap-start">
				<PosterCard
					title={r.title}
					year={r.year}
					slug={r.slug}
					posterUrl={r.posterUrl}
					score={toNumber(r.combinedScore)}
				/>
			</div>
		{/each}
	</div>

	<div class="mt-6 flex items-center justify-between gap-4">
		<div class="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Review slides">
			{#each { length: maxStart + 1 } as _, i (i)}
				<button
					type="button"
					role="tab"
					aria-selected={current === i}
					aria-label={`Go to slide ${i + 1}`}
					onclick={() => goTo(i)}
					class="dot h-1.5 rounded-full border border-[color:var(--color-border)] transition-all"
					class:dot-active={current === i}
				></button>
			{/each}
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				aria-label="Previous review"
				onclick={prev}
				class="reel-btn text-mono grid h-10 w-10 place-items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M15 6l-6 6 6 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			<button
				type="button"
				aria-label="Next review"
				onclick={next}
				class="reel-btn text-mono grid h-10 w-10 place-items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M9 6l6 6-6 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
	</div>
</div>

<style>
	.reel {
		scrollbar-width: none;
		mask-image: linear-gradient(
			90deg,
			transparent,
			black 1.5rem,
			black calc(100% - 1.5rem),
			transparent
		);
	}
	.reel::-webkit-scrollbar {
		display: none;
	}
	.reel-item {
		width: calc(50% - 0.75rem);
	}
	@media (min-width: 640px) {
		.reel-item {
			width: calc((100% - 3rem) / 3);
		}
	}
	@media (min-width: 1024px) {
		.reel-item {
			width: calc((100% - 4.5rem) / 4);
		}
	}
	.dot {
		width: 1.25rem;
		background: color-mix(in oklab, var(--color-muted) 25%, transparent);
	}
	.dot-active {
		width: 2.25rem;
		background: var(--color-accent);
		border-color: var(--color-accent);
	}
</style>
