<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const fmtDate = (d: string | Date) =>
		new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
</script>

<svelte:head><title>users · admin</title></svelte:head>

<h1 class="text-display mb-8 text-5xl italic">reviewers</h1>

<div class="grid gap-10 lg:grid-cols-[20rem_1fr]">
	<section>
		<p
			class="text-mono mb-4 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
		>
			◦ new account ◦
		</p>
		<form
			method="POST"
			action="?/create"
			use:enhance
			class="space-y-4 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
		>
			<label class="block">
				<span class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
					display name
				</span>
				<input
					name="name"
					type="text"
					required
					maxlength="40"
					placeholder="Rob"
					class="text-mono mt-2 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
				/>
			</label>
			<label class="block">
				<span class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
					username
				</span>
				<input
					name="username"
					type="text"
					required
					autocapitalize="none"
					pattern="[a-z0-9-]+"
					placeholder="rob"
					class="text-mono mt-2 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
				/>
				<span class="text-mono mt-1 block text-[0.6rem] text-[color:var(--color-muted)]">
					used in their links: /user/&lt;username&gt;/reviews
				</span>
			</label>
			<label class="block">
				<span class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
					password
				</span>
				<input
					name="password"
					type="password"
					required
					minlength="8"
					autocomplete="new-password"
					class="text-mono mt-2 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
				/>
			</label>

			{#if form?.error}
				<p class="text-mono text-xs text-[color:var(--color-danger)]">{form.error}</p>
			{:else if form?.ok}
				<p class="text-mono text-xs text-[color:var(--color-accent)]">account created.</p>
			{/if}

			<button
				type="submit"
				class="text-mono w-full rounded-md bg-[color:var(--color-accent)] px-4 py-3 text-sm tracking-wider text-[color:var(--color-bg)] uppercase transition hover:opacity-90"
			>
				create account
			</button>
		</form>
	</section>

	<section>
		<p
			class="text-mono mb-4 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
		>
			◦ {data.users.length}
			{data.users.length === 1 ? 'reviewer' : 'reviewers'} ◦
		</p>
		<ul class="space-y-2">
			{#each data.users as u (u.id)}
				<li
					class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4"
				>
					<div>
						<p class="text-display text-xl italic">
							{u.name}
							{#if u.isAdmin}
								<span
									class="text-mono ml-2 text-[0.6rem] tracking-[0.2em] text-[color:var(--color-accent)] uppercase"
								>
									owner
								</span>
							{/if}
						</p>
						<p class="text-mono text-xs text-[color:var(--color-muted)]">
							@{u.username} · joined {fmtDate(u.createdAt)}
						</p>
					</div>
					{#if !u.isAdmin}
						<form
							method="POST"
							action="?/remove"
							use:enhance
							onsubmit={(e) => {
								if (
									!confirm(
										`Delete ${u.name} and all their reviews, seasons, and watchlist? This cannot be undone.`
									)
								)
									e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={u.id} />
							<button
								type="submit"
								class="text-mono text-[0.65rem] tracking-[0.2em] text-[color:var(--color-muted)] uppercase transition hover:text-[color:var(--color-danger)]"
							>
								delete
							</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
</div>
