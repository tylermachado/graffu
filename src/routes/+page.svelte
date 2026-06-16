<script lang="ts">
	import { resolve } from '$app/paths';
	import clubVsCountryImg from '$lib/assets/story-screenshots/club-vs-country.webp';
	import { SITE_URL } from '$lib/constants.js';

	const title = 'GRAFFU — Visual essays that simply explain data';
	const description = 'Visual essays that simply explain data.';
	const canonical = `${SITE_URL}/`;
	const ogImage = `${SITE_URL}/og-club-vs-country.jpg`;

	// Escape `<` so the serialized data can never break out of the <script> tag.
	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'GRAFFU',
		url: `${SITE_URL}/`,
		description
	}).replace(/</g, '\\u003c');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="GRAFFU" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${jsonLd}</scr` + `ipt>`}
</svelte:head>

<div class="snap-container">

	<!-- Page 1 — Site intro -->
	<section class="page page--intro">
		<div class="page-content">
			<h1>GRAFFU</h1>
			<p class="intro">
				Visual essays that simply explain data.
			</p>
		</div>
	</section>

	<!-- Page 2 — Club vs Country -->
	<a href={resolve('/story')} class="page page--story" style="background-image: url({clubVsCountryImg})">
		<div class="page-content">
			<h1>Club vs Country</h1>
		</div>
	</a>

</div>

<style>
	.snap-container {
		position: fixed;
		top: 52px;
		left: 0;
		right: 0;
		bottom: 0;
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
	}

	.page {
		scroll-snap-align: start;
		height: calc(100vh - 52px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		box-sizing: border-box;
	}

	.page--intro  { background: #e8e6e0; }
	.page--story  { background: #f5f4f0; background-size: cover; background-position: center; text-decoration: none; color: inherit; }
	.page--next   { background: #edecea; }

	.page-content {
		max-width: 560px;
		width: 100%;
	}

	.eyebrow {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #999;
		margin: 0 0 0.75rem;
	}

	h1 {
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 800;
		line-height: 1.05;
		margin: 0 0 1.25rem;
		color: #111;
	}

	.intro {
		font-size: 1.1rem;
		line-height: 1.65;
		color: #444;
		margin: 0 0 2rem;
	}

	.cta {
		display: inline-block;
		padding: 0.7rem 1.5rem;
		background: #111;
		color: #fff;
		text-decoration: none;
		border-radius: 4px;
		font-size: 0.95rem;
		font-weight: 600;
		transition: background 0.15s;
	}

	.cta:hover {
		background: #333;
	}
</style>
