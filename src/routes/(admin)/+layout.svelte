<script lang="ts">
	import { page } from '$app/state';

	let { children, data } = $props();

	const nav = $derived([
		{ href: '/admin', label: 'dashboard' },
		{ href: '/admin/movies', label: 'movies' },
		{ href: '/admin/reviews', label: 'reviews' },
		{ href: '/admin/watchlist', label: 'watchlist' },
		{ href: '/admin/seasons', label: 'seasons' },
		{ href: '/admin/lists', label: 'lists' },
		...(data.user.isAdmin
			? [
					{ href: '/admin/suggestions', label: 'suggestions' },
					{ href: '/admin/users', label: 'users' }
				]
			: [])
	]);

	const current = $derived(page.url.pathname);
</script>

<div class="min-h-dvh">
	<header
		class="sticky top-0 z-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/80 backdrop-blur-md"
	>
		<div class="mx-auto flex max-w-[72rem] items-center justify-between px-6 py-4">
			<a href="/" class="text-display text-lg italic">
				movie<span class="text-[color:var(--color-accent)]">-</span>szn
				<span
					class="text-mono ml-2 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					admin
				</span>
			</a>
			<div class="flex items-center gap-4">
				<span
					class="text-mono text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase"
				>
					{data.user.name}{#if data.user.isAdmin}<span class="text-[color:var(--color-accent)]">
							·
						</span>admin{/if}
				</span>
				<form method="POST" action="/logout">
					<button
						class="text-mono -m-2 p-2 text-[0.65rem] tracking-[0.3em] text-[color:var(--color-muted)] uppercase transition hover:text-[color:var(--color-text)]"
						type="submit"
					>
						log out
					</button>
				</form>
			</div>
		</div>
		<nav
			class="mx-auto flex max-w-[72rem] scrollbar-none gap-6 overflow-x-auto px-6 pb-1 whitespace-nowrap"
		>
			{#each nav as item (item.href)}
				{@const active =
					current === item.href || (item.href !== '/admin' && current.startsWith(item.href))}
				<a
					href={item.href}
					class="text-mono py-2 text-xs tracking-wider uppercase transition {active
						? 'text-[color:var(--color-accent)]'
						: 'text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</header>

	<div class="mx-auto max-w-[72rem] px-6 py-10">
		{@render children()}
	</div>
</div>
