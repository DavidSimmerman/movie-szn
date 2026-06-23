<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const fmtDate = (d: string | Date) =>
		new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

	const inputClass =
		'text-mono w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]';
	const fileClass =
		'text-mono w-full text-xs text-[color:var(--color-muted)] file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-[color:var(--color-accent)] file:px-3 file:py-1.5 file:text-xs file:tracking-wider file:text-[color:var(--color-bg)] file:uppercase';
	const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
</script>

<svelte:head><title>users · admin</title></svelte:head>

<h1 class="text-display mb-8 text-5xl italic">reviewers</h1>

{#snippet avatar(name: string, url: string | null | undefined, size: string)}
	{#if url}
		<img src={url} alt="" class="{size} shrink-0 rounded-full object-cover" />
	{:else}
		<span
			class="{size} text-mono grid shrink-0 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-sm uppercase"
		>
			{name.charAt(0)}
		</span>
	{/if}
{/snippet}

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
			enctype="multipart/form-data"
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
					class="{inputClass} mt-2"
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
					class="{inputClass} mt-2"
				/>
				<span class="text-mono mt-1 block text-[0.6rem] text-[color:var(--color-muted)]">
					used in their links: /user/&lt;username&gt;/reviews
				</span>
			</label>
			<div class="block">
				<span class="text-mono text-xs tracking-wider text-[color:var(--color-muted)] uppercase">
					avatar <span class="lowercase opacity-60">(optional)</span>
				</span>
				<input name="avatarFile" type="file" accept={ACCEPT} class="{fileClass} mt-2" />
				<input
					name="avatarUrl"
					type="url"
					placeholder="…or paste an image url"
					class="{inputClass} mt-2"
				/>
			</div>
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
					class="{inputClass} mt-2"
				/>
			</label>

			{#if form?.error}
				<p class="text-mono text-xs text-[color:var(--color-danger)]">{form.error}</p>
			{:else if form?.ok}
				<p class="text-mono text-xs text-[color:var(--color-accent)]">saved.</p>
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
					class="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4"
				>
					{@render avatar(u.name, u.avatarUrl, 'h-11 w-11')}
					<div class="min-w-0 flex-1">
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
						<form
							method="POST"
							action="?/setAvatar"
							enctype="multipart/form-data"
							use:enhance
							class="mt-2 flex flex-wrap items-center gap-2"
						>
							<input type="hidden" name="id" value={u.id} />
							<input
								name="avatarFile"
								type="file"
								accept={ACCEPT}
								class="text-mono min-w-0 flex-1 text-[0.65rem] text-[color:var(--color-muted)] file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-[color:var(--color-surface-2)] file:px-2 file:py-1 file:text-[0.6rem] file:tracking-wider file:text-[color:var(--color-text)] file:uppercase"
							/>
							<input
								name="avatarUrl"
								type="url"
								value={u.avatarUrl?.startsWith('/avatar/') ? '' : (u.avatarUrl ?? '')}
								placeholder="or url"
								class="text-mono min-w-0 flex-1 rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1 text-xs outline-none focus:border-[color:var(--color-accent)]"
							/>
							<button
								type="submit"
								class="text-mono shrink-0 rounded border border-[color:var(--color-border)] px-2 py-1 text-[0.65rem] tracking-[0.15em] text-[color:var(--color-muted)] uppercase transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
							>
								save
							</button>
						</form>
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
