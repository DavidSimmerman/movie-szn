<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>movie-szn</title>
	<meta
		name="description"
		content="a cinematic movie & tv review project. dave reviews, you suggest."
	/>
</svelte:head>

{@render children()}
