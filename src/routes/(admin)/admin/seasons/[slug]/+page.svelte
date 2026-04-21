<script lang="ts">
	import { enhance } from '$app/forms';
	import { toNumber, formatScore } from '$lib/ratings';

	let { data } = $props();

	let filter = $state('');
	let onlyTagged = $state(false);

	const filtered = $derived(
		data.movies.filter((m) => {
			if (onlyTagged && !m.tagged) return false;
			if (!filter) return true;
			const q = filter.toLowerCase();
			return m.title.toLowerCase().includes(q) || String(m.year).includes(q);
		})
	);

	const taggedCount = $derived(data.movies.filter((m) => m.tagged).length);
</script>

<svelte:head><title>{data.season.name} · admin</title></svelte:head>

<div class="mb-8 flex items-end justify-between">
	<div>
		<a
			href="/admin/seasons"
			class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase hover:text-[color:var(--color-text)]"
		>
			← seasons
		</a>
		<h1 class="text-display mt-1 text-4xl italic">{data.season.name}</h1>
		<p class="text-mono mt-1 text-xs text-[color:var(--color-muted)]">
			{data.season.startsAt} → {data.season.endsAt} · {taggedCount} tagged
		</p>
	</div>
	<div class="flex gap-4">
		<a
			href="/admin/seasons/{data.season.slug}/awards"
			class="text-mono text-xs tracking-wider text-[color:var(--color-accent)] uppercase hover:text-[color:var(--color-text)]"
		>
			manage awards →
		</a>
		<a
			href="/seasons/{data.season.slug}"
			class="text-mono text-xs tracking-wider text-[color:var(--color-accent)] uppercase hover:text-[color:var(--color-text)]"
		>
			view public →
		</a>
	</div>
</div>

<div class="mb-6 flex flex-wrap items-center gap-3">
	<input
		type="search"
		bind:value={filter}
		placeholder="filter movies…"
		class="text-mono flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)]"
	/>
	<label class="text-mono flex items-center gap-2 text-xs tracking-wider uppercase">
		<input type="checkbox" bind:checked={onlyTagged} />
		only tagged
	</label>
</div>

{#if data.movies.length === 0}
	<p class="text-[color:var(--color-muted)]">no reviewed movies yet — write a review first.</p>
{:else if filtered.length === 0}
	<p class="text-[color:var(--color-muted)]">nothing matches that filter.</p>
{:else}
	<ul class="divide-y divide-[color:var(--color-border)]">
		{#each filtered as m (m.id)}
			{@const score = toNumber(m.combinedScore)}
			<li class="flex items-center justify-between gap-4 py-3">
				<div class="min-w-0 flex-1">
					<p class="text-display truncate text-lg">{m.title}</p>
					<p class="text-mono text-xs text-[color:var(--color-muted)]">
						{m.year} · {formatScore(score)}
					</p>
				</div>
				<form method="POST" action="?/toggle" use:enhance>
					<input type="hidden" name="movieId" value={m.id} />
					<input type="hidden" name="tagged" value={String(m.tagged)} />
					<button
						type="submit"
						class="text-mono rounded-md border px-3 py-1.5 text-xs tracking-wider uppercase transition"
						class:border-[color:var(--color-accent)]={m.tagged}
						class:bg-[color:var(--color-accent)]={m.tagged}
						class:text-[color:var(--color-bg)]={m.tagged}
						class:border-[color:var(--color-border)]={!m.tagged}
						class:text-[color:var(--color-muted)]={!m.tagged}
						class:hover:border-[color:var(--color-accent)]={!m.tagged}
						class:hover:text-[color:var(--color-accent)]={!m.tagged}
					>
						{m.tagged ? '✓ tagged' : '+ tag'}
					</button>
				</form>
			</li>
		{/each}
	</ul>
{/if}
