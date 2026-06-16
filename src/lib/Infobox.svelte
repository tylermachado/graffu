<script>
	/** @type {{
		title?: string;
		intro?: string;
		items?: string[];
		collapsible?: boolean;
		children?: import('svelte').Snippet;
	}} */
	let {
		title = 'Infobox',
		intro = 'Placeholder copy for side notes, definitions, or contextual details.',
		items = [
			'Replace this with a stat, aside, or key takeaway.',
			'Use this space for source notes or quick methodology context.',
			'Longer annotations can live here without interrupting the main story flow.'
		],
		collapsible = false,
		children
	} = $props();
</script>

{#if collapsible}
	<details class="infobox infobox-collapsible">
		<summary>
			<span class="infobox-kicker">Story Note</span>
			<span class="infobox-title">{title}</span>
		</summary>
		<div class="infobox-body">
			{#if children}
				{@render children()}
			{:else}
				<p>{intro}</p>
				<ul>
					{#each items as item}
						<li>{item}</li>
					{/each}
				</ul>
			{/if}
		</div>
	</details>
{:else}
	<aside class="infobox infobox-static">
		<p class="infobox-kicker">Story Note</p>
		<h2 class="infobox-title">{title}</h2>
		<div class="infobox-body">
			{#if children}
				{@render children()}
			{:else}
				<p>{intro}</p>
				<ul>
					{#each items as item}
						<li>{item}</li>
					{/each}
				</ul>
			{/if}
		</div>
	</aside>
{/if}

<style>
	.infobox {
		background: rgba(249, 247, 240, 0.96);
		border: 1px solid rgba(17, 17, 17, 0.1);
		box-shadow: 0 16px 40px rgba(17, 17, 17, 0.08);
		color: #1b1b1b;
	}

	.infobox-static {
		padding: 1rem;
		border-radius: 10px;
	}

	.infobox-collapsible {
		border-radius: 12px;
		overflow: clip;
	}

	summary {
		list-style: none;
		cursor: pointer;
		padding: 1rem 1.1rem;
		display: grid;
		gap: 0.2rem;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	.infobox-kicker {
		display: block;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 400;
		letter-spacing: -0.05em;
		text-transform: uppercase;
		color: var(--color-cream-900);
		margin: 0 0 0.35rem;
	}

	.infobox-title {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.1;
		margin: 0;
	}

	.infobox-body {
		padding: 0 1rem 1rem;
	}

	.infobox-static .infobox-body {
		padding: 0;
	}

	.infobox-body p,
	.infobox-body :global(p) {
		font-size: 0.85rem;
		line-height: 1.55;
		margin: 0 0 0.85rem;
	}

	.infobox-body ul,
	.infobox-body :global(ul),
	.infobox-body :global(ol) {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.55rem;
	}

	.infobox-body li,
	.infobox-body :global(li) {
		font-size: 0.92rem;
		line-height: 1.5;
	}
</style>