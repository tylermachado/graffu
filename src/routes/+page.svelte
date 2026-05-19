<main class="home">
	<div class="home-content">
		<p class="eyebrow">Africa at the World Cup</p>
		<h1>Club vs Country</h1>
		<p class="intro">
			Since 1994, African footballers have become the world's most exported talent.
			This is the story of what that looks like — squad by squad, tournament by tournament.
		</p>
		<a href="/story" class="cta">Read the story →</a>
	</div>
</main>

<style>
	.home {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f4f0;
		padding: 2rem;
		padding-top: calc(52px + 2rem);
	}

	.home-content {
		max-width: 560px;
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
