<script lang="ts">
	import { page } from '$app/state';

	const code = $derived(page.status);
	const message = $derived(page.error?.message ?? 'something broke');
</script>

<svelte:head><title>{code} · movie-szn</title></svelte:head>

<main class="relative grid min-h-dvh place-items-center overflow-hidden">
	<div class="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
		<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
			<filter id="grain-err">
				<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain-err)" />
		</svg>
	</div>

	<div class="relative mx-auto max-w-xl px-6 text-center">
		<p class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
			◦ technical difficulties ◦
		</p>
		<p class="text-display mt-4 text-[clamp(6rem,22vw,16rem)] leading-none italic">{code}</p>
		<p class="mt-2 text-xl text-[color:var(--color-muted)]">{message}</p>
		<p class="text-mono mt-8 text-sm text-[color:var(--color-muted)]">
			the projector will be back in a moment.
		</p>
		<div class="mt-10">
			<a
				href="/"
				class="text-mono rounded-md border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-5 py-3 text-xs tracking-wider text-[color:var(--color-accent)] uppercase transition hover:bg-[color:var(--color-accent)]/20"
			>
				back to the lobby
			</a>
		</div>
	</div>
</main>
