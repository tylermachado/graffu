<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

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
		height: 52px;
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
