<script lang="ts">
	import { page } from '$app/state';
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import StarRow from '$lib/components/StarRow.svelte';
	import { profileHref } from '$lib/profile';

	let { data } = $props();
	const owner = $derived(page.data.owner);
</script>

<svelte:head>
	<title>reviewers · movie-szn</title>
</svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<FilmGrain id="grain-reviewers" />

	<SiteHeader />

	<div class="relative mx-auto max-w-[72rem] px-6 pt-10 pb-12">
		<div>
			<p
				class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
			>
				◦ the masthead ◦
			</p>
			<h1 class="text-display mt-2 text-6xl italic">the critics</h1>
		</div>

		{#if data.reviewers.length === 0}
			<p class="mt-12 text-[color:var(--color-muted)]">no reviewers yet.</p>
		{:else}
			<div class="mt-12 flex flex-wrap justify-center gap-6">
				{#each data.reviewers as r (r.id)}
					<div
						class="w-full max-w-md rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
					>
						<a
							href={profileHref('/reviews', r.username, owner?.username ?? r.username)}
							class="group flex items-center gap-4"
						>
							{#if r.avatarUrl}
								<img
									src={r.avatarUrl}
									alt=""
									class="h-16 w-16 shrink-0 rounded-full object-cover"
								/>
							{:else}
								<span
									class="text-display grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-2xl uppercase"
								>
									{r.name.charAt(0)}
								</span>
							{/if}
							<div class="min-w-0">
								<p
									class="text-display truncate text-xl transition group-hover:text-[color:var(--color-accent)] sm:text-2xl"
								>
									{r.name}
								</p>
								<p class="text-mono text-xs text-[color:var(--color-muted)]">@{r.username}</p>
							</div>
						</a>

						{#if r.bio}
							<p class="mt-4 text-sm text-[color:var(--color-muted)]">{r.bio}</p>
						{/if}

						{#if r.traits.length}
							<div class="mt-6">
								<p
									class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
								>
									tendencies
								</p>
								<div class="mt-3 flex flex-col gap-2">
									{#each r.traits as t, i (i)}
										<div class="flex items-center justify-between gap-3">
											<span
												class="text-mono text-xs tracking-wider text-[color:var(--color-text)] uppercase"
											>
												{t.label}
											</span>
											<span class="flex items-center gap-2">
												<StarRow value={t.stars} />
												<span class="text-mono text-xs text-[color:var(--color-muted)]"
													>{t.stars}/5</span
												>
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</main>
