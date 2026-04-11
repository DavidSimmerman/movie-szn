<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>watchlist · movie-szn</title>
</svelte:head>

<main class="relative min-h-dvh overflow-hidden">
	<div class="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
		<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
			<filter id="grain-wl">
				<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain-wl)" />
		</svg>
	</div>

	<div class="relative mx-auto max-w-[56rem] px-6 py-12">
		<header class="mb-10 flex items-center justify-between">
			<a href="/" class="text-display text-lg italic">
				movie<span class="text-[color:var(--color-accent)]">-</span>szn
			</a>
			<nav
				class="text-mono flex gap-6 text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				<a class="transition hover:text-[color:var(--color-text)]" href="/reviews">reviews</a>
				<a class="text-[color:var(--color-accent)]" href="/watchlist">watchlist</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/suggest">suggest</a>
			</nav>
		</header>

		<p class="text-mono text-[0.65rem] tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
			◦ up next ◦
		</p>
		<h1 class="text-display mt-2 text-6xl italic">the watchlist</h1>
		<p class="mt-3 max-w-xl text-[color:var(--color-muted)]">
			what dave is planning to watch, in order. no promises on timing.
		</p>

		{#if data.items.length === 0}
			<p class="mt-12 text-[color:var(--color-muted)]">nothing queued up yet.</p>
		{:else}
			<ol class="mt-12 space-y-1">
				{#each data.items as item, index (item.id)}
					<li
						class="group relative grid grid-cols-[auto_auto_1fr] items-center gap-5 rounded-[var(--radius-card)] border border-transparent p-4 transition hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-surface)]"
					>
						<div
							class="text-display w-12 text-right text-5xl leading-none text-[color:var(--color-muted)] tabular-nums"
						>
							{(index + 1).toString().padStart(2, '0')}
						</div>
						{#if item.posterUrl}
							<img src={item.posterUrl} alt="" class="h-24 w-16 rounded object-cover" />
						{:else}
							<div class="h-24 w-16 rounded bg-[color:var(--color-surface-2)]"></div>
						{/if}
						<div>
							<p class="text-display text-2xl">{item.title}</p>
							<p class="text-mono text-xs text-[color:var(--color-muted)]">
								{item.year} · {item.type}
							</p>
							{#if item.notes}
								<p class="mt-2 text-sm text-[color:var(--color-muted)]">{item.notes}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</main>
