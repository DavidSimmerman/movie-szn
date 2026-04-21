<script lang="ts">
	type Props = { id?: string };
	const { id = 'grain' }: Props = $props();
</script>

<div
	class="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
	aria-hidden="true"
>
	<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
		<filter {id}>
			<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" />
		</filter>
		<rect width="100%" height="100%" filter="url(#{id})" />
	</svg>
</div>
