<script lang="ts">
	import { page } from '$app/state';
	import { profileHref, stripProfilePrefix } from '$lib/profile';

	type U = { id: string; username: string; name: string };
	type Props = { users?: U[]; label?: string };

	const props: Props = $props();
	const all = $derived(props.users ?? (page.data.users as U[]) ?? []);
	const owner = $derived(page.data.owner as U | undefined);
	const viewUser = $derived(page.data.viewUser as U | null);
	const canonical = $derived(stripProfilePrefix(page.url.pathname));
	const label = $derived(props.label ?? 'reviews by');
</script>

{#if all.length > 1 && owner}
	<nav
		aria-label={label}
		class="text-mono flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] tracking-wider uppercase"
	>
		<span class="text-[color:var(--color-muted)]">{label}</span>
		{#each all as u (u.id)}
			{@const active = viewUser?.id === u.id}
			<a
				href={profileHref(canonical, u.username, owner.username)}
				aria-current={active ? 'page' : undefined}
				class="rounded-full border px-3 py-1 transition {active
					? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]'
					: 'border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)]/50 hover:text-[color:var(--color-text)]'}"
			>
				{u.name}
			</a>
		{/each}
	</nav>
{/if}
