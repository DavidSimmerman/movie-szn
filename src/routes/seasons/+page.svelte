<script lang="ts">
	import { page } from '$app/state';
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import UserPicker from '$lib/components/UserPicker.svelte';
	import { profilePrefix } from '$lib/profile';

	let { data } = $props();
	const prefix = $derived(profilePrefix(page.url.pathname));
</script>

<svelte:head><title>seasons · movie-szn</title></svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<FilmGrain id="grain-seasons" />

	<SiteHeader />

	<div class="relative mx-auto max-w-[56rem] px-6 pt-10 pb-12">
		<p class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
			◦ by the year ◦
		</p>
		<h1 class="text-display mt-2 text-6xl italic">seasons</h1>
		<p class="mt-3 max-w-xl text-[color:var(--color-muted)]">
			every movie season, april through august. the core of the site.
		</p>

		<div class="mt-6">
			<UserPicker label="seasons by" />
		</div>

		{#if data.seasons.length === 0}
			<p class="mt-12 text-[color:var(--color-muted)]">no seasons yet.</p>
		{:else}
			<ul class="mt-12 grid gap-4 md:grid-cols-2">
				{#each data.seasons as s (s.id)}
					<li>
						<a
							href="{prefix}/seasons/{s.slug}"
							class="block rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 transition hover:border-[color:var(--color-accent)]"
						>
							<p
								class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
							>
								{s.startsAt} → {s.endsAt}
							</p>
							<p class="text-display mt-2 text-3xl italic">{s.name}</p>
							<p class="text-mono mt-3 text-xs text-[color:var(--color-muted)]">
								{s.movieCount}
								{s.movieCount === 1 ? 'movie' : 'movies'}
							</p>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</main>
