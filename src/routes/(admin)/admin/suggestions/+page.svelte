<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	type Status = 'all' | 'pending' | 'watching' | 'added' | 'declined';
	let statusFilter = $state<Status>('all');

	const filtered = $derived(
		statusFilter === 'all'
			? data.suggestions
			: data.suggestions.filter((s) => s.status === statusFilter)
	);

	const counts = $derived({
		all: data.suggestions.length,
		pending: data.suggestions.filter((s) => s.status === 'pending').length,
		watching: data.suggestions.filter((s) => s.status === 'watching').length,
		added: data.suggestions.filter((s) => s.status === 'added').length,
		declined: data.suggestions.filter((s) => s.status === 'declined').length
	});
</script>

<svelte:head><title>suggestions · admin</title></svelte:head>

<div class="mb-6 flex items-end justify-between gap-4">
	<div>
		<h1 class="text-display text-4xl italic">suggestions</h1>
		<p class="text-mono mt-1 text-xs text-[color:var(--color-muted)]">
			{counts.all} total · {counts.pending} pending · {counts.watching} on deck
		</p>
	</div>
</div>

{#if data.suggestions.length === 0}
	<p class="text-[color:var(--color-muted)]">no suggestions yet.</p>
{:else}
	<div
		class="text-mono mb-4 flex flex-wrap gap-2 text-[0.65rem] tracking-wider uppercase"
		role="tablist"
		aria-label="filter by status"
	>
		{#each ['all', 'pending', 'watching', 'added', 'declined'] as const as st (st)}
			<button
				type="button"
				role="tab"
				aria-selected={statusFilter === st}
				onclick={() => (statusFilter = st)}
				class="rounded border px-3 py-1.5 transition"
				class:border-[color:var(--color-accent)]={statusFilter === st}
				class:text-[color:var(--color-accent)]={statusFilter === st}
				class:border-[color:var(--color-border)]={statusFilter !== st}
				class:text-[color:var(--color-muted)]={statusFilter !== st}
			>
				{st} · {counts[st]}
			</button>
		{/each}
	</div>

	{#if filtered.length === 0}
		<p class="text-mono text-xs text-[color:var(--color-muted)]">nothing in this bucket.</p>
	{:else}
		<ul class="divide-y divide-[color:var(--color-border)]">
			{#each filtered as s (s.id)}
				<li class="flex items-start gap-4 py-4">
					<div
						class="text-mono flex w-14 flex-col items-center rounded-md border border-[color:var(--color-border)] px-2 py-2 text-[color:var(--color-muted)] tabular-nums"
					>
						<span class="text-base leading-none">▲</span>
						<span class="text-sm leading-tight">{s.voteCount}</span>
					</div>
					<div class="flex-1">
						<p class="text-display text-xl">
							{s.title}{#if s.year}
								<span class="text-mono ml-2 text-sm text-[color:var(--color-muted)]"
									>({s.year})</span
								>
							{/if}
						</p>
						<p class="text-mono mt-1 text-xs text-[color:var(--color-muted)]">
							status: {s.status}
							{#if s.submitterName}
								· from {s.submitterName}{/if}
							{#if s.imdbUrl}
								· <a
									class="hover:text-[color:var(--color-text)]"
									href={s.imdbUrl}
									target="_blank"
									rel="noopener">imdb ↗</a
								>
							{/if}
						</p>
						{#if s.notes}
							<p class="mt-2 text-sm whitespace-pre-wrap text-[color:var(--color-text)]/80">
								{s.notes}
							</p>
						{/if}
						{#if s.upvoters.length > 0}
							<div class="mt-3 flex flex-wrap items-center gap-1.5">
								<span
									class="text-mono text-[0.6rem] tracking-[0.2em] text-[color:var(--color-muted)] uppercase"
								>
									upvoted by
								</span>
								{#each s.upvoters as u (u.name + u.at)}
									<span
										class="text-mono rounded border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/5 px-2 py-0.5 text-[0.7rem] text-[color:var(--color-accent)]"
									>
										▲ {u.name}
									</span>
								{/each}
							</div>
						{/if}
						<form
							method="POST"
							action="?/setStatus"
							use:enhance
							class="text-mono mt-3 flex flex-wrap gap-2"
						>
							<input type="hidden" name="id" value={s.id} />
							{#each ['pending', 'watching', 'added', 'declined'] as const as st (st)}
								<button
									name="status"
									value={st}
									class="rounded border px-2 py-1 text-[0.65rem] tracking-wider uppercase transition"
									class:border-[color:var(--color-accent)]={s.status === st}
									class:text-[color:var(--color-accent)]={s.status === st}
									class:border-[color:var(--color-border)]={s.status !== st}
									class:text-[color:var(--color-muted)]={s.status !== st}
								>
									{st}
								</button>
							{/each}
						</form>
					</div>
					<form
						method="POST"
						action="?/remove"
						use:enhance
						onsubmit={(e) => {
							if (
								!confirm(
									`Remove "${s.title}"? ${s.voteCount} vote${s.voteCount === 1 ? '' : 's'} will be lost.`
								)
							)
								e.preventDefault();
						}}
					>
						<input type="hidden" name="id" value={s.id} />
						<button
							class="text-mono rounded border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
						>
							remove
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
{/if}
