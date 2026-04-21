<script lang="ts">
	import '../app.css';

	let { children, data } = $props();
	const description = 'a cinematic movie & tv review project. dave reviews, you suggest.';
	const ogImage = $derived(`${data.origin}/og.png`);
</script>

<svelte:head>
	<title>movie-szn</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="movie-szn" />
	<meta property="og:title" content="movie-szn" />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={data.origin} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="movie-szn" />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

{@render children()}
