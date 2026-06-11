<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Preload critical webfonts -->
	<link rel="preload" as="font" href="{base}/fonts/tay-flapjack/TAYFlapjack.woff2" type="font/woff2" crossorigin />
	<link rel="preload" as="font" href="{base}/fonts/source-serif-4/source-serif-4-latin-400-normal.woff2" type="font/woff2" crossorigin />
	
	<!-- Font faces with base path -->
	<style>
		@font-face {
			font-family: 'TAY Flapjack';
			src: url('{base}/fonts/tay-flapjack/TAYFlapjack.woff2') format('woff2'),
				 url('{base}/fonts/tay-flapjack/TAYFlapjack.woff') format('woff');
			font-weight: 400;
			font-style: normal;
			font-display: swap;
		}

		@font-face {
			font-family: 'Source Serif 4';
			src: url('{base}/fonts/source-serif-4/source-serif-4-latin-400-normal.woff2') format('woff2'),
				 url('{base}/fonts/source-serif-4/source-serif-4-latin-400-normal.woff') format('woff');
			font-weight: 400;
			font-style: normal;
			font-display: swap;
		}

		@font-face {
			font-family: 'Source Serif 4';
			src: url('{base}/fonts/source-serif-4/source-serif-4-latin-400-italic.woff2') format('woff2'),
				 url('{base}/fonts/source-serif-4/source-serif-4-latin-400-italic.woff') format('woff');
			font-weight: 400;
			font-style: italic;
			font-display: swap;
		}

		@font-face {
			font-family: 'Source Serif 4';
			src: url('{base}/fonts/source-serif-4/source-serif-4-latin-700-normal.woff2') format('woff2'),
				 url('{base}/fonts/source-serif-4/source-serif-4-latin-700-normal.woff') format('woff');
			font-weight: 700;
			font-style: normal;
			font-display: swap;
		}

		@font-face {
			font-family: 'Source Serif 4';
			src: url('{base}/fonts/source-serif-4/source-serif-4-latin-700-italic.woff2') format('woff2'),
				 url('{base}/fonts/source-serif-4/source-serif-4-latin-700-italic.woff') format('woff');
			font-weight: 700;
			font-style: italic;
			font-display: swap;
		}
	</style>
</svelte:head>

<header class="site-header">
	<a href="{base}/" class="site-name">Graffu</a>
	<nav>
		<a href="{base}/">Home</a>
		<a href="{base}/story">Club vs Country</a>
	</nav>
</header>

{@render children()}

<style>
	.site-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		height: 80px;
		background: var(--color-brand);
		border-bottom: 1px solid var(--color-brand);
	}

	.site-name {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: #fff;
		text-decoration: none;
		letter-spacing: 0.02em;
	}

	nav {
		display: flex;
		gap: 1.5rem;
	}

	nav a {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 500;
		color: #fff;
		text-decoration: none;
		transition: color 0.15s;
	}

	nav a:hover {
		color: var(--color-brand-light);
	}
</style>
