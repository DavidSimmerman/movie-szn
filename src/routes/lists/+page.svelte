<script lang="ts">
	import { page } from '$app/state';
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import UserPicker from '$lib/components/UserPicker.svelte';
	import { profilePrefix } from '$lib/profile';

	let { data } = $props();
	const prefix = $derived(profilePrefix(page.url.pathname));
</script>

<svelte:head><title>lists · movie-szn</title></svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<FilmGrain id="grain-lists" />

	<SiteHeader />

	<div class="relative mx-auto max-w-[56rem] px-6 pt-10 pb-12">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p
					class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
				>
					◦ ranked & curated ◦
				</p>
				<h1 class="text-display mt-2 text-6xl italic">lists</h1>
			</div>
			<UserPicker label="lists by" />
		</div>
		<p class="mt-3 max-w-xl text-[color:var(--color-muted)]">
			rankings and collections — a nolan best-to-worst, a spider-man run, whatever's worth ordering.
		</p>

		{#if data.lists.length === 0}
			<p class="mt-12 text-[color:var(--color-muted)]">no lists yet.</p>
		{:else}
			<ul class="mt-12 grid gap-4 md:grid-cols-2">
				{#each data.lists as l (l.id)}
					<li>
						<a
							href="{prefix}/lists/{l.slug}"
							class="block h-full rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 transition hover:border-[color:var(--color-accent)]"
						>
							<p
								class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
							>
								{l.orderMode === 'rating' ? 'ranked by rating' : 'custom order'}
							</p>
							<p class="text-display mt-2 text-3xl italic">{l.name}</p>
							{#if l.description}
								<p class="mt-2 line-clamp-2 text-sm text-[color:var(--color-muted)]">
									{l.description}
								</p>
							{/if}
							<p class="text-mono mt-3 text-xs text-[color:var(--color-muted)]">
								{l.movieCount}
								{l.movieCount === 1 ? 'title' : 'titles'}
							</p>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</main>
