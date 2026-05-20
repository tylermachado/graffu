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
		background: #fff;
		border-bottom: 1px solid #e8e8e8;
	}

	.site-name {
		font-size: 0.85rem;
		font-weight: 700;
		color: #111;
		text-decoration: none;
		letter-spacing: 0.02em;
	}

	nav {
		display: flex;
		gap: 1.5rem;
	}

	nav a {
		font-size: 0.85rem;
		font-weight: 500;
		color: #555;
		text-decoration: none;
		transition: color 0.15s;
	}

	nav a:hover {
		color: #111;
	}
</style>
