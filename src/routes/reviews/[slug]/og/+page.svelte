<script lang="ts">
	import { formatPublicScore, isFlex } from '$lib/ratings';

	let { data } = $props();

	const flex = $derived(isFlex(data.score));
	const parts = $derived(formatPublicScore(data.score).split('.'));
	const bg = $derived(data.movie.backdropUrl ?? data.movie.posterUrl ?? null);
	const meta = $derived(
		`${data.movie.year} · ${data.movie.type}${data.movie.runtimeMinutes ? ` · ${data.movie.runtimeMinutes}m` : ''}`
	);
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="og" class:flex>
	{#if bg}
		<img class="bg" src={bg} alt="" />
	{/if}
	<div class="veil"></div>
	<div class="grain"></div>

	<div class="top">
		<div class="wordmark">movie<span class="dash"></span>szn</div>
		<p class="kicker">◦ {data.authorName}'s review ◦</p>
	</div>

	<div class="bottom">
		<div class="left">
			<h1 class="title">{data.movie.title}</h1>
			<p class="metaline">{meta}</p>
		</div>
		<div class="score">
			<span class="bignum"
				>{parts[0]}{#if parts[1]}<span class="dec">.{parts[1]}</span>{/if}</span
			>
			<span class="outof">/ 10</span>
		</div>
	</div>
</div>

<style>
	.og {
		position: fixed;
		top: 0;
		left: 0;
		width: 1200px;
		height: 630px;
		overflow: hidden;
		background: var(--color-bg);
		color: var(--color-text);
		font-family: var(--font-sans);
		/* keeps text legible on a bright/white/orange backdrop */
		--text-outline:
			0 0 3px rgba(0, 0, 0, 0.95), 0 0 6px rgba(0, 0, 0, 0.75), 0 2px 9px rgba(0, 0, 0, 0.55);
	}
	.bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: saturate(1.05);
	}
	.veil {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				0deg,
				oklch(13% 0.02 280 / 0.97) 8%,
				oklch(13% 0.02 280 / 0.55) 42%,
				oklch(13% 0.02 280 / 0.12) 72%
			),
			linear-gradient(180deg, oklch(13% 0.02 280 / 0.55) 0%, transparent 28%);
	}
	.grain {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.5;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
	}

	.top {
		position: absolute;
		inset: 44px 64px auto 64px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
	}
	.wordmark {
		display: inline-block;
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 600;
		font-size: 60px;
		letter-spacing: -0.03em;
		color: var(--color-text);
		text-shadow: var(--text-outline);
	}
	.dash {
		display: inline-block;
		width: 0.52em;
		height: 0.16em;
		margin: 0 0.03em;
		border-radius: 2px;
		background: var(--color-accent);
		transform: skewX(-12deg);
		/* sit at the optical middle of the lowercase letters */
		vertical-align: 0.3em;
		/* dark edge so the orange dash survives an orange backdrop */
		box-shadow: 0 0 3px rgba(0, 0, 0, 0.85);
	}
	.kicker {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 18px;
		letter-spacing: 0.36em;
		text-transform: uppercase;
		color: var(--color-accent);
		text-shadow: var(--text-outline);
	}

	.bottom {
		position: absolute;
		inset: auto 64px 56px 64px;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 40px;
	}
	.left {
		min-width: 0;
	}
	.title {
		margin: 0;
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 600;
		font-size: 86px;
		line-height: 0.9;
		letter-spacing: -0.035em;
		max-width: 680px;
		text-shadow: var(--text-outline);
	}
	.metaline {
		margin: 14px 0 0;
		font-family: var(--font-mono);
		font-size: 20px;
		color: var(--color-muted);
		text-shadow: var(--text-outline);
	}

	.score {
		flex-shrink: 0;
		display: flex;
		align-items: baseline;
		gap: 12px;
	}
	.bignum {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 600;
		font-size: 200px;
		line-height: 0.8;
		color: var(--color-text);
		text-shadow:
			var(--text-outline),
			0 0 40px oklch(78% 0.19 65 / 0.45);
	}
	.dec {
		font-size: 0.45em;
		vertical-align: super;
	}
	.outof {
		font-family: var(--font-mono);
		font-size: 34px;
		color: var(--color-muted);
		text-shadow: var(--text-outline);
	}

	/* 6/5 flex — gold, reserved for scores > 10 (matches HeroScore) */
	.flex .bignum {
		color: var(--color-gold);
		text-shadow:
			var(--text-outline),
			0 0 18px color-mix(in oklab, var(--color-gold) 55%, transparent),
			0 0 42px color-mix(in oklab, var(--color-gold) 30%, transparent);
	}
</style>
