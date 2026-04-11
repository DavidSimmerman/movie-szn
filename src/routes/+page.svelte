<script lang="ts">
	const year = new Date().getFullYear();
</script>

<main class="relative min-h-dvh overflow-hidden">
	<div class="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
		<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
			<filter id="grain">
				<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain)" />
		</svg>
	</div>

	<div class="relative mx-auto flex min-h-dvh max-w-[72rem] flex-col px-6 py-10">
		<header class="flex items-center justify-between">
			<span class="text-mono text-xs tracking-[0.3em] text-[color:var(--color-muted)] uppercase">
				◦ now showing ◦
			</span>
			<nav
				class="text-mono flex gap-6 text-xs tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				<a class="transition hover:text-[color:var(--color-text)]" href="/reviews">reviews</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/watchlist">watchlist</a>
				<a class="transition hover:text-[color:var(--color-text)]" href="/suggest">suggest</a>
			</nav>
		</header>

		<section class="flex flex-1 flex-col justify-center">
			<p class="text-mono mb-6 text-xs tracking-[0.4em] text-[color:var(--color-accent)] uppercase">
				a dave joint · movie season {year}
			</p>
			<h1 class="text-display text-[clamp(4rem,14vw,12rem)] leading-[0.85] italic">
				movie<span class="text-[color:var(--color-accent)]">-</span>szn
			</h1>
			<p class="mt-6 max-w-xl text-lg text-[color:var(--color-muted)]">
				four scores. one verdict. and a standing ovation reserved for the
				<span class="text-[color:var(--color-gold)] italic">12/10</span>. coming very soon.
			</p>

			<div class="mt-12 flex gap-4 text-sm">
				<span
					class="text-mono rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-[color:var(--color-muted)] uppercase"
				>
					production
				</span>
				<span
					class="text-mono rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-[color:var(--color-muted)] uppercase"
				>
					story
				</span>
				<span
					class="text-mono rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-[color:var(--color-muted)] uppercase"
				>
					misc
				</span>
				<span
					class="text-mono rounded-full border border-[color:var(--color-accent-2)]/40 bg-[color:var(--color-surface)] px-4 py-2 text-[color:var(--color-accent)] uppercase"
				>
					dave factor
				</span>
			</div>
		</section>

		<footer
			class="text-mono flex items-center justify-between text-xs text-[color:var(--color-muted)]"
		>
			<span>© {year} dave</span>
			<span>m0 · it's alive</span>
		</footer>
	</div>
</main>
