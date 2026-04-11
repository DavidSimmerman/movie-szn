<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
	let newMovieId = $state('');
	let newNotes = $state('');
</script>

<svelte:head><title>watchlist · admin</title></svelte:head>

<h1 class="text-display mb-8 text-4xl italic">the watchlist</h1>

<section
	class="mb-10 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
>
	<p class="text-mono mb-3 text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
		add a movie
	</p>
	<form method="POST" action="?/add" use:enhance class="flex flex-wrap items-end gap-3">
		<select
			name="movieId"
			bind:value={newMovieId}
			class="text-mono rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
		>
			<option value="">— pick a movie —</option>
			{#each data.candidates as m (m.id)}
				<option value={m.id}>{m.title} ({m.year})</option>
			{/each}
		</select>
		<input
			name="notes"
			bind:value={newNotes}
			placeholder="note (optional)"
			class="text-mono rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
		/>
		<button
			type="submit"
			disabled={!newMovieId}
			class="text-mono rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-xs tracking-wider text-[color:var(--color-bg)] uppercase disabled:opacity-40"
		>
			+ add
		</button>
	</form>
</section>

{#if data.items.length === 0}
	<p class="text-[color:var(--color-muted)]">empty. import a movie, then add it here.</p>
{:else}
	<ol class="space-y-2">
		{#each data.items as item, i (item.id)}
			<li
				class="flex items-center gap-4 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
			>
				<span class="text-display text-3xl text-[color:var(--color-muted)]">
					{(i + 1).toString().padStart(2, '0')}
				</span>
				{#if item.posterUrl}
					<img src={item.posterUrl} alt="" class="h-16 w-11 rounded object-cover" />
				{/if}
				<div class="flex-1">
					<p class="text-display text-lg">{item.title}</p>
					<p class="text-mono text-xs text-[color:var(--color-muted)]">
						{item.year}{#if item.notes}
							· {item.notes}{/if}
					</p>
				</div>
				<form method="POST" action="?/move" use:enhance class="flex gap-1">
					<input type="hidden" name="id" value={item.id} />
					<button
						name="direction"
						value="up"
						aria-label="move up"
						class="text-mono rounded border border-[color:var(--color-border)] px-2 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
					>
						↑
					</button>
					<button
						name="direction"
						value="down"
						aria-label="move down"
						class="text-mono rounded border border-[color:var(--color-border)] px-2 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
					>
						↓
					</button>
				</form>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={item.id} />
					<button
						class="text-mono rounded border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
					>
						remove
					</button>
				</form>
			</li>
		{/each}
	</ol>
{/if}
