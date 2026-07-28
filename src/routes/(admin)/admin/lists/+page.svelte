<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let name = $state('');
	let description = $state('');
	let orderMode = $state<'manual' | 'rating'>('manual');
</script>

<svelte:head><title>lists · admin</title></svelte:head>

<h1 class="text-display mb-8 text-4xl italic">lists</h1>

<section
	class="mb-10 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
>
	<p class="text-mono mb-4 text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
		new list
	</p>
	<form
		method="POST"
		action="?/create"
		use:enhance={() =>
			async ({ update, result }) => {
				await update();
				if (result.type === 'success') {
					name = '';
					description = '';
					orderMode = 'manual';
				}
			}}
		class="flex flex-col gap-3"
	>
		<div class="flex flex-wrap gap-3">
			<input
				name="name"
				bind:value={name}
				required
				maxlength="120"
				placeholder="list name (e.g. Christopher Nolan, ranked)"
				class="text-mono min-w-[16rem] flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
			/>
			<select
				name="orderMode"
				bind:value={orderMode}
				class="text-mono rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
			>
				<option value="manual">order: manual (drag)</option>
				<option value="rating">order: by my rating</option>
			</select>
			<button
				type="submit"
				disabled={!name.trim()}
				class="text-mono rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-xs tracking-wider text-[color:var(--color-bg)] uppercase disabled:opacity-40"
			>
				+ create
			</button>
		</div>
		<input
			name="description"
			bind:value={description}
			maxlength="500"
			placeholder="description (optional)"
			class="text-mono rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
		/>
	</form>
	{#if form?.error}
		<p
			class="text-mono mt-3 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 px-3 py-2 text-xs text-[color:var(--color-danger)]"
		>
			{form.error}
		</p>
	{/if}
</section>

{#if data.lists.length === 0}
	<p class="text-[color:var(--color-muted)]">no lists yet. create one above.</p>
{:else}
	<ul class="space-y-2">
		{#each data.lists as l (l.id)}
			<li
				class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
			>
				<div class="min-w-[12rem] flex-1">
					<a
						href="/admin/lists/{l.slug}"
						class="text-display text-lg hover:text-[color:var(--color-accent)]"
					>
						{l.name}
					</a>
					<p class="text-mono text-xs text-[color:var(--color-muted)]">
						{l.orderMode === 'rating' ? 'by rating' : 'manual'} · {l.movieCount}
						{l.movieCount === 1 ? 'title' : 'titles'}
					</p>
				</div>
				<a
					href="/admin/lists/{l.slug}"
					class="text-mono rounded border border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
				>
					manage
				</a>
				<form
					method="POST"
					action="?/remove"
					use:enhance
					onsubmit={(e) => {
						if (!confirm(`Delete the list "${l.name}"?`)) e.preventDefault();
					}}
				>
					<input type="hidden" name="id" value={l.id} />
					<button
						class="text-mono rounded border border-[color:var(--color-border)] px-2 py-2 text-xs text-[color:var(--color-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
					>
						delete
					</button>
				</form>
			</li>
		{/each}
	</ul>
{/if}
