<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { enhance } from '$app/forms';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	const {
		form,
		enhance: seEnhance,
		errors,
		message,
		submitting
	} = superForm(data.form, {
		resetForm: true
	});
</script>

<svelte:head>
	<title>suggest · movie-szn</title>
</svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<div class="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
		<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
			<filter id="grain-suggest">
				<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain-suggest)" />
		</svg>
	</div>

	<div class="relative mx-auto max-w-[64rem] px-6 py-12">
		<header class="mb-10 flex items-center justify-between">
			<a href="/" class="text-display text-lg italic">
				movie<span class="text-[color:var(--color-accent)]">-</span>szn
			</a>
			<nav
				class="text-mono flex gap-6 text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				<a class="transition hover:text-[color:var(--color-text)]" href="/reviews">reviews</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/watchlist">watchlist</a>
				<a class="text-[color:var(--color-accent)]" href="/suggest">suggest</a>
			</nav>
		</header>

		<div class="mb-12">
			<p
				class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
			>
				◦ the lobby ◦
			</p>
			<h1 class="text-display mt-2 text-6xl italic">suggestions</h1>
			<p class="mt-4 max-w-xl text-[color:var(--color-muted)]">
				drop a movie dave should watch next. upvote the ones you want most. no signup — but one vote
				per visitor per title.
			</p>
		</div>

		<section
			class="mb-12 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
		>
			<form
				method="POST"
				action="?/submit"
				use:seEnhance
				class="grid gap-4 md:grid-cols-[2fr_auto_2fr]"
			>
				<label class="block">
					<span
						class="text-mono mb-2 block text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
					>
						title <span class="text-[color:var(--color-accent-2)]">*</span>
					</span>
					<input
						name="title"
						bind:value={$form.title}
						placeholder="e.g. 2001: a space odyssey"
						class="text-mono w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
						required
					/>
					{#if $errors.title}
						<p class="text-mono mt-1 text-xs text-[color:var(--color-danger)]">{$errors.title}</p>
					{/if}
				</label>
				<label class="block">
					<span
						class="text-mono mb-2 block text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
					>
						year
					</span>
					<input
						name="year"
						type="number"
						bind:value={$form.year}
						placeholder="1968"
						class="text-mono w-24 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
					/>
				</label>
				<label class="block">
					<span
						class="text-mono mb-2 block text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
					>
						your name <span class="text-[color:var(--color-muted)]">(optional)</span>
					</span>
					<input
						name="submitterName"
						bind:value={$form.submitterName}
						placeholder="anon cinephile"
						class="text-mono w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
					/>
				</label>
				<label class="block md:col-span-3">
					<span
						class="text-mono mb-2 block text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
					>
						imdb url <span class="text-[color:var(--color-muted)]"
							>(optional — helps dave find it)</span
						>
					</span>
					<input
						name="imdbUrl"
						type="url"
						bind:value={$form.imdbUrl}
						placeholder="https://www.imdb.com/title/tt0062622/"
						class="text-mono w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
					/>
				</label>
				<div class="md:col-span-3">
					<button
						type="submit"
						disabled={$submitting}
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
				◦ the queue ◦
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
								<p
									class="text-mono mt-1 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
								>
									{#if s.submitterName}from {s.submitterName} ·{/if}
									{#if s.status === 'watching'}<span class="text-[color:var(--color-accent)]"
											>dave is watching this</span
										> ·{/if}
									{#if s.imdbUrl}
										<a
											href={s.imdbUrl}
											target="_blank"
											rel="noopener"
											class="hover:text-[color:var(--color-text)]">imdb ↗</a
										>
									{/if}
								</p>
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
