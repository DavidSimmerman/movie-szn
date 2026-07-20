<script lang="ts">
	import { page } from '$app/state';
	import { CATEGORIES, type RatingSortKey } from '$lib/ratings';

	type Props = { active: RatingSortKey | null; factorName?: string };
	const { active, factorName = 'dave' }: Props = $props();

	const pathname = $derived(page.url.pathname);

	const base =
		'text-mono rounded-full border px-3 py-1 text-xs lowercase tracking-wider whitespace-nowrap transition-colors duration-200';
	const on =
		'border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]';
	const off =
		'border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)]/50 hover:text-[color:var(--color-text)]';
</script>

<nav aria-label="sort reviews" class="-mx-6 scrollbar-none overflow-x-auto px-6">
	<div class="flex w-max items-center gap-2">
		<a
			href={pathname}
			data-sveltekit-noscroll
			aria-current={active === null ? 'true' : undefined}
			class="{base} {active === null ? on : off}"
		>
			overall
		</a>
		{#each CATEGORIES as c (c.key)}
			<a
				href="{pathname}?sort={c.key}"
				data-sveltekit-noscroll
				aria-current={active === c.key ? 'true' : undefined}
				class="{base} {active === c.key ? on : off}"
			>
				{c.key === 'daveFactor' ? `${factorName} factor` : c.label}
			</a>
		{/each}
	</div>
</nav>
