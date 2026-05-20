<script lang="ts">
	import { base } from '$app/paths';
</script>

<div class="snap-container">

	<!-- Page 1 — Site intro -->
	<section class="page page--intro">
		<div class="page-content">
			<h1>Graffu</h1>
			<p class="intro">
				A data-visual storytelling project.
			</p>
		</div>
	</section>

	<!-- Page 2 — Club vs Country -->
	<section class="page page--story">
		<div class="page-content">
			<p class="eyebrow">Africa at the World Cup</p>
			<h1>Club vs Country</h1>
			<p class="intro">
				Since 1994, African footballers have become the world's most exported talent.
				This is the story of what that looks like — squad by squad, tournament by tournament.
			</p>
			<a href="{base}/story" class="cta">Read the story →</a>
		</div>
	</section>

	<!-- Page 3 — Future story placeholder -->
	<section class="page page--next">
		<div class="page-content">
			<p class="eyebrow">Africa at the World Cup</p>
			<h1>Coming soon</h1>
			<p class="intro">
				Placeholder — a second story in the series. Details to follow.
			</p>
		</div>
	</section>

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
	.page--story  { background: #f5f4f0; }
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
