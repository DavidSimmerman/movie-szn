<script lang="ts">
	import { page } from '$app/state';
	import { profileHref, stripProfilePrefix } from '$lib/profile';

	type U = { id: string; username: string; name: string; avatarUrl?: string | null };
	type Props = { users?: U[]; label?: string };

	const props: Props = $props();
	const all = $derived(props.users ?? (page.data.users as U[]) ?? []);
	const owner = $derived(page.data.owner as U | undefined);
	const viewUser = $derived(page.data.viewUser as U | null);
	const current = $derived(all.find((u) => u.id === viewUser?.id) ?? owner);
	const canonical = $derived(stripProfilePrefix(page.url.pathname));
	const label = $derived(props.label ?? 'reviews by');
</script>

{#snippet avatar(u: U, size: string)}
	{#if u.avatarUrl}
		<img src={u.avatarUrl} alt="" class="{size} shrink-0 rounded-full object-cover" />
	{:else}
		<span
			class="{size} text-mono grid shrink-0 place-items-center rounded-full bg-[color:var(--color-surface-2)] text-[0.7em] uppercase"
		>
			{u.name.charAt(0)}
		</span>
	{/if}
{/snippet}

{#if all.length > 1 && current}
	<details class="user-picker relative" title={label}>
		<summary
			aria-label={label}
			class="text-mono flex cursor-pointer list-none items-center gap-2.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-1.5 pr-3 pl-1.5 text-xs tracking-wider uppercase transition select-none hover:border-[color:var(--color-accent)]/60"
		>
			{@render avatar(current, 'h-9 w-9')}
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
			class="absolute right-0 z-20 mt-2 min-w-[14rem] rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-1.5 shadow-[0_20px_50px_-20px_oklch(0%_0_0_/_0.8)]"
		>
			{#each all as u (u.id)}
				{@const active = current.id === u.id}
				<a
					href={profileHref(canonical, u.username, owner?.username ?? u.username)}
					aria-current={active ? 'page' : undefined}
					class="text-mono flex items-center gap-3 rounded-[calc(var(--radius-card)-4px)] px-2.5 py-2 text-sm tracking-wider uppercase transition {active
						? 'bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]'
						: 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]'}"
				>
					{@render avatar(u, 'h-12 w-12')}
					<span class="flex-1">{u.name}</span>
					{#if active}<span aria-hidden="true">✓</span>{/if}
				</a>
			{/each}
		</div>
	</details>
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
