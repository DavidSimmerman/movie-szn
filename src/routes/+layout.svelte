<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { formatPublicScore, toNumber } from '$lib/ratings';

	let { children, data } = $props();
	const description = 'a cinematic movie & tv review project. dave reviews, you suggest.';

	const movie = $derived(page.data.movie);
	const review = $derived(page.data.review);
	const isReview = $derived(Boolean(movie?.slug && review?.combinedScore != null));
	const authorName = $derived(page.data.author?.name?.toLowerCase() ?? 'dave');

	const ogUrl = $derived(`${data.origin}${page.url.pathname}`);
	const ogTitle = $derived(isReview ? `${movie.title} — ${authorName}'s review` : 'movie-szn');
	const ogDescription = $derived(
		isReview
			? `${formatPublicScore(toNumber(review.combinedScore))}/10 · ${authorName}'s review of ${movie.title} (${movie.year})`
			: description
	);
	const ogImage = $derived(
		isReview
			? `${data.origin}${page.url.pathname}/og.png?v=${new Date(review.updatedAt).getTime()}`
			: `${data.origin}/og.png`
	);
</script>

<svelte:head>
	<title>movie-szn</title>
	<meta name="description" content={description} />
	<meta property="og:type" content={isReview ? 'article' : 'website'} />
	<meta property="og:site_name" content="movie-szn" />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:url" content={ogUrl} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDescription} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

{@render children()}
