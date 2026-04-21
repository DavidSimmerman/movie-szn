<script lang="ts" module>
	export type PickerReview = {
		id: string;
		title: string;
		year: number;
		posterUrl: string | null;
		combinedScore: string | number | null;
	};
</script>

<script lang="ts">
	import { formatScore, toNumber } from '$lib/ratings';

	type Props = {
		reviews: PickerReview[];
		excludeIds?: string[];
		onPick: (reviewId: string) => void;
		onCancel?: () => void;
		autofocus?: boolean;
		placeholder?: string;
	};

	let {
		reviews,
		excludeIds = [],
		onPick,
		onCancel,
		autofocus = false,
		placeholder = 'filter reviews…'
	}: Props = $props();

	let query = $state('');
	const excluded = $derived(new Set(excludeIds));

	const filtered = $derived(
		reviews.filter((r) => {
			if (excluded.has(r.id)) return false;
			if (!query) return true;
			const q = query.toLowerCase();
			return r.title.toLowerCase().includes(q) || String(r.year).includes(q);
		})
	);
</script>

<div
	class="review-picker rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3"
>
	<div class="flex items-center gap-2">
		<input
			type="search"
			bind:value={query}
			{placeholder}
			{...autofocus ? { autofocus: true } : {}}
			class="text-mono flex-1 rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)]"
		/>
		{#if onCancel}
			<button
				type="button"
				onclick={onCancel}
				class="text-mono rounded border border-[color:var(--color-border)] px-2 py-2 text-[0.65rem] tracking-wider text-[color:var(--color-muted)] uppercase hover:text-[color:var(--color-text)]"
				aria-label="cancel"
			>
				✕
			</button>
		{/if}
	</div>

	{#if reviews.length === 0}
		<p class="text-mono mt-3 text-xs text-[color:var(--color-muted)]">
			tag reviews to this season first — the picker is empty.
		</p>
	{:else if filtered.length === 0}
		<p class="text-mono mt-3 text-xs text-[color:var(--color-muted)]">
			no matches (all eligible reviews may already be picked in this category).
		</p>
	{:else}
		<ul class="mt-3 grid max-h-72 gap-1 overflow-y-auto pr-1">
			{#each filtered as r (r.id)}
				{@const score = r.combinedScore != null ? toNumber(r.combinedScore) : null}
				<li>
					<button
						type="button"
						onclick={() => onPick(r.id)}
						class="flex w-full items-center gap-3 rounded border border-transparent px-2 py-1.5 text-left transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-bg)]"
					>
						{#if r.posterUrl}
							<img src={r.posterUrl} alt="" class="h-10 w-7 rounded object-cover" />
						{:else}
							<div
								class="h-10 w-7 rounded bg-[color:var(--color-surface)]"
								aria-hidden="true"
							></div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="text-display truncate text-sm">{r.title}</p>
							<p class="text-mono text-[0.65rem] tracking-wider text-[color:var(--color-muted)]">
								{r.year}
							</p>
						</div>
						{#if score != null}
							<span class="text-mono text-xs text-[color:var(--color-muted)] tabular-nums">
								{formatScore(score)}
							</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
