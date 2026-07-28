<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionResult } from '@sveltejs/kit';
	import { formatPublicScore } from '$lib/ratings';

	type Item = {
		movieId: string;
		title: string;
		year: number;
		posterUrl: string | null;
		score: number | null;
	};

	let { data, form } = $props();

	let newMovieId = $state('');
	const isManual = $derived(data.list.orderMode === 'manual');

	// svelte-ignore state_referenced_locally
	let items = $state<Item[]>(data.items);
	let draggingId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let reordering = $state(false);

	$effect(() => {
		if (!draggingId && !reordering) items = data.items;
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

		const fromIdx = items.findIndex((i) => i.movieId === fromId);
		const toIdx = items.findIndex((i) => i.movieId === targetId);
		if (fromIdx < 0 || toIdx < 0) return;

		const next = items.slice();
		const [moved] = next.splice(fromIdx, 1);
		next.splice(toIdx, 0, moved);
		items = next;
		reordering = true;

		try {
			const fd = new FormData();
			fd.set('ids', next.map((i) => i.movieId).join(','));
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

<svelte:head><title>{data.list.name} · lists · admin</title></svelte:head>

<a
	href="/admin/lists"
	class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase hover:text-[color:var(--color-accent)]"
>
	← all lists
</a>
<h1 class="text-display mt-3 mb-8 text-4xl italic">{data.list.name}</h1>

<section
	class="mb-8 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
>
	<p class="text-mono mb-4 text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
		list settings
	</p>
	<form method="POST" action="?/update" use:enhance class="flex flex-col gap-3">
		<div class="flex flex-wrap gap-3">
			<input
				name="name"
				value={data.list.name}
				required
				maxlength="120"
				class="text-mono min-w-[16rem] flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
			/>
			<select
				name="orderMode"
				value={data.list.orderMode}
				class="text-mono rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
			>
				<option value="manual">order: manual (drag)</option>
				<option value="rating">order: by my rating</option>
			</select>
			<button
				type="submit"
				class="text-mono rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-xs tracking-wider text-[color:var(--color-bg)] uppercase"
			>
				save
			</button>
		</div>
		<input
			name="description"
			value={data.list.description ?? ''}
			maxlength="500"
			placeholder="description (optional)"
			class="text-mono rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
		/>
	</form>
</section>

<section
	class="mb-8 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
>
	<p class="text-mono mb-3 text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
		add a reviewed movie
	</p>
	{#if data.candidates.length === 0}
		<p class="text-sm text-[color:var(--color-muted)]">
			every movie you've reviewed is already on this list.
		</p>
	{:else}
		<form method="POST" action="?/addMovie" use:enhance class="flex flex-wrap items-end gap-3">
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
			<button
				type="submit"
				disabled={!newMovieId}
				class="text-mono rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-xs tracking-wider text-[color:var(--color-bg)] uppercase disabled:opacity-40"
			>
				+ add
			</button>
		</form>
	{/if}
	{#if form?.error}
		<p
			class="text-mono mt-3 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 px-3 py-2 text-xs text-[color:var(--color-danger)]"
		>
			{form.error}
		</p>
	{/if}
</section>

{#if items.length === 0}
	<p class="text-[color:var(--color-muted)]">no titles yet. add one above.</p>
{:else}
	<p class="text-mono mb-3 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase">
		{#if isManual}
			drag the ⋮⋮ handle to reorder · ↑↓ for keyboard
		{:else}
			ordered automatically by your rating — switch to manual order to rearrange
		{/if}
	</p>
	<ol class="space-y-2">
		{#each items as item, i (item.movieId)}
			<li
				draggable={isManual}
				ondragstart={(e) => handleDragStart(e, item.movieId)}
				ondragover={(e) => handleDragOver(e, item.movieId)}
				ondragleave={() => handleDragLeave(item.movieId)}
				ondrop={(e) => handleDrop(e, item.movieId)}
				ondragend={handleDragEnd}
				class="dnd-row flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
				class:is-dragging={draggingId === item.movieId}
				class:is-target={dropTargetId === item.movieId && draggingId !== item.movieId}
			>
				{#if isManual}
					<span
						aria-hidden="true"
						class="text-mono cursor-grab leading-none text-[color:var(--color-muted)] select-none active:cursor-grabbing"
						title="drag to reorder"
					>
						⋮⋮
					</span>
				{/if}
				<span class="text-display text-3xl text-[color:var(--color-muted)]">
					{(i + 1).toString().padStart(2, '0')}
				</span>
				{#if item.posterUrl}
					<img src={item.posterUrl} alt="" class="h-16 w-11 rounded object-cover" />
				{/if}
				<div class="min-w-[10rem] flex-1">
					<p class="text-display text-lg">{item.title}</p>
					<p class="text-mono text-xs text-[color:var(--color-muted)]">
						{item.year}{#if item.score != null}
							· {formatPublicScore(item.score)}{/if}
					</p>
				</div>
				{#if isManual}
					<form method="POST" action="?/move" use:enhance class="flex gap-1">
						<input type="hidden" name="movieId" value={item.movieId} />
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
				{/if}
				<form
					method="POST"
					action="?/remove"
					use:enhance
					onsubmit={(e) => {
						if (!confirm(`Remove "${item.title}" from this list?`)) e.preventDefault();
					}}
				>
					<input type="hidden" name="movieId" value={item.movieId} />
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
