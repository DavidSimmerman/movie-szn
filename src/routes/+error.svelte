<script lang="ts">
	import { page } from '$app/state';
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import ProjectorTitle from '$lib/components/ProjectorTitle.svelte';

	const code = $derived(String(page.status));
	const message = $derived(page.error?.message ?? 'something broke');
</script>

<svelte:head><title>{code} · movie-szn</title></svelte:head>

<main class="relative grid min-h-dvh place-items-center overflow-hidden">
	<FilmGrain id="grain-error" />

	<div class="relative mx-auto max-w-xl px-6 text-center">
		<p class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
			◦ technical difficulties ◦
		</p>
		<p class="text-display mt-4 text-[clamp(6rem,22vw,16rem)] leading-none italic">
			<ProjectorTitle text={code} />
		</p>
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
