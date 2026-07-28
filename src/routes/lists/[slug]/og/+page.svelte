<script lang="ts">
	import { formatPublicScore, scoreTier } from '$lib/ratings';

	let { data } = $props();

	const ACCENT = ['var(--color-gold)', 'var(--color-silver)', 'var(--color-bronze)'];
	const ORDER = [2, 1, 3];
	const bg = $derived(data.podium[0]?.posterUrl ?? null);
	const modeLabel = $derived(
		data.list.orderMode === 'rating' ? 'ranked by rating' : 'custom order'
	);
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="og">
	{#if bg}
		<img class="bg" src={bg} alt="" />
	{/if}
	<div class="veil"></div>
	<div class="grain"></div>

	<div class="top">
		<div class="wordmark">movie<span class="dash"></span>szn</div>
		<p class="kicker">◦ {data.authorName}'s list ◦</p>
	</div>

	<h1 class="title">{data.list.name}</h1>
	<p class="modeline">{modeLabel}</p>

	<div class="podium">
		{#each data.podium as m, i (i)}
			{@const tier = m.score == null ? null : scoreTier(m.score)}
			<div class="slot" style="order:{ORDER[i]}" class:first={i === 0}>
				<div class="poster" style="border-color:{ACCENT[i]}">
					{#if m.posterUrl}
						<img src={m.posterUrl} alt="" />
					{:else}
						<div class="noposter">no poster</div>
					{/if}
					<span class="crown" style="color:{ACCENT[i]}">#{i + 1}</span>
					{#if m.score != null}
						<span class="score" class:flex={tier === 'flex'}>{formatPublicScore(m.score)}</span>
					{/if}
				</div>
			</div>
		{/each}
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
		--text-outline:
			0 0 3px rgba(0, 0, 0, 0.95), 0 0 6px rgba(0, 0, 0, 0.75), 0 2px 9px rgba(0, 0, 0, 0.55);
	}
	.bg {
		position: absolute;
		inset: -60px;
		width: calc(100% + 120px);
		height: calc(100% + 120px);
		object-fit: cover;
		filter: saturate(1.05) blur(28px) brightness(0.65);
		transform: scale(1.1);
	}
	.veil {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				0deg,
				oklch(13% 0.02 280 / 0.97) 10%,
				oklch(13% 0.02 280 / 0.72) 45%,
				oklch(13% 0.02 280 / 0.55) 100%
			),
			radial-gradient(ellipse 70% 50% at 28% 30%, oklch(25% 0.05 65 / 0.35), transparent 70%);
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
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 600;
		font-size: 52px;
		letter-spacing: -0.03em;
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
		vertical-align: 0.3em;
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

	.title {
		position: absolute;
		inset: 128px 560px auto 64px;
		margin: 0;
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 600;
		font-size: 76px;
		line-height: 0.94;
		letter-spacing: -0.035em;
		text-shadow: var(--text-outline);
		display: -webkit-box;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.modeline {
		position: absolute;
		inset: auto auto 64px 64px;
		margin: 0;
		font-family: var(--font-mono);
		font-size: 20px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-muted);
		text-shadow: var(--text-outline);
	}

	.podium {
		position: absolute;
		inset: auto 56px 52px auto;
		display: flex;
		align-items: flex-end;
		gap: 22px;
	}
	.slot {
		display: flex;
		flex-direction: column;
	}
	.slot.first {
		transform: translateY(-26px);
	}
	.poster {
		position: relative;
		width: 154px;
		height: 231px;
		border-radius: 12px;
		border: 3px solid;
		overflow: hidden;
		background: var(--color-surface);
		box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.85);
	}
	.slot.first .poster {
		width: 184px;
		height: 276px;
	}
	.poster img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.noposter {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-family: var(--font-mono);
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-muted);
	}
	.crown {
		position: absolute;
		top: 6px;
		left: 10px;
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 40px;
		line-height: 1;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
	}
	.score {
		position: absolute;
		top: 8px;
		right: 8px;
		font-family: var(--font-mono);
		font-size: 18px;
		font-weight: 500;
		color: var(--color-text);
		background: oklch(13% 0.02 280 / 0.85);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 2px 10px;
		backdrop-filter: blur(6px);
	}
	.score.flex {
		color: var(--color-gold);
		border-color: var(--color-gold);
		text-shadow: 0 0 14px color-mix(in oklab, var(--color-gold) 60%, transparent);
	}
</style>
