<script lang="ts" module>
	export type NavLink = { href: string; label: string };
</script>

<script lang="ts">
	import { page } from '$app/state';

	type Pill = { href: string; label: string };
	type Props = {
		links?: NavLink[];
		pill?: Pill | null;
		class?: string;
	};

	const DEFAULT_LINKS: NavLink[] = [
		{ href: '/reviews', label: 'reviews' },
		{ href: '/reviewers', label: 'reviewers' },
		{ href: '/watchlist', label: 'watchlist' },
		{ href: '/suggest', label: 'suggest' },
		{ href: '/seasons', label: 'seasons' }
	];

	const props: Props = $props();
	const links = $derived(props.links ?? DEFAULT_LINKS);
	const klass = $derived(props.class ?? '');
	const resolvedPill = $derived<Pill | null>(
		'pill' in props
			? (props.pill ?? null)
			: page.data.user
				? { href: '/admin', label: 'admin' }
				: null
	);

	const current = $derived(page.url.pathname);
	function isActive(href: string) {
		if (href === '/') return current === '/';
		return current === href || current.startsWith(href + '/');
	}
</script>

<div data-og-hide class="relative mx-auto w-full max-w-[72rem] px-6 pt-8 sm:pt-10 {klass}">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
		<div class="flex items-center justify-between gap-4">
			<a href="/" class="text-display text-lg whitespace-nowrap italic" aria-label="movie-szn home">
				movie<span class="text-[color:var(--color-accent)]">-</span>szn
			</a>
			{#if resolvedPill}
				<a
					href={resolvedPill.href}
					class="text-mono -my-1 rounded border border-[color:var(--color-accent)]/50 px-2 py-1 text-[0.65rem] tracking-wider text-[color:var(--color-accent)] uppercase transition hover:bg-[color:var(--color-accent)]/10 sm:hidden"
				>
					{resolvedPill.label}
				</a>
			{/if}
		</div>

		<nav
			aria-label="primary"
			class="text-mono flex w-full items-center justify-between text-xs tracking-wider text-[color:var(--color-muted)] uppercase sm:w-auto sm:justify-end sm:gap-6"
		>
			{#each links as link (link.href)}
				{@const active = isActive(link.href)}
				<a
					href={link.href}
					aria-current={active ? 'page' : undefined}
					class="-my-2 py-2 transition hover:text-[color:var(--color-text)]"
					class:text-[color:var(--color-accent)]={active}
				>
					{link.label}
				</a>
			{/each}
			{#if resolvedPill}
				<a
					href={resolvedPill.href}
					class="-my-1 hidden rounded border border-[color:var(--color-accent)]/50 px-2 py-1 text-[0.65rem] text-[color:var(--color-accent)] transition hover:bg-[color:var(--color-accent)]/10 sm:inline-block"
				>
					{resolvedPill.label}
				</a>
			{/if}
		</nav>
	</header>
</div>
