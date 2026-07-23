<script lang="ts">
	import ScoringGuide from './ScoringGuide.svelte';

	type Props = { factorLabel?: string; factorName?: string };
	const { factorLabel, factorName }: Props = $props();

	let dialog = $state<HTMLDialogElement | null>(null);

	function open() {
		dialog?.showModal();
	}

	function close() {
		dialog?.close();
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === dialog) close();
	}
</script>

<button
	type="button"
	onclick={open}
	aria-label="how this is scored"
	title="how this is scored"
	class="text-mono relative inline-flex h-7 w-7 items-center justify-center self-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm leading-none text-[color:var(--color-muted)] transition before:absolute before:-inset-2 before:content-[''] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
>
	?
</button>

<dialog
	bind:this={dialog}
	onclick={onBackdropClick}
	class="scoring-dialog rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-transparent p-0 text-[color:var(--color-text)] backdrop:bg-[oklch(0%_0_0_/_0.72)] backdrop:backdrop-blur-sm"
>
	<div class="relative">
		<button
			type="button"
			onclick={close}
			aria-label="close"
			class="text-mono absolute top-4 right-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)]/80 text-xs text-[color:var(--color-muted)] backdrop-blur-md transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
		>
			✕
		</button>
		<ScoringGuide {factorLabel} {factorName} />
	</div>
</dialog>

<style>
	.scoring-dialog {
		width: min(48rem, calc(100vw - 2rem));
		max-width: none;
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	.scoring-dialog[open] {
		position: fixed;
		inset: 0;
		margin: auto;
		animation: fade-in 160ms ease-out;
	}
	.scoring-dialog[open]::backdrop {
		animation: fade-in 160ms ease-out;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.scoring-dialog[open],
		.scoring-dialog[open]::backdrop {
			animation: none;
		}
	}
</style>
