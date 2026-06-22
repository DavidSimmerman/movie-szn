<script lang="ts">
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import UserPicker from '$lib/components/UserPicker.svelte';

	let { data } = $props();

	const who = $derived(data.viewUser?.name ?? 'dave');
</script>

<svelte:head>
	<title>watchlist · movie-szn</title>
</svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<FilmGrain id="grain-watchlist" />

	<SiteHeader />

	<div class="relative mx-auto max-w-[56rem] px-6 pt-10 pb-12">
		<p class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
			◦ up next ◦
		</p>
		<h1 class="text-display mt-2 text-6xl italic">the watchlist</h1>
		<p class="mt-3 max-w-xl text-[color:var(--color-muted)]">
			what {who} is planning to watch, in order. no promises on timing.
		</p>

		<div class="mt-6">
			<UserPicker label="watchlist of" />
		</div>

		{#if data.items.length === 0}
			<p class="mt-12 text-[color:var(--color-muted)]">nothing queued up yet.</p>
		{:else}
			<ol class="mt-12 space-y-1">
				{#each data.items as item, index (item.id)}
					<li
						class="group relative flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-transparent p-4 transition hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-surface)] sm:gap-5"
					>
						<div
							class="text-display w-10 shrink-0 text-right text-4xl leading-none text-[color:var(--color-accent)] tabular-nums sm:w-12 sm:text-5xl"
						>
							{(index + 1).toString().padStart(2, '0')}
						</div>
						{#if item.posterUrl}
							<img src={item.posterUrl} alt="" class="h-24 w-16 shrink-0 rounded object-cover" />
						{:else}
							<div class="h-24 w-16 shrink-0 rounded bg-[color:var(--color-surface-2)]"></div>
						{/if}
						<div class="min-w-0 flex-1 basis-48">
							<p class="text-display text-xl sm:text-2xl">{item.title}</p>
							<p class="text-mono text-xs text-[color:var(--color-muted)]">
								{item.year} · {item.type}
							</p>
							{#if item.notes}
								<p class="mt-2 text-sm text-[color:var(--color-muted)]">{item.notes}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</main>
