<script lang="ts">
	import { page } from '$app/state';
	import { profileHref, stripProfilePrefix } from '$lib/profile';

	type U = { id: string; username: string; name: string; avatarUrl?: string | null };
	type Props = { users?: U[]; label?: string; variant?: 'stacked' | 'inline' };

	const props: Props = $props();
	const variant = $derived(props.variant ?? 'stacked');
	const all = $derived(props.users ?? (page.data.users as U[]) ?? []);
	const owner = $derived(page.data.owner as U | undefined);
	const viewUser = $derived(page.data.viewUser as U | null);
	const current = $derived(all.find((u) => u.id === viewUser?.id) ?? all[0]);
	const canonical = $derived(stripProfilePrefix(page.url.pathname));
	const label = $derived(props.label ?? 'reviews by');
</script>

{#snippet avatar(u: U, size: string)}
	{#if u.avatarUrl}
		<img src={u.avatarUrl} alt="" class="{size} shrink-0 rounded-full object-cover" />
	{:else}
		<span
			class="{size} text-display grid shrink-0 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-lg uppercase"
		>
			{u.name.charAt(0)}
		</span>
	{/if}
{/snippet}

{#if all.length >= 1 && current}
	{#if variant === 'inline'}
		{#if all.length > 1}
			<details class="user-picker relative" title={label}>
				<summary
					aria-label={label}
					class="text-mono flex cursor-pointer list-none items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-1 pr-3 pl-1 text-xs tracking-wider uppercase transition select-none hover:border-[color:var(--color-accent)]/60"
				>
					{@render avatar(current, 'h-7 w-7')}
					<span>{current.name}</span>
					<svg
						class="chevron h-3 w-3 text-[color:var(--color-muted)]"
						viewBox="0 0 12 12"
						aria-hidden="true"
					>
						<path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
					</svg>
				</summary>

				<div
					class="fixed inset-x-4 z-30 mt-2 min-w-[14rem] rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-1.5 shadow-[0_20px_50px_-20px_oklch(0%_0_0_/_0.8)] sm:absolute sm:inset-x-auto sm:right-0"
				>
					{#each all as u (u.id)}
						{@const active = current.id === u.id}
						<a
							href={profileHref(canonical, u.username, owner?.username ?? u.username)}
							aria-current={active ? 'page' : undefined}
							onclick={(e) =>
								(e.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')}
							class="text-mono flex items-center gap-3 rounded-[calc(var(--radius-card)-4px)] px-2.5 py-2 text-sm tracking-wider uppercase transition {active
								? 'bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]'
								: 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]'}"
						>
							{@render avatar(u, 'h-8 w-8')}
							<span class="flex-1">{u.name}</span>
							{#if active}<span aria-hidden="true">✓</span>{/if}
						</a>
					{/each}
				</div>
			</details>
		{:else}
			<a
				href="/reviewers"
				title="reviewers"
				class="text-mono flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-1 pr-3 pl-1 text-xs tracking-wider uppercase transition hover:border-[color:var(--color-accent)]/60"
				>{@render avatar(current, 'h-7 w-7')}<span>{current.name}</span></a
			>
		{/if}
	{:else}
		<div class="flex flex-col items-end gap-1.5">
			<span
				class="text-mono w-full text-center text-[0.6rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
			>
				{label}
			</span>

			{#if all.length > 1}
				<details class="user-picker relative" title={label}>
					<summary
						aria-label={label}
						class="text-mono flex cursor-pointer list-none items-center gap-2.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-1.5 pr-3 pl-1.5 text-xs tracking-wider uppercase transition select-none hover:border-[color:var(--color-accent)]/60"
					>
						{@render avatar(current, 'h-12 w-12')}
						<span>{current.name}</span>
						<svg
							class="chevron h-3 w-3 text-[color:var(--color-muted)]"
							viewBox="0 0 12 12"
							aria-hidden="true"
						>
							<path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
						</svg>
					</summary>

					<div
						class="fixed inset-x-4 z-30 mt-2 min-w-[14rem] rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-1.5 shadow-[0_20px_50px_-20px_oklch(0%_0_0_/_0.8)] sm:absolute sm:inset-x-auto sm:right-0"
					>
						{#each all as u (u.id)}
							{@const active = current.id === u.id}
							<a
								href={profileHref(canonical, u.username, owner?.username ?? u.username)}
								aria-current={active ? 'page' : undefined}
								onclick={(e) =>
									(e.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')}
								class="text-mono flex items-center gap-3 rounded-[calc(var(--radius-card)-4px)] px-2.5 py-2 text-sm tracking-wider uppercase transition {active
									? 'bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]'
									: 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]'}"
							>
								{@render avatar(u, 'h-8 w-8')}
								<span class="flex-1">{u.name}</span>
								{#if active}<span aria-hidden="true">✓</span>{/if}
							</a>
						{/each}
					</div>
				</details>
			{:else}
				<!-- single reviewer: no one to switch to, so just show who it is -->
				<div
					class="text-mono flex items-center gap-2.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-1.5 pr-4 pl-1.5 text-xs tracking-wider uppercase"
				>
					{@render avatar(current, 'h-12 w-12')}
					<span>{current.name}</span>
				</div>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.user-picker > summary::-webkit-details-marker {
		display: none;
	}
	.user-picker[open] .chevron {
		transform: rotate(180deg);
	}
	.chevron {
		transition: transform 150ms ease;
	}
	@media (prefers-reduced-motion: reduce) {
		.chevron {
			transition: none;
		}
	}
</style>
