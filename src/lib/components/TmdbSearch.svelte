<script lang="ts" module>
	export type TmdbResult = {
		id: number;
		title: string;
		year: number | null;
		type: 'movie' | 'show';
		overview: string;
		posterUrl: string | null;
		backdropUrl: string | null;
	};
</script>

<script lang="ts">
	type Props = {
		onSelect: (r: TmdbResult) => void;
		placeholder?: string;
		selectedKey?: string | null;
		pendingKey?: string | null;
		autofocus?: boolean;
		query?: string;
	};

	let {
		onSelect,
		placeholder = 'search tmdb…',
		selectedKey = null,
		pendingKey = null,
		autofocus = false,
		query = $bindable('')
	}: Props = $props();

	let results = $state<TmdbResult[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let hasSearched = $state(false);

	let timer: ReturnType<typeof setTimeout> | null = null;
	let controller: AbortController | null = null;

	$effect(() => {
		const q = query.trim();
		if (timer) clearTimeout(timer);

		if (q.length < 2) {
			if (controller) controller.abort();
			results = [];
			loading = false;
			error = null;
			hasSearched = false;
			return;
		}

		loading = true;
		timer = setTimeout(() => {
			void runSearch(q);
		}, 350);
	});

	async function runSearch(q: string) {
		if (controller) controller.abort();
		const ac = new AbortController();
		controller = ac;
		try {
			const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`, {
				signal: ac.signal
			});
			if (ac.signal.aborted) return;
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body?.message ?? `search failed (${res.status})`);
			}
			const data = (await res.json()) as { results: TmdbResult[] };
			if (ac.signal.aborted) return;
			results = data.results ?? [];
			error = null;
			hasSearched = true;
		} catch (e) {
			if ((e as { name?: string })?.name === 'AbortError') return;
			error = e instanceof Error ? e.message : 'search failed';
			results = [];
			hasSearched = true;
		} finally {
			if (!ac.signal.aborted) loading = false;
		}
	}

	function pick(r: TmdbResult) {
		if (pendingKey) return;
		onSelect(r);
	}
</script>

<div class="tmdb-search relative">
	<div class="relative">
		<input
			type="search"
			bind:value={query}
			{placeholder}
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
			{...autofocus ? { autofocus: true } : {}}
			class="text-mono w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-3 pr-10 outline-none focus:border-[color:var(--color-accent)]"
		/>
		{#if loading}
			<span
				class="text-mono pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
			>
				…
			</span>
		{/if}
	</div>

	{#if error}
		<p
			class="text-mono absolute top-full right-0 left-0 z-20 mt-2 rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-surface)] px-3 py-2 text-xs text-[color:var(--color-danger)] shadow-lg"
		>
			{error}
		</p>
	{:else if hasSearched && results.length === 0 && !loading}
		<p
			class="text-mono absolute top-full right-0 left-0 z-20 mt-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs text-[color:var(--color-muted)] shadow-lg"
		>
			no matches. try a different title.
		</p>
	{/if}

	{#if results.length > 0}
		<ul
			class="absolute top-full right-0 left-0 z-20 mt-2 grid max-h-[28rem] gap-2 overflow-y-auto rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-xl"
		>
			{#each results as r (r.id + r.type)}
				{@const key = `${r.id}-${r.type}`}
				{@const isSelected = selectedKey === key}
				{@const isPending = pendingKey === key}
				{@const isLocked = !!pendingKey && !isPending}
				<li>
					<button
						type="button"
						onclick={() => pick(r)}
						disabled={!!pendingKey}
						aria-pressed={isSelected}
						aria-busy={isPending}
						class="group flex w-full items-start gap-4 rounded-[var(--radius-card)] border bg-[color:var(--color-bg)] p-3 text-left transition hover:border-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:hover:border-[color:var(--color-border)]"
						class:selected={isSelected}
						class:dimmed={(selectedKey && !isSelected) || isLocked}
						class:pending={isPending}
					>
						{#if r.posterUrl}
							<img
								src={r.posterUrl}
								alt=""
								loading="lazy"
								class="h-24 w-16 shrink-0 rounded object-cover"
							/>
						{:else}
							<div
								class="text-mono flex h-24 w-16 shrink-0 items-center justify-center rounded bg-[color:var(--color-surface-2)] text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
							>
								no art
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="text-display truncate text-lg leading-tight">{r.title}</p>
							<p
								class="text-mono mt-1 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase"
							>
								{r.year ?? '????'} · {r.type}
							</p>
							{#if r.overview}
								<p class="mt-2 line-clamp-2 text-xs text-[color:var(--color-muted)]">
									{r.overview}
								</p>
							{/if}
						</div>
						<span
							class="text-mono shrink-0 self-center rounded border border-[color:var(--color-border)] px-2 py-1 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase transition group-hover:border-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent)]"
							class:badge-pending={isPending}
						>
							{#if isPending}
								adding…
							{:else if isSelected}
								✓ picked
							{:else}
								pick
							{/if}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.tmdb-search button {
		border-color: var(--color-border);
	}
	.tmdb-search button.selected {
		border-color: var(--color-accent);
		background: color-mix(in oklab, var(--color-accent) 12%, var(--color-bg));
	}
	.tmdb-search button.dimmed {
		opacity: 0.55;
	}
	.tmdb-search button.pending {
		border-color: var(--color-accent);
		background: color-mix(in oklab, var(--color-accent) 12%, var(--color-bg));
	}
	.tmdb-search .badge-pending {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
