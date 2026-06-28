<script lang="ts">
	/** @type {{
		title?: string;
		intro?: string;
		items?: string[];
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
		children
	} = $props();
</script>

<details class="infobox">
	<summary>
		<div class="infobox-header">
			<div class="infobox-title-group">
				<svg class="infobox-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
					/>
				</svg>
				<span class="infobox-kicker">{title}</span>
			</div>
			<svg
				class="infobox-toggle"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
		</div>
	</summary>
	<div class="infobox-body">
		{#if children}
			{@render children()}
		{:else}
			<p>{intro}</p>
			<ul>
				{#each items as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
		{/if}
	</div>
</details>

<style>
	.infobox {
		background: rgba(249, 247, 240, 0.96);
		border: 1px solid rgba(17, 17, 17, 0.1);
		box-shadow: 0 16px 40px rgba(17, 17, 17, 0.08);
		color: #1b1b1b;
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
		margin: 0;
		line-height: 1;
	}

	.infobox-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.infobox-title-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.infobox-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: var(--color-cream-900);
		opacity: 0.85;
	}

	.infobox-toggle {
		width: 1.15rem;
		height: 1.15rem;
		flex-shrink: 0;
		color: var(--color-cream-900);
		opacity: 0.7;
		transition: transform 0.2s ease;
	}

	details[open] .infobox-toggle {
		transform: rotate(45deg);
	}

	.infobox-body {
		padding: 0 1rem 1rem;
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
