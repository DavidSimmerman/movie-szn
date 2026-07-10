<script lang="ts">
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { enhance } from '$app/forms';
	import FilmGrain from '$lib/components/FilmGrain.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import TmdbSearch, { type TmdbResult } from '$lib/components/TmdbSearch.svelte';

	const NAME_STORAGE_KEY = 'movie-szn:submitterName';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	const {
		form,
		enhance: seEnhance,
		errors,
		message,
		submitting
	} = superForm(data.form, {
		resetForm: false,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				picked = null;
				searchQuery = '';
				$form.title = '';
				$form.year = '' as never;
				$form.tmdbId = '' as never;
				$form.tmdbType = '' as never;
				$form.notes = '';
			}
		}
	});

	let picked = $state<TmdbResult | null>(null);
	let pickedKey = $derived(picked ? `${picked.id}-${picked.type}` : null);
	let searchQuery = $state('');
	let hydrated = $state(false);

	onMount(() => {
		const saved = localStorage.getItem(NAME_STORAGE_KEY);
		if (saved && !$form.submitterName) $form.submitterName = saved;
		hydrated = true;
	});

	$effect(() => {
		if (!hydrated) return;
		const name = $form.submitterName?.trim() ?? '';
		if (name) localStorage.setItem(NAME_STORAGE_KEY, name);
		else localStorage.removeItem(NAME_STORAGE_KEY);
	});

	function handlePick(r: TmdbResult) {
		picked = r;
		$form.title = r.title;
		$form.year = (r.year ?? '') as never;
		$form.tmdbId = r.id as never;
		$form.tmdbType = r.type as never;
		searchQuery = '';
	}

	function clearPick() {
		picked = null;
		$form.title = '';
		$form.year = '' as never;
		$form.tmdbId = '' as never;
		$form.tmdbType = '' as never;
	}
</script>

<svelte:head>
	<title>suggest · movie-szn</title>
</svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<FilmGrain id="grain-suggest" />

	<SiteHeader />

	<div class="relative mx-auto max-w-[64rem] px-6 pt-10 pb-12">
		<div class="mb-12">
			<p
				class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
			>
				◦ the lobby ◦
			</p>
			<h1 class="text-display mt-2 text-6xl italic">suggestions</h1>
			<p class="mt-4 max-w-xl text-[color:var(--color-muted)]">
				drop a movie dave should watch next. upvote the ones you want most.
			</p>
		</div>

		<section
			class="mb-12 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
		>
			<form method="POST" action="?/submit" use:seEnhance class="grid gap-5">
				<input type="hidden" name="title" bind:value={$form.title} />
				<input type="hidden" name="year" bind:value={$form.year} />
				<input type="hidden" name="tmdbId" bind:value={$form.tmdbId} />
				<input type="hidden" name="tmdbType" bind:value={$form.tmdbType} />

				<div>
					<p
						class="text-mono mb-3 block text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
					>
						pick a movie <span class="text-[color:var(--color-accent-2)]">*</span>
					</p>
					{#if picked}
						<div
							class="text-mono flex items-center justify-between rounded-md border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/5 px-3 py-2 text-xs"
						>
							<span class="text-[color:var(--color-accent)]">
								picked: <span class="text-display text-sm not-italic">{picked.title}</span>
								{#if picked.year}({picked.year}){/if}
							</span>
							<button
								type="button"
								onclick={clearPick}
								class="tracking-wider text-[color:var(--color-muted)] uppercase hover:text-[color:var(--color-text)]"
							>
								change
							</button>
						</div>
					{:else}
						<TmdbSearch bind:query={searchQuery} onSelect={handlePick} selectedKey={pickedKey} />
					{/if}
					{#if $errors.title}
						<p class="text-mono mt-2 text-xs text-[color:var(--color-danger)]">
							{$errors.title}
						</p>
					{/if}
					{#if $errors.tmdbId}
						<p class="text-mono mt-2 text-xs text-[color:var(--color-danger)]">
							{$errors.tmdbId}
						</p>
					{/if}
				</div>

				<label class="block">
					<span
						class="text-mono mb-2 block text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
					>
						your name <span class="text-[color:var(--color-muted)]">(optional)</span>
					</span>
					<input
						name="submitterName"
						bind:value={$form.submitterName}
						placeholder="dave"
						class="text-mono w-full max-w-xs rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
					/>
				</label>

				<label class="block">
					<span
						class="text-mono mb-2 block text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
					>
						notes <span class="text-[color:var(--color-muted)]">(optional — pitch it to dave)</span>
					</span>
					<textarea
						name="notes"
						bind:value={$form.notes}
						rows="3"
						maxlength="1000"
						placeholder="why should dave watch this movie?"
						class="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
					></textarea>
				</label>

				<div>
					<button
						type="submit"
						disabled={$submitting || !picked}
						class="text-mono rounded-md bg-[color:var(--color-accent)] px-5 py-3 text-sm tracking-wider text-[color:var(--color-bg)] uppercase transition hover:opacity-90 disabled:opacity-50"
					>
						{$submitting ? 'submitting...' : 'drop it in'}
					</button>
					{#if $message}
						<span
							class="text-mono ml-4 text-xs tracking-wider text-[color:var(--color-accent)] uppercase"
						>
							{$message}
						</span>
					{/if}
				</div>
			</form>
		</section>

		<section>
			<p
				class="text-mono mb-6 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
			>
				◦ suggestions ◦
			</p>

			{#if data.suggestions.length === 0}
				<p class="text-[color:var(--color-muted)]">nothing suggested yet. be the first.</p>
			{:else}
				<ul class="divide-y divide-[color:var(--color-border)]">
					{#each data.suggestions as s (s.id)}
						{@const hasVoted = data.voted.has(s.id)}
						<li class="flex items-center gap-4 py-4">
							<form method="POST" action="?/{hasVoted ? 'unvote' : 'vote'}" use:enhance>
								<input type="hidden" name="suggestionId" value={s.id} />
								<button
									type="submit"
									aria-label={hasVoted ? 'remove vote' : 'upvote'}
									class="text-mono flex w-14 flex-col items-center rounded-md border px-2 py-2 tabular-nums transition"
									class:voted={hasVoted}
									class:border-[color:var(--color-border)]={!hasVoted}
									class:text-[color:var(--color-muted)]={!hasVoted}
								>
									<span class="text-base leading-none">▲</span>
									<span class="text-sm leading-tight">{s.voteCount}</span>
								</button>
							</form>
							<div class="flex-1">
								<p class="text-display text-xl leading-tight">
									{s.title}{#if s.year}
										<span class="text-mono ml-2 text-sm text-[color:var(--color-muted)]"
											>({s.year})</span
										>
									{/if}
								</p>
								{#if s.status === 'watching' || s.imdbUrl}
									<p
										class="text-mono mt-1 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
									>
										{#if s.status === 'watching'}<span class="text-[color:var(--color-accent)]"
												>dave is watching this</span
											>{/if}
										{#if s.status === 'watching' && s.imdbUrl}
											·
										{/if}
										{#if s.imdbUrl}
											<a
												href={s.imdbUrl}
												target="_blank"
												rel="noopener"
												class="hover:text-[color:var(--color-text)]">imdb ↗</a
											>
										{/if}
									</p>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</main>

<style>
	.voted {
		border-color: var(--color-accent);
		background: color-mix(in oklab, var(--color-accent) 12%, transparent);
		color: var(--color-accent);
	}
</style>
