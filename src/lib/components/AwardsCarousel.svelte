<script lang="ts">
	import { onMount } from 'svelte';

	type Pick = {
		categoryId: string;
		categoryName: string;
		movieSlug: string;
		title: string;
		year: number;
		posterUrl: string | null;
		rank: string;
	};

	type Props = { picks: Pick[]; rankLabel: Record<string, string> };
	const { picks, rankLabel }: Props = $props();

	let track: HTMLDivElement | undefined = $state();
	let currentReal = $state(0);
	let reducedMotion = $state(false);

	const loop = $derived([...picks, ...picks, ...picks]);
	const realCount = $derived(picks.length);
	const currentCategory = $derived(picks[currentReal]?.categoryName ?? '');
	let rafId = 0;
	let teleporting = false;
	let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

	const rankClass: Record<string, string> = {
		first: 'ribbon--gold',
		second: 'ribbon--silver',
		third: 'ribbon--bronze',
		honorable: 'ribbon--accent'
	};

	function stride(): number {
		if (!track) return 0;
		const a = track.children[0] as HTMLElement | undefined;
		const b = track.children[1] as HTMLElement | undefined;
		if (!a || !b) return 0;
		return b.offsetLeft - a.offsetLeft;
	}

	function snapToIndex(index: number, smooth: boolean) {
		if (!track) return;
		const card = track.children[index] as HTMLElement | undefined;
		if (!card) return;
		const target = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
		const behavior: ScrollBehavior = smooth && !reducedMotion ? 'smooth' : 'instant';
		if (behavior === 'instant') {
			teleporting = true;
			track.scrollTo({ left: target, behavior });
			requestAnimationFrame(() => {
				teleporting = false;
			});
		} else {
			track.scrollTo({ left: target, behavior });
		}
	}

	function virtualIndex(): number {
		if (!track) return realCount;
		const s = stride();
		if (!s) return realCount;
		const first = track.children[0] as HTMLElement;
		const centerX = track.scrollLeft + track.clientWidth / 2;
		const virtual = Math.round((centerX - first.offsetWidth / 2) / s);
		return Math.max(0, Math.min(loop.length - 1, virtual));
	}

	function onScroll() {
		if (!track || teleporting) return;
		if (!rafId) {
			rafId = requestAnimationFrame(() => {
				rafId = 0;
				if (!track) return;
				currentReal = ((virtualIndex() % realCount) + realCount) % realCount;
			});
		}
		if (scrollEndTimer) clearTimeout(scrollEndTimer);
		scrollEndTimer = setTimeout(checkTeleport, 160);
	}

	function checkTeleport() {
		if (!track || teleporting) return;
		const clamped = virtualIndex();
		if (clamped < realCount) snapToIndex(clamped + realCount, false);
		else if (clamped >= realCount * 2) snapToIndex(clamped - realCount, false);
	}

	function onScrollEnd() {
		if (scrollEndTimer) {
			clearTimeout(scrollEndTimer);
			scrollEndTimer = undefined;
		}
		checkTeleport();
	}

	function goToReal(realIdx: number) {
		snapToIndex(realCount + realIdx, true);
	}

	onMount(() => {
		reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		snapToIndex(realCount, false);
		const ro = new ResizeObserver(() => snapToIndex(realCount + currentReal, false));
		if (track) ro.observe(track);
		return () => ro.disconnect();
	});
</script>

<div class="carousel" role="region" aria-roledescription="carousel" aria-label="Season awards">
	<div bind:this={track} class="track" onscroll={onScroll} onscrollend={onScrollEnd}>
		{#each loop as pick, i (i)}
			<a
				href="/reviews/{pick.movieSlug}"
				class="card"
				class:is-centered={i % realCount === currentReal}
				aria-hidden={i < realCount || i >= realCount * 2 ? 'true' : undefined}
				tabindex={i < realCount || i >= realCount * 2 ? -1 : 0}
			>
				{#if pick.posterUrl}
					<img src={pick.posterUrl} alt={pick.title} loading="lazy" class="poster" />
				{:else}
					<div class="poster poster--empty"></div>
				{/if}
				<span class="ribbon {rankClass[pick.rank] ?? 'ribbon--accent'}"
					>{rankLabel[pick.rank] ?? pick.rank}</span
				>
				<div class="meta">
					<p class="movie">{pick.title}</p>
					<p class="year">{pick.year}</p>
				</div>
			</a>
		{/each}
	</div>

	<p class="caption" aria-live="polite">{currentCategory}</p>

	<div class="dots" role="tablist" aria-label="Awards">
		{#each picks as _, i (i)}
			<button
				type="button"
				role="tab"
				aria-selected={currentReal === i}
				aria-label={`Award ${i + 1}`}
				onclick={() => goToReal(i)}
				class="dot"
				class:dot-active={currentReal === i}
			></button>
		{/each}
	</div>
</div>

<style>
	.carousel {
		position: relative;
		margin: -1rem -0.5rem 0.5rem;
	}
	.track {
		display: flex;
		gap: 0.75rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		scrollbar-width: none;
		padding: 3rem 0 3rem;
	}
	.track::-webkit-scrollbar {
		display: none;
	}
	.card {
		position: relative;
		flex: 0 0 70%;
		scroll-snap-align: center;
		aspect-ratio: 2 / 3;
		border-radius: var(--radius-card);
		overflow: hidden;
		border: 1px solid color-mix(in oklch, var(--color-border) 80%, transparent);
		background: var(--color-surface);
		text-decoration: none;
		color: inherit;
		opacity: 0.45;
		transform: scale(0.92);
		transition:
			opacity 300ms ease,
			transform 300ms ease,
			border-color 300ms ease,
			box-shadow 300ms ease;
		text-align: left;
	}
	.card.is-centered {
		opacity: 1;
		transform: scale(1);
		border-color: color-mix(in oklch, var(--color-gold) 55%, transparent);
		box-shadow:
			0 30px 60px -28px oklch(0% 0 0 / 0.85),
			0 0 50px -12px color-mix(in oklch, var(--color-gold) 45%, transparent);
	}
	.poster {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.poster--empty {
		background: var(--color-surface-2);
	}
	.ribbon {
		position: absolute;
		top: 0.6rem;
		left: 0.6rem;
		z-index: 2;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		backdrop-filter: blur(8px);
	}
	.ribbon--gold {
		background: color-mix(in oklab, var(--color-gold) 20%, var(--color-bg));
		color: var(--color-gold);
		border: 1px solid color-mix(in oklab, var(--color-gold) 60%, transparent);
	}
	.ribbon--silver {
		background: color-mix(in oklab, var(--color-silver) 18%, var(--color-bg));
		color: var(--color-silver);
		border: 1px solid color-mix(in oklab, var(--color-silver) 60%, transparent);
	}
	.ribbon--bronze {
		background: color-mix(in oklab, var(--color-bronze) 18%, var(--color-bg));
		color: var(--color-bronze);
		border: 1px solid color-mix(in oklab, var(--color-bronze) 55%, transparent);
	}
	.ribbon--accent {
		background: color-mix(in oklab, var(--color-accent) 18%, var(--color-bg));
		color: var(--color-accent);
		border: 1px solid color-mix(in oklab, var(--color-accent) 55%, transparent);
	}
	.meta {
		position: absolute;
		inset: auto 0 0 0;
		padding: 1.75rem 0.85rem 0.7rem;
		background: linear-gradient(
			to top,
			var(--color-bg) 0%,
			color-mix(in oklch, var(--color-bg) 70%, transparent) 55%,
			transparent 100%
		);
	}
	.movie {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.05rem;
		line-height: 1.15;
		color: var(--color-text);
	}
	.year {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.15em;
		color: var(--color-muted);
		margin-top: 0.15rem;
	}
	.caption {
		margin-top: 0.25rem;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: var(--color-gold);
		min-height: 1.1rem;
	}
	.dots {
		display: flex;
		justify-content: center;
		gap: 0.35rem;
		margin-top: 0.75rem;
	}
	.dot {
		width: 1.25rem;
		height: 0.375rem;
		border-radius: 9999px;
		border: 1px solid var(--color-border);
		background: color-mix(in oklab, var(--color-muted) 25%, transparent);
		transition:
			width 250ms ease,
			background 250ms ease,
			border-color 250ms ease;
		padding: 0;
		cursor: pointer;
	}
	.dot-active {
		width: 2.25rem;
		background: var(--color-accent);
		border-color: var(--color-accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.track {
			scroll-behavior: auto;
		}
		.card,
		.dot {
			transition: none;
		}
		.card.is-centered {
			transform: none;
		}
	}
</style>
