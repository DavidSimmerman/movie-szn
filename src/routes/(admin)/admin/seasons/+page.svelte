<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	// svelte-ignore state_referenced_locally
	let year = $state(data.nextYear);
</script>

<svelte:head><title>seasons · admin</title></svelte:head>

<h1 class="text-display mb-8 text-4xl italic">seasons</h1>

<section
	class="mb-10 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
>
	<p class="text-mono mb-3 text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
		create a season
	</p>
	<form method="POST" action="?/create" use:enhance class="flex flex-wrap items-end gap-3">
		<label class="block">
			<span
				class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				year
			</span>
			<input
				name="year"
				type="number"
				bind:value={year}
				class="text-mono mt-1 w-24 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
			/>
		</label>
		<label class="block flex-1">
			<span
				class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				name (optional)
			</span>
			<input
				name="name"
				placeholder="movie season {year}"
				class="text-mono mt-1 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
			/>
		</label>
		<button
			type="submit"
			class="text-mono rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-xs tracking-wider text-[color:var(--color-bg)] uppercase"
		>
			+ create
		</button>
	</form>
	<p class="text-mono mt-2 text-[0.65rem] text-[color:var(--color-muted)]">
		defaults to april 1 – august 31 of the selected year.
	</p>
	{#if form?.error}
		<p class="text-mono mt-3 text-xs text-[color:var(--color-danger)]">{form.error}</p>
	{/if}
</section>

{#if data.seasons.length === 0}
	<p class="text-[color:var(--color-muted)]">no seasons yet.</p>
{:else}
	<ul class="divide-y divide-[color:var(--color-border)]">
		{#each data.seasons as s (s.id)}
			<li class="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
				<div class="min-w-[12rem] flex-1">
					<p class="text-display text-xl">{s.name}</p>
					<p class="text-mono text-xs text-[color:var(--color-muted)]">
						{s.startsAt} → {s.endsAt} · /seasons/{s.slug}
					</p>
				</div>
				<a
					href="/admin/seasons/{s.slug}"
					class="text-mono rounded border border-[color:var(--color-border)] px-3 py-1 text-xs tracking-wider text-[color:var(--color-muted)] uppercase hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
				>
					tag movies
				</a>
				<a
					href="/admin/seasons/{s.slug}/awards"
					class="text-mono rounded border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 px-3 py-1 text-xs tracking-wider text-[color:var(--color-accent)] uppercase hover:bg-[color:var(--color-accent)]/20"
				>
					◦ awards ◦
				</a>
				<a
					href="/seasons/{s.slug}"
					class="text-mono rounded border border-[color:var(--color-border)] px-3 py-1 text-xs tracking-wider text-[color:var(--color-muted)] uppercase hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
				>
					view public →
				</a>
				<form
					method="POST"
					action="?/remove"
					use:enhance
					onsubmit={(e) => {
						if (
							!confirm(
								`Delete "${s.name}"? Any awards and tagged movies for this season will be lost.`
							)
						)
							e.preventDefault();
					}}
				>
					<input type="hidden" name="id" value={s.id} />
					<button
						class="text-mono rounded border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
					>
						delete
					</button>
				</form>
			</li>
		{/each}
	</ul>
{/if}
