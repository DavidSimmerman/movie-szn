<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	const { data } = $props();
	// svelte-ignore state_referenced_locally
	const { form, enhance, errors, message, submitting } = superForm(data.form);
</script>

<svelte:head>
	<title>login · movie-szn</title>
</svelte:head>

<main class="relative grid min-h-dvh place-items-center px-6">
	<div class="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
		<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
			<filter id="grain-login">
				<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain-login)" />
		</svg>
	</div>

	<form
		method="POST"
		use:enhance
		class="relative w-full max-w-sm rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8"
	>
		<p
			class="text-mono mb-1 text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase"
		>
			◦ staff only ◦
		</p>
		<h1 class="text-display mb-6 text-3xl italic">projection booth</h1>

		<label
			class="text-mono mb-2 block text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
			for="pw"
		>
			password
		</label>
		<input
			id="pw"
			name="password"
			type="password"
			autocomplete="current-password"
			bind:value={$form.password}
			class="text-mono w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 transition outline-none focus:border-[color:var(--color-accent)]"
		/>
		<input type="hidden" name="next" bind:value={$form.next} />

		{#if $errors.password}
			<p class="text-mono mt-2 text-xs text-[color:var(--color-danger)]">{$errors.password}</p>
		{/if}
		{#if $message}
			<p class="text-mono mt-2 text-xs text-[color:var(--color-danger)]">{$message}</p>
		{/if}

		<button
			type="submit"
			disabled={$submitting}
			class="text-mono mt-6 w-full rounded-md bg-[color:var(--color-accent)] px-4 py-3 text-sm font-medium tracking-wider text-[color:var(--color-bg)] uppercase transition hover:opacity-90 disabled:opacity-50"
		>
			{$submitting ? 'checking...' : 'enter'}
		</button>
	</form>
</main>
