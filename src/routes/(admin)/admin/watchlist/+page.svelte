<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionResult } from '@sveltejs/kit';
	import TmdbSearch, { type TmdbResult } from '$lib/components/TmdbSearch.svelte';

	type Item = {
		id: string;
		movieId: string;
		position: number;
		notes: string | null;
		title: string;
		year: number;
		posterUrl: string | null;
	};

	let { data } = $props();
	let newMovieId = $state('');
	let newNotes = $state('');

	let searchQuery = $state('');
	let pendingKey = $state<string | null>(null);
	let addError = $state<string | null>(null);
	let addedNotice = $state<string | null>(null);
	let addedTimer: ReturnType<typeof setTimeout> | null = null;

	async function handlePick(r: TmdbResult) {
		if (pendingKey) return;
		const key = `${r.id}-${r.type}`;
		pendingKey = key;
		addError = null;

		try {
			const fd = new FormData();
			fd.set('tmdbId', String(r.id));
			fd.set('type', r.type);
			const res = await fetch('?/addFromTmdb', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await res.text()) as ActionResult;

			if (result.type === 'success') {
				await invalidateAll();
				searchQuery = '';
				addedNotice = `added: ${r.title}${r.year ? ` (${r.year})` : ''}`;
				if (addedTimer) clearTimeout(addedTimer);
				addedTimer = setTimeout(() => {
					addedNotice = null;
				}, 2500);
			} else if (result.type === 'failure') {
				const data = result.data as { error?: string } | undefined;
				addError = data?.error ?? 'add failed';
				await applyAction(result);
			} else {
				await applyAction(result);
			}
		} catch (err) {
			addError = err instanceof Error ? err.message : 'add failed';
		} finally {
			pendingKey = null;
		}
	}

	// svelte-ignore state_referenced_locally
	let items = $state<Item[]>(data.items);
	let draggingId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let reordering = $state(false);

	$effect(() => {
		if (!draggingId && !reordering) {
			items = data.items;
		}
	});

	function handleDragStart(e: DragEvent, id: string) {
		if (!e.dataTransfer) return;
		draggingId = id;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', id);
	}

	function handleDragOver(e: DragEvent, id: string) {
		if (!draggingId || draggingId === id) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dropTargetId = id;
	}

	function handleDragLeave(id: string) {
		if (dropTargetId === id) dropTargetId = null;
	}

	function handleDragEnd() {
		draggingId = null;
		dropTargetId = null;
	}

	async function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		const fromId = draggingId;
		handleDragEnd();
		if (!fromId || fromId === targetId) return;

		const fromIdx = items.findIndex((i) => i.id === fromId);
		const toIdx = items.findIndex((i) => i.id === targetId);
		if (fromIdx < 0 || toIdx < 0) return;

		const next = items.slice();
		const [moved] = next.splice(fromIdx, 1);
		next.splice(toIdx, 0, moved);
		items = next;
		reordering = true;

		try {
			const fd = new FormData();
			fd.set('ids', next.map((i) => i.id).join(','));
			const res = await fetch('?/reorder', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await res.text()) as ActionResult;
			if (result.type === 'success' || result.type === 'redirect') {
				await invalidateAll();
			} else {
				await applyAction(result);
				items = data.items;
			}
		} catch {
			items = data.items;
		} finally {
			reordering = false;
		}
	}
</script>

<svelte:head><title>watchlist · admin</title></svelte:head>

<h1 class="text-display mb-8 text-4xl italic">the watchlist</h1>

<section
	class="mb-6 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
>
	<p class="text-mono mb-3 text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
		search & add — click a result to add it instantly
	</p>
	<TmdbSearch bind:query={searchQuery} onSelect={handlePick} {pendingKey} />

	{#if addedNotice}
		<p
			class="text-mono mt-3 rounded-md border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/5 px-3 py-2 text-xs text-[color:var(--color-accent)]"
		>
			✓ {addedNotice}
		</p>
	{/if}
	{#if addError}
		<p
			class="text-mono mt-3 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 px-3 py-2 text-xs text-[color:var(--color-danger)]"
		>
			{addError}
		</p>
	{/if}
</section>

<details
	class="mb-10 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
>
	<summary
		class="text-mono cursor-pointer text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
	>
		or pick from already-imported movies
	</summary>
	<form method="POST" action="?/add" use:enhance class="mt-4 flex flex-wrap items-end gap-3">
		<select
			name="movieId"
			bind:value={newMovieId}
			class="text-mono max-w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
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
</details>

{#if items.length === 0}
	<p class="text-[color:var(--color-muted)]">empty. import a movie, then add it here.</p>
{:else}
	<p class="text-mono mb-3 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase">
		drag the ⋮⋮ handle to reorder · ↑↓ for keyboard
	</p>
	<ol class="space-y-2">
		{#each items as item, i (item.id)}
			<li
				draggable="true"
				ondragstart={(e) => handleDragStart(e, item.id)}
				ondragover={(e) => handleDragOver(e, item.id)}
				ondragleave={() => handleDragLeave(item.id)}
				ondrop={(e) => handleDrop(e, item.id)}
				ondragend={handleDragEnd}
				class="dnd-row flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
				class:is-dragging={draggingId === item.id}
				class:is-target={dropTargetId === item.id && draggingId !== item.id}
			>
				<span
					aria-hidden="true"
					class="text-mono cursor-grab leading-none text-[color:var(--color-muted)] select-none active:cursor-grabbing"
					title="drag to reorder"
				>
					⋮⋮
				</span>
				<span class="text-display text-3xl text-[color:var(--color-muted)]">
					{(i + 1).toString().padStart(2, '0')}
				</span>
				{#if item.posterUrl}
					<img src={item.posterUrl} alt="" class="h-16 w-11 rounded object-cover" />
				{/if}
				<div class="min-w-[10rem] flex-1">
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
						class="text-mono rounded border border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
					>
						↑
					</button>
					<button
						name="direction"
						value="down"
						aria-label="move down"
						class="text-mono rounded border border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
					>
						↓
					</button>
				</form>
				<form
					method="POST"
					action="?/remove"
					use:enhance
					onsubmit={(e) => {
						if (!confirm(`Remove "${item.title}" from the watchlist?`)) e.preventDefault();
					}}
				>
					<input type="hidden" name="id" value={item.id} />
					<button
						class="text-mono rounded border border-[color:var(--color-border)] px-2 py-2 text-xs text-[color:var(--color-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
					>
						remove
					</button>
				</form>
			</li>
		{/each}
	</ol>
{/if}

<style>
	.dnd-row {
		transition:
			border-color 120ms ease,
			background-color 120ms ease,
			opacity 120ms ease;
	}
	.dnd-row.is-dragging {
		opacity: 0.4;
	}
	.dnd-row.is-target {
		border-color: var(--color-accent);
		background: color-mix(in oklab, var(--color-accent) 8%, var(--color-surface));
	}
	@media (prefers-reduced-motion: reduce) {
		.dnd-row {
			transition: none;
		}
	}
</style>
