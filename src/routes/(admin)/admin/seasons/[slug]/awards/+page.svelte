<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionResult } from '@sveltejs/kit';
	import ReviewPicker, { type PickerReview } from '$lib/components/ReviewPicker.svelte';
	import { AWARD_SUGGESTIONS } from '$lib/awardSuggestions';
	import { formatScore, toNumber } from '$lib/ratings';

	type Rank = 'first' | 'second' | 'third' | 'honorable';

	type Winner = {
		id: string;
		categoryId: string;
		reviewId: string;
		rank: Rank;
		note: string | null;
		sortOrder: number;
		movieSlug: string;
		title: string;
		year: number;
		posterUrl: string | null;
		combinedScore: string | null;
	};

	type Category = {
		id: string;
		seasonId: string;
		name: string;
		tagline: string | null;
		allowsMultiple: boolean;
		sortOrder: number;
		createdAt: Date;
		winners: Winner[];
	};

	let { data } = $props();

	let pickerKey = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);
	let editingId = $state<string | null>(null);

	const existingNames = $derived(new Set(data.categories.map((c) => c.name)));
	const seasonReviews = $derived<PickerReview[]>(data.seasonReviews);

	const PODIUM: { rank: Exclude<Rank, 'honorable'>; label: string; medal: string }[] = [
		{ rank: 'first', label: 'winner', medal: 'I' },
		{ rank: 'second', label: 'runner-up', medal: 'II' },
		{ rank: 'third', label: 'third place', medal: 'III' }
	];

	function findWinner(cat: Category, rank: Rank): Winner | null {
		return cat.winners.find((w) => w.rank === rank) ?? null;
	}

	function honorable(cat: Category): Winner[] {
		return cat.winners
			.filter((w) => w.rank === 'honorable')
			.sort((a, b) => a.sortOrder - b.sortOrder);
	}

	function excludeFor(cat: Category): string[] {
		return cat.winners.map((w) => w.reviewId);
	}

	async function postAction(action: string, fields: Record<string, string>) {
		const fd = new FormData();
		for (const [k, v] of Object.entries(fields)) fd.set(k, v);
		const res = await fetch(`?/${action}`, {
			method: 'POST',
			body: fd,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await res.text()) as ActionResult;
		if (result.type === 'success' || result.type === 'redirect') {
			errorMsg = null;
			await invalidateAll();
			return true;
		}
		if (result.type === 'failure') {
			const d = result.data as { error?: string } | undefined;
			errorMsg = d?.error ?? 'action failed';
			await applyAction(result);
			return false;
		}
		await applyAction(result);
		return false;
	}

	async function pickWinner(categoryId: string, rank: Rank, reviewId: string) {
		const action = rank === 'honorable' ? 'addHonorable' : 'setWinner';
		const ok = await postAction(action, { categoryId, reviewId, rank });
		if (ok) pickerKey = null;
	}

	type NoteStatus = 'idle' | 'saving' | 'saved' | 'error';
	let noteBuffer = $state<Record<string, string>>({});
	let noteStatus = $state<Record<string, NoteStatus>>({});
	const noteTimers = new Map<string, ReturnType<typeof setTimeout>>();
	const NOTE_DEBOUNCE_MS = 500;

	function noteValue(id: string, initial: string | null) {
		return noteBuffer[id] ?? initial ?? '';
	}

	function onNoteInput(id: string, value: string) {
		noteBuffer[id] = value;
		noteStatus[id] = 'idle';
		const existing = noteTimers.get(id);
		if (existing) clearTimeout(existing);
		noteTimers.set(
			id,
			setTimeout(() => void saveNote(id), NOTE_DEBOUNCE_MS)
		);
	}

	async function saveNote(id: string) {
		const note = noteBuffer[id] ?? '';
		noteStatus[id] = 'saving';
		try {
			const fd = new FormData();
			fd.set('id', id);
			fd.set('note', note);
			const res = await fetch('?/updateNote', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await res.text()) as ActionResult;
			if (result.type === 'success' || result.type === 'redirect') {
				noteStatus[id] = 'saved';
				errorMsg = null;
				await invalidateAll();
				setTimeout(() => {
					if (noteStatus[id] === 'saved') noteStatus[id] = 'idle';
				}, 1500);
			} else if (result.type === 'failure') {
				noteStatus[id] = 'error';
				const d = result.data as { error?: string } | undefined;
				errorMsg = d?.error ?? 'failed to save note';
			} else {
				noteStatus[id] = 'error';
			}
		} catch {
			noteStatus[id] = 'error';
		}
	}

	async function addSuggestion(name: string, tagline?: string, multi = false) {
		if (existingNames.has(name)) return;
		await postAction('createCategory', {
			name,
			tagline: tagline ?? '',
			allowsMultiple: multi ? 'true' : 'false'
		});
	}
</script>

<svelte:head><title>{data.season.name} · awards · admin</title></svelte:head>

<div class="mb-8 flex items-end justify-between gap-4">
	<div>
		<a
			href="/admin/seasons/{data.season.slug}"
			class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase hover:text-[color:var(--color-text)]"
		>
			← {data.season.name}
		</a>
		<h1 class="text-display mt-1 text-4xl italic">awards</h1>
		<p class="text-mono mt-1 text-xs text-[color:var(--color-muted)]">
			{data.categories.length} categories · {seasonReviews.length} eligible reviews
		</p>
	</div>
	<a
		href="/seasons/{data.season.slug}/awards"
		class="text-mono text-xs tracking-wider text-[color:var(--color-accent)] uppercase hover:text-[color:var(--color-text)]"
	>
		view public →
	</a>
</div>

{#if errorMsg}
	<p
		class="text-mono mb-4 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 px-3 py-2 text-xs text-[color:var(--color-danger)]"
	>
		{errorMsg}
	</p>
{/if}

<section class="mb-6 flex flex-wrap items-start gap-3">
	<details class="awards-drawer min-w-[18rem] flex-1">
		<summary
			class="text-mono cursor-pointer rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-xs tracking-wider text-[color:var(--color-muted)] uppercase transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
		>
			+ new category
		</summary>
		<form
			method="POST"
			action="?/createCategory"
			use:enhance
			class="mt-3 space-y-2 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
		>
			<input
				name="name"
				required
				maxlength="80"
				placeholder="name"
				class="text-mono w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)]"
			/>
			<input
				name="tagline"
				maxlength="140"
				placeholder="tagline (optional)"
				class="text-mono w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-xs outline-none focus:border-[color:var(--color-accent)]"
			/>
			<label
				class="text-mono flex items-center gap-2 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				<input type="checkbox" name="allowsMultiple" value="true" />
				multi-pick (flat list, no podium)
			</label>
			<button
				class="text-mono w-full rounded bg-[color:var(--color-accent)] px-3 py-2 text-xs tracking-wider text-[color:var(--color-bg)] uppercase"
			>
				+ add
			</button>
		</form>
	</details>

	<details class="awards-drawer min-w-[18rem] flex-1">
		<summary
			class="text-mono cursor-pointer rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-xs tracking-wider text-[color:var(--color-muted)] uppercase transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
		>
			quick-add suggestions
		</summary>
		<div
			class="mt-3 space-y-4 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
		>
			{#each AWARD_SUGGESTIONS as group (group.theme)}
				<div>
					<p
						class="text-mono mb-2 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
					>
						{group.theme}
					</p>
					<div class="flex flex-wrap gap-1.5">
						{#each group.items as item (item.name)}
							{@const already = existingNames.has(item.name)}
							<button
								type="button"
								disabled={already}
								title={item.tagline ?? ''}
								onclick={() => addSuggestion(item.name, item.tagline, item.multi)}
								class="suggestion-chip text-mono rounded-full border px-2.5 py-1 text-[0.65rem] tracking-wider uppercase transition"
								class:is-multi={item.multi}
								class:is-added={already}
							>
								{already ? '✓ ' : item.multi ? '⧉ ' : '+ '}{item.name}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</details>
</section>

<div class="space-y-6">
	{#if data.categories.length === 0}
		<p
			class="rounded-[var(--radius-card)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 text-center text-[color:var(--color-muted)]"
		>
			no categories yet. use "+ new category" above, or pick a suggestion.
		</p>
	{/if}

	{#each data.categories as cat (cat.id)}
		{@const hm = honorable(cat)}
		{@const excluded = excludeFor(cat)}
		<section
			class="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
		>
			<header class="mb-4 flex items-start justify-between gap-4">
				<div class="min-w-0 flex-1">
					{#if cat.allowsMultiple}
						<span
							class="text-mono mb-2 inline-block rounded-full border border-[color:var(--color-accent-2)]/40 bg-[color:var(--color-accent-2)]/10 px-2 py-0.5 text-[0.65rem] tracking-wider text-[color:var(--color-accent-2)] uppercase"
						>
							multi-pick
						</span>
					{/if}
					{#if editingId === cat.id}
						<form
							method="POST"
							action="?/updateCategory"
							use:enhance={() =>
								async ({ result, update }) => {
									if (result.type === 'success') editingId = null;
									await update();
								}}
							class="space-y-2"
						>
							<input type="hidden" name="id" value={cat.id} />
							<input
								name="name"
								value={cat.name}
								required
								maxlength="80"
								class="text-display w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-2xl italic outline-none focus:border-[color:var(--color-accent)]"
							/>
							<input
								name="tagline"
								value={cat.tagline ?? ''}
								maxlength="140"
								placeholder="tagline (optional)"
								class="text-mono w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-xs outline-none focus:border-[color:var(--color-accent)]"
							/>
							<div class="flex gap-2">
								<button
									type="submit"
									class="text-mono rounded border border-[color:var(--color-accent)] bg-[color:var(--color-accent)] px-3 py-1 text-xs tracking-wider text-[color:var(--color-bg)] uppercase"
								>
									save
								</button>
								<button
									type="button"
									onclick={() => (editingId = null)}
									class="text-mono rounded border border-[color:var(--color-border)] px-3 py-1 text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
								>
									cancel
								</button>
							</div>
						</form>
					{:else}
						<button
							type="button"
							onclick={() => (editingId = cat.id)}
							class="block text-left"
							title="edit"
						>
							<h2 class="text-display text-2xl italic hover:text-[color:var(--color-accent)]">
								{cat.name}
							</h2>
							{#if cat.tagline}
								<p
									class="text-mono mt-1 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
								>
									{cat.tagline}
								</p>
							{/if}
						</button>
					{/if}
				</div>
				<div class="flex shrink-0 items-start gap-1">
					<form method="POST" action="?/moveCategory" use:enhance class="flex gap-1">
						<input type="hidden" name="id" value={cat.id} />
						<button
							name="direction"
							value="up"
							aria-label="move category up"
							class="text-mono rounded border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
							>↑</button
						>
						<button
							name="direction"
							value="down"
							aria-label="move category down"
							class="text-mono rounded border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
							>↓</button
						>
					</form>
					<form
						method="POST"
						action="?/deleteCategory"
						use:enhance={() =>
							async ({ result, update }) => {
								await update();
								if (result.type !== 'success') return;
							}}
						onsubmit={(e) => {
							if (!confirm(`Delete "${cat.name}" and all its picks?`)) e.preventDefault();
						}}
					>
						<input type="hidden" name="id" value={cat.id} />
						<button
							class="text-mono ml-2 rounded border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
							>del</button
						>
					</form>
				</div>
			</header>

			{#if !cat.allowsMultiple}
				<div class="grid gap-3 md:grid-cols-3">
					{#each PODIUM as slot (slot.rank)}
						{@const w = findWinner(cat, slot.rank)}
						{@const key = `${cat.id}:${slot.rank}`}
						<div
							class="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3"
						>
							<div
								class="text-mono mb-2 flex items-center justify-between text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
							>
								<span>
									<span
										class:gold-rank={slot.rank === 'first'}
										class:silver-rank={slot.rank === 'second'}
										class:bronze-rank={slot.rank === 'third'}>{slot.medal}</span
									>
									· {slot.label}
								</span>
								{#if w}
									<form method="POST" action="?/clearWinner" use:enhance>
										<input type="hidden" name="categoryId" value={cat.id} />
										<input type="hidden" name="rank" value={slot.rank} />
										<button
											class="rounded border border-[color:var(--color-border)] px-1.5 py-0.5 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
											>clear</button
										>
									</form>
								{/if}
							</div>

							{#if w && pickerKey !== key}
								<div class="flex gap-3">
									{#if w.posterUrl}
										<img src={w.posterUrl} alt="" class="h-20 w-14 shrink-0 rounded object-cover" />
									{:else}
										<div class="h-20 w-14 shrink-0 rounded bg-[color:var(--color-surface-2)]"></div>
									{/if}
									<div class="min-w-0 flex-1">
										<p class="text-display truncate text-sm">{w.title}</p>
										<p
											class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)]"
										>
											{w.year}{#if w.combinedScore != null}
												· {formatScore(toNumber(w.combinedScore))}{/if}
										</p>
										<button
											type="button"
											onclick={() => (pickerKey = key)}
											class="text-mono mt-1 text-[0.65rem] tracking-wider text-[color:var(--color-accent)] uppercase hover:text-[color:var(--color-text)]"
											>swap</button
										>
									</div>
								</div>
								<div class="mt-2 flex items-center gap-2">
									<input
										value={noteValue(w.id, w.note)}
										oninput={(e) => onNoteInput(w.id, e.currentTarget.value)}
										maxlength="140"
										placeholder="note (optional)"
										class="text-mono min-w-0 flex-1 rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1 text-[0.7rem] outline-none focus:border-[color:var(--color-accent)]"
									/>
									<span
										class="text-mono w-12 shrink-0 text-right text-[0.6rem] tracking-wider uppercase"
										class:text-[color:var(--color-muted)]={noteStatus[w.id] === 'saving'}
										class:text-[color:var(--color-success)]={noteStatus[w.id] === 'saved'}
										class:text-[color:var(--color-danger)]={noteStatus[w.id] === 'error'}
									>
										{#if noteStatus[w.id] === 'saving'}saving…{:else if noteStatus[w.id] === 'saved'}saved{:else if noteStatus[w.id] === 'error'}err{/if}
									</span>
								</div>
							{:else if pickerKey === key}
								<ReviewPicker
									reviews={seasonReviews}
									excludeIds={excluded.filter((id) => id !== w?.reviewId)}
									autofocus
									onPick={(reviewId) => pickWinner(cat.id, slot.rank, reviewId)}
									onCancel={() => (pickerKey = null)}
								/>
							{:else}
								<button
									type="button"
									onclick={() => (pickerKey = key)}
									class="text-mono w-full rounded border border-dashed border-[color:var(--color-border)] px-3 py-4 text-xs tracking-wider text-[color:var(--color-muted)] uppercase hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
								>
									+ pick
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Honorable mentions (or flat picks for multi categories) -->
			<div class={cat.allowsMultiple ? '' : 'mt-5'}>
				<p
					class="text-mono mb-2 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
				>
					{cat.allowsMultiple ? 'picks' : 'honorable mentions'}
				</p>
				{#if hm.length > 0}
					<ul class="space-y-2">
						{#each hm as h (h.id)}
							<li
								class="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3"
							>
								<div class="flex items-center gap-3">
									{#if h.posterUrl}
										<img src={h.posterUrl} alt="" class="h-12 w-8 shrink-0 rounded object-cover" />
									{:else}
										<div class="h-12 w-8 shrink-0 rounded bg-[color:var(--color-surface-2)]"></div>
									{/if}
									<div class="min-w-0 flex-1">
										<p class="text-display truncate text-sm">{h.title}</p>
										<p
											class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)]"
										>
											{h.year}{#if h.combinedScore != null}
												· {formatScore(toNumber(h.combinedScore))}{/if}
										</p>
									</div>
									<form method="POST" action="?/moveHonorable" use:enhance class="flex gap-1">
										<input type="hidden" name="id" value={h.id} />
										<button
											name="direction"
											value="up"
											aria-label="move up"
											class="text-mono rounded border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
											>↑</button
										>
										<button
											name="direction"
											value="down"
											aria-label="move down"
											class="text-mono rounded border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
											>↓</button
										>
									</form>
									<form method="POST" action="?/removeWinner" use:enhance>
										<input type="hidden" name="id" value={h.id} />
										<button
											class="text-mono rounded border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
											aria-label="remove">✕</button
										>
									</form>
								</div>
								<div class="mt-2 flex items-center gap-2">
									<input
										value={noteValue(h.id, h.note)}
										oninput={(e) => onNoteInput(h.id, e.currentTarget.value)}
										maxlength="140"
										placeholder="note (optional)"
										class="text-mono min-w-0 flex-1 rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 text-xs outline-none focus:border-[color:var(--color-accent)]"
									/>
									<span
										class="text-mono w-14 shrink-0 text-right text-[0.65rem] tracking-wider uppercase"
										class:text-[color:var(--color-muted)]={noteStatus[h.id] === 'saving'}
										class:text-[color:var(--color-success)]={noteStatus[h.id] === 'saved'}
										class:text-[color:var(--color-danger)]={noteStatus[h.id] === 'error'}
									>
										{#if noteStatus[h.id] === 'saving'}saving…{:else if noteStatus[h.id] === 'saved'}saved{:else if noteStatus[h.id] === 'error'}err{/if}
									</span>
								</div>
							</li>
						{/each}
					</ul>
				{/if}

				{#if pickerKey === `${cat.id}:hm`}
					<div class="mt-2">
						<ReviewPicker
							reviews={seasonReviews}
							excludeIds={excluded}
							autofocus
							placeholder="add honorable mention…"
							onPick={(reviewId) => pickWinner(cat.id, 'honorable', reviewId)}
							onCancel={() => (pickerKey = null)}
						/>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => (pickerKey = `${cat.id}:hm`)}
						class="text-mono mt-2 rounded border border-dashed border-[color:var(--color-border)] px-3 py-2 text-xs tracking-wider text-[color:var(--color-muted)] uppercase hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
					>
						{cat.allowsMultiple ? '+ add pick' : '+ add honorable mention'}
					</button>
				{/if}
			</div>
		</section>
	{/each}
</div>

<style>
	.gold-rank {
		color: var(--color-gold);
	}
	.silver-rank {
		color: var(--color-silver);
	}
	.bronze-rank {
		color: var(--color-bronze);
	}
	.awards-drawer > summary {
		list-style: none;
	}
	.awards-drawer > summary::-webkit-details-marker {
		display: none;
	}
	.awards-drawer[open] > summary {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.suggestion-chip {
		border-color: var(--color-border);
		color: var(--color-muted);
	}
	.suggestion-chip.is-multi:not(.is-added) {
		border-color: color-mix(in oklab, var(--color-accent-2) 55%, transparent);
		background: color-mix(in oklab, var(--color-accent-2) 8%, transparent);
		color: var(--color-accent-2);
	}
	.suggestion-chip:not(.is-added):hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
	.suggestion-chip.is-added {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
