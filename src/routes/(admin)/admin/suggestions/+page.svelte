<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
</script>

<svelte:head><title>suggestions · admin</title></svelte:head>

<h1 class="text-display mb-8 text-4xl italic">suggestions</h1>

{#if data.suggestions.length === 0}
	<p class="text-[color:var(--color-muted)]">no suggestions yet.</p>
{:else}
	<ul class="divide-y divide-[color:var(--color-border)]">
		{#each data.suggestions as s (s.id)}
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
							<span class="text-mono ml-2 text-sm text-[color:var(--color-muted)]">({s.year})</span>
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
				<form method="POST" action="?/remove" use:enhance>
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
