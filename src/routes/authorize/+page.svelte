<script lang="ts">
	import { enhance } from '$app/forms';
	import FilmGrain from '$lib/components/FilmGrain.svelte';

	const { data, form } = $props();
	let submitting = $state(false);

	// Anyone can register a client under any name, so the destination — not the
	// name — is what tells you whether this is really Claude asking.
	const unexpected = $derived(data.redirectOrigin !== data.expectedOrigin);

	const hidden = $derived([
		['client_id', data.params.clientId],
		['redirect_uri', data.params.redirectUri],
		['code_challenge', data.params.codeChallenge],
		['code_challenge_method', data.params.codeChallengeMethod],
		['state', data.params.state],
		['scope', data.params.scope],
		['resource', data.params.resource]
	] as const);
</script>

<svelte:head>
	<title>authorize · movie-szn</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="relative grid min-h-dvh place-items-center overflow-hidden px-6">
	<FilmGrain id="grain-authorize" />

	<form
		method="POST"
		action="{data.search}&/authorize"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="relative w-full max-w-sm rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8"
	>
		<p
			class="text-mono mb-1 text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
		>
			◦ connector ◦
		</p>
		<h1 class="text-display mb-4 text-3xl italic">grant access</h1>

		<p class="mb-4 text-sm text-[color:var(--color-muted)]">
			<span class="text-mono text-[color:var(--color-fg)]"
				>{data.clientName ?? 'An application'}</span
			>
			<span class="text-[0.7rem]">(unverified name)</span> wants read-only access to your review library
			— every rating, note, award and watchlist entry. It cannot change anything.
		</p>

		<p
			class="text-mono mb-6 rounded-md border px-3 py-2 text-xs break-all {unexpected
				? 'border-[color:var(--color-accent-2)] text-[color:var(--color-accent-2)]'
				: 'border-[color:var(--color-border)] text-[color:var(--color-muted)]'}"
		>
			<span class="tracking-wider uppercase">sends the key to</span><br />
			{data.redirectOrigin}
			{#if unexpected}
				<br /><br />This is not {data.expectedOrigin} — if you didn't start this from Claude, deny it.
			{/if}
		</p>

		{#each hidden as [name, value] (name)}
			<input type="hidden" {name} {value} />
		{/each}

		<label
			class="text-mono mb-2 block text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
			for="pw"
		>
			connector password
		</label>
		<input
			id="pw"
			name="password"
			type="password"
			autocomplete="current-password"
			required
			class="text-mono w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 transition outline-none focus:border-[color:var(--color-accent)]"
		/>

		{#if form?.error}
			<p class="text-mono mt-2 text-xs text-[color:var(--color-danger)]" role="alert">
				{form.error}
			</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="text-mono mt-6 w-full rounded-md bg-[color:var(--color-accent)] px-4 py-3 text-sm font-medium tracking-wider text-[color:var(--color-bg)] uppercase transition hover:opacity-90 disabled:opacity-50"
		>
			{submitting ? 'approving...' : 'approve'}
		</button>
		<button
			type="submit"
			formaction="?/deny"
			class="text-mono mt-3 w-full rounded-md border border-[color:var(--color-border)] px-4 py-3 text-sm tracking-wider text-[color:var(--color-muted)] uppercase transition hover:border-[color:var(--color-accent-2)] hover:text-[color:var(--color-fg)]"
		>
			deny
		</button>
	</form>
</main>
