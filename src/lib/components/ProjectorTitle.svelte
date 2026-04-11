<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		text: string;
		accent?: string;
	};

	const { text, accent = '-' }: Props = $props();
	let hasAnimated = $state(false);

	onMount(() => {
		if (typeof window === 'undefined') return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce) {
			hasAnimated = true;
			return;
		}
		const flagKey = 'movieSzn:projector:played';
		if (sessionStorage.getItem(flagKey)) {
			hasAnimated = true;
			return;
		}
		sessionStorage.setItem(flagKey, '1');
		// trigger flicker by toggling the class
		requestAnimationFrame(() => {
			hasAnimated = false;
		});
	});

	const parts = $derived.by(() => {
		const idx = text.indexOf(accent);
		if (idx === -1) return { head: text, accent: '', tail: '' };
		return {
			head: text.slice(0, idx),
			accent,
			tail: text.slice(idx + accent.length)
		};
	});
</script>

<span class="projector" class:projector--played={hasAnimated}>
	{parts.head}<span class="text-[color:var(--color-accent)]">{parts.accent}</span>{parts.tail}
</span>

<style>
	.projector {
		display: inline-block;
		animation: projector-flicker 320ms ease-out both;
		will-change: opacity;
	}
	.projector--played {
		animation: none;
	}
	@keyframes projector-flicker {
		0% {
			opacity: 0;
		}
		10% {
			opacity: 0.3;
		}
		20% {
			opacity: 0.7;
		}
		30% {
			opacity: 0.45;
		}
		45% {
			opacity: 1;
		}
		55% {
			opacity: 0.65;
		}
		70% {
			opacity: 1;
		}
		80% {
			opacity: 0.85;
		}
		100% {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.projector {
			animation: none;
		}
	}
</style>
