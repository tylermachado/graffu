<script>
	import { LayerCake, Svg } from 'layercake';
	import Infobox from '$lib/Infobox.svelte';
	import Scrolly from '$lib/Scrolly.svelte';
	import StackedBar from '$lib/charts/StackedBar.svelte';
	import ScatterDots from '$lib/charts/ScatterDots.svelte';
	import WorldMap from '$lib/charts/WorldMap.svelte';
	import FlowLayer from '$lib/charts/FlowLayer.svelte';
	import CombinedFlowLayer from '$lib/charts/CombinedFlowLayer.svelte';
	import { feature } from 'topojson-client';
	import { geoConicConformal, geoCentroid } from 'd3-geo';
	import worldData from 'world-atlas/countries-110m.json';
	import { NAME_TO_ISO } from '$lib/nameToIso.js';
	import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { getSquadClubNationStats } from '$lib/getSquadClubNationStats.js';
	import { getConfederationStats } from '$lib/getConfederationStats.js';
	import { getAllCombinedFlows } from '$lib/getAllCombinedFlows.js';
	import { getConfederationColor } from '$lib/getConfederationColor.js';
	import { TOURNAMENT_YEARS, SITE_URL } from '$lib/constants.js';
	import teams from '../../data/teams.json';
	import confederations from '../../data/confederations.json';
	import { scatterData, scatterX, scatterY } from '$lib/getScatterData.js';
	import RetentionOverTime from '$lib/charts/RetentionOverTime.svelte';
	import ConfederationShareOverTime from '$lib/charts/ConfederationShareOverTime.svelte';
	import squads1994 from '../../data/1994/squads.json';
	import squads1998 from '../../data/1998/squads.json';
	import squads2002 from '../../data/2002/squads.json';
	import squads2006 from '../../data/2006/squads.json';
	import squads2010 from '../../data/2010/squads.json';
	import squads2014 from '../../data/2014/squads.json';
	import squads2018 from '../../data/2018/squads.json';
	import squads2022 from '../../data/2022/squads.json';
	import squads2026 from '../../data/2026/squads.json';
	import steps from '../../data/scrolly-steps.json';

	const introStep = steps.find(s => s.type === 'intro');
	const outroStep = steps.find(s => s.type === 'outro');
	const scrollySteps = steps.filter(s => s.type !== 'intro' && s.type !== 'outro');

	const years = TOURNAMENT_YEARS;

	/** @type {Record<number, Record<string, any[]>>} */
	const allSquads = {
		1994: squads1994,
		1998: squads1998,
		2002: squads2002,
		2006: squads2006,
		2010: squads2010,
		2014: squads2014,
		2018: squads2018,
		2022: squads2022,
		2026: squads2026
	};

	// ── Combined flows (all years, all nations) ──────────────────────────────

	/** @type {Record<string, string>} */
	const nationToConfederation = Object.fromEntries(teams.map((t) => [t.nation, t.confederation]));
	const combinedFlows = getAllCombinedFlows(allSquads, nationToConfederation);

	// ── Scrollytelling ─────────────────────────────────────────────────────────

	let activeStep = $state(0);

	const currentScrollyStep = $derived(scrollySteps[activeStep] ?? scrollySteps[0]);
	const scrollyYear = $derived(currentScrollyStep.year);
	const scrollyNation = $derived(currentScrollyStep.nation ?? '');
	const scrollySquads = $derived(allSquads[scrollyYear]);

	// ── Map zoom ───────────────────────────────────────────────────────────────

	const MAP_WIDTH = 960;
	const MAP_HEIGHT = 500;

	// @ts-expect-error – world-atlas ships no types
	const _zoomCountries = /** @type {any} */ (feature(worldData, worldData.objects.countries));
	/** @type {Map<string, any>} */
	const _featureById = new Map(_zoomCountries.features.map(/** @param {any} f */ (f) => [String(f.id), f]));

	/**
	 * Returns the scale and translate needed to show `nationName` and all its club-nation
	 * destinations centered in the viewport. Falls back to the default world view when no
	 * nation is active — or, when `requirePlayers` is set, when the nation has no players.
	 * @param {string} nationName
	 * @param {Array<{ club_nation: string }>} players
	 * @param {{ requirePlayers?: boolean }} [options]
	 * @returns {{ scale: number, translate: [number, number] }}
	 */
	function getZoomToFit(nationName, players = [], { requirePlayers = false } = {}) {
		const DEFAULT_SCALE = 153;
		const DEFAULT_TRANSLATE = /** @type {[number, number]} */ ([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
		if (!nationName || (requirePlayers && !players?.length)) {
			return { scale: DEFAULT_SCALE, translate: DEFAULT_TRANSLATE };
		}

		const names = new Set([nationName]);
		for (const p of players) {
			if (p.club_nation) names.add(p.club_nation);
		}

		const features = [];
		for (const name of names) {
			const id = NAME_TO_ISO[name];
			if (!id) continue;
			const f = _featureById.get(id);
			if (f) features.push(f);
		}

		if (!features.length) return { scale: DEFAULT_SCALE, translate: DEFAULT_TRANSLATE };

		const collection = { type: 'FeatureCollection', features };
		const proj = geoConicConformal().fitSize([MAP_WIDTH, MAP_HEIGHT], /** @type {any} */ (collection));
		const targetScale = proj.scale() * 0.97;
		const targetTranslate = /** @type {[number, number]} */ (proj.translate());
		return { scale: targetScale, translate: targetTranslate };
	}

	// Honor the OS "reduce motion" setting for the JS-driven map-zoom tweens.
	// Browser-only ($effect never runs during SSR), so matchMedia is safe here.
	const ZOOM_DURATION = 700;
	let prefersReducedMotion = $state(false);
	$effect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mq.matches;
		const onChange = (/** @type {MediaQueryListEvent} */ e) => (prefersReducedMotion = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});
	const zoomTween = () => ({ duration: prefersReducedMotion ? 0 : ZOOM_DURATION });

	const mapScale = tweened(153, { duration: ZOOM_DURATION, easing: cubicInOut });
	const mapTranslate = tweened(/** @type {[number, number]} */ ([MAP_WIDTH / 2, MAP_HEIGHT / 2]), { duration: ZOOM_DURATION, easing: cubicInOut });

	$effect(() => {
		const players = scrollySquads[scrollyNation] ?? [];
		const target = getZoomToFit(scrollyNation, players);
		mapScale.set(target.scale, zoomTween());
		mapTranslate.set(target.translate, zoomTween());
	});

	// ── Interactive section ────────────────────────────────────────────────────

	let selectedYear = $state(2026);
	let selectedNation = $state(Object.keys(squads2026).sort()[0]);

	const iMapScale = tweened(153, { duration: ZOOM_DURATION, easing: cubicInOut });
	const iMapTranslate = tweened(/** @type {[number, number]} */ ([MAP_WIDTH / 2, MAP_HEIGHT / 2]), { duration: ZOOM_DURATION, easing: cubicInOut });

	const squads = $derived(allSquads[selectedYear]);

	$effect(() => {
		const players = squads[selectedNation] ?? [];
		const target = getZoomToFit(selectedNation, players, { requirePlayers: true });
		iMapScale.set(target.scale, zoomTween());
		iMapTranslate.set(target.translate, zoomTween());
	});
	const nations = $derived(Object.keys(squads).sort());
	const squadStats = $derived(getSquadClubNationStats(squads));
	const confederationStats = $derived(getConfederationStats(squads));

	$effect(() => {
		// Reset nation when year changes if it's not available
		if (!nations.includes(selectedNation)) {
			selectedNation = nations[0];
		}
	});

	/** @param {{ start: number }} d */
	const xAccessor = (d) => d.start;

	/** @param {{ start: number }} d */
	const confedXAccessor = (d) => d.start;

	/**
	 * Converts [n] footnote markers in prose text to superscript HTML.
	 * Escapes the surrounding text first so only the intended <sup> markup is
	 * emitted — literal &, <, > in prose render as text, and the function stays
	 * safe even if the prose source ever stops being author-controlled.
	 * @param {string} text
	 */
	function renderRef(text) {
		const escaped = text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		return escaped.replace(/\[(\d+)\]/g, '<sup class="fn-ref">$1</sup>');
	}

	// ── Page metadata ────────────────────────────────────────────────────────
	const pageTitle = 'Club vs Country — GRAFFU';
	const pageDescription =
		'Since 1994, African footballers have become the world’s most exported talent — yet the clubs and leagues that develop them have barely registered on football’s biggest stage. An interactive visual essay.';
	const canonical = `${SITE_URL}/story`;
	const ogImage = `${SITE_URL}/og-club-vs-country.png`;

	// Escape `<` so the serialized data can never break out of the <script> tag.
	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: 'Club vs Country',
		description: pageDescription,
		url: canonical,
		image: ogImage,
		isPartOf: { '@type': 'WebSite', name: 'GRAFFU', url: `${SITE_URL}/` }
	}).replace(/</g, '\\u003c');

	const FOOTNOTES = [
		{
			id: 1,
			text: 'Squad data compiled from FIFA official World Cup squad lists and Wikipedia tournament records, 1994–2026. Domestic retention rate is defined as the share of a squad’s players based at clubs in their home country at the time of each tournament.'
		},
	];
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="GRAFFU" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
	<meta name="twitter:image" content={ogImage} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${jsonLd}</scr` + `ipt>`}
</svelte:head>

<!-- ── Hero: combined flow map with overlaid story header ──────────────── -->
<section class="hero-section">
	<div class="hero-map">
		<WorldMap />
		<CombinedFlowLayer flows={combinedFlows} animate={true} />
	</div>
	<header class="story-header">
		<p class="story-eyebrow">African Football at the World Cup</p>
		<h1 class="story-headline">Club vs Country</h1>
		<p class="story-deck">
			Since 1994, African footballers have become the world’s most exported talent — yet the clubs and leagues that develop them have barely registered on football’s biggest stage.
		</p>
	</header>
</section>

<!-- ── Flow legend + description ─────────────────────────────────────────── -->
<div class="flow-meta">
	<p class="combined-flow-desc">
		Player flows from national squad to club nation, aggregated across all World Cup tournaments 1994–2026.
		Arcs colored by source confederation. Filled circles = domestic retention.
	</p>
	<div class="combined-flow-legend">
		{#each confederations as confed (confed.confederation)}
			<span class="legend-item">
				<span class="legend-dot" style="background: {confed.color};"></span>
				{confed.confederation}
			</span>
		{/each}
	</div>
</div>

<!-- ── Intro ────────────────────────────────────────────────────────────── -->
{#if introStep}
		{@const introParagraphs = introStep.text.split('\n\n')}
	<section class="prose-section prose-with-infobox">
		<div class="prose-copy">
			{#each introParagraphs as paragraph, i (i)}
				<p>{@html renderRef(paragraph)}</p>
			{/each}
		</div>
		<aside class="prose-infobox">
			<Infobox title="">
				<p>In international soccer, 11 players are on the pitch at any given time, but each nation in the World Cup has 26 players on its squad in total (up from 22 or 23 in previous years).</p>
				<p>The stars of global soccer often play for two teams simultaneously; they represent their country’s national team in international competitions like the World Cup, but they spend most of the year with, and make most of their salaries from, club teams that could be based in their home country or anywhere else — clubs like Arsenal in the English Premier League, Barcelona in Spain's La Liga, Orlando Pirates in South Africa's Premier Soccer League and so on.</p>
				<p>The 2026 tournament is the first to feature 48 teams competing, up from 32 in other years since the 1990s.</p>
			</Infobox>
		</aside>
	</section>
{/if}

<div class="charts-row">
	<RetentionOverTime />
</div>

<!-- ── Explanation section ───────────────────────────────────────────────── -->
<section class="prose-section prose-with-infobox">
	<div class="prose-copy">
		<p>
			In the maps that follow, <strong>filled circles</strong> represent players who remain in their home country's domestic leagues — the "domestic retention" you see in the line chart above. <strong>Curved arc lines</strong> represent players who have moved abroad to play in foreign leagues, with the destination country indicated by where the arc terminates. The thicker the arc, the more players have made that particular move. So when you see a larger circle over a country, that means more of that nation's squad is playing domestically; when you see more lines going elsewehre, that means more of that nation's players play for clubs abroad.
		</p>
	</div>
	<aside class="prose-infobox">
			<Infobox title="">
				<p>Every continent has a "confederation" that governs football in that region, although some countries choose to play in a geographically different confederation (e.g. Australia in AFC, Israel in UEFA).</p>
				<ul>
					<li><strong>UEFA</strong> — Europe</li>
					<li><strong>CONMEBOL</strong> — South America</li>
					<li><strong>CONCACAF</strong> — North & Central America and the Caribbean</li>
					<li><strong>AFC</strong> — Asia</li>
					<li><strong>CAF</strong> — Africa</li>
					<li><strong>OFC</strong> — Oceania (mostly island nations in the Pacific)</li>
				</ul>
			</Infobox>
	</aside>
</section>

<!-- ── Scrollytelling section ────────────────────────────────────────────── -->
<section class="scrolly-outer">
	<div class="sticky-vis">
		<div class="sticky-layout">
			<div class="sticky-margin"></div>
			<div class="map-container" style="position: relative;">
				<WorldMap scale={$mapScale} translate={$mapTranslate} />
				{#if scrollyNation}
					<FlowLayer squads={scrollySquads} nation={scrollyNation} scale={$mapScale} translate={$mapTranslate} />
				{/if}
			</div>
		</div>
	</div>

	<div class="steps-wrapper">
		<Scrolly bind:value={activeStep}>
			{#each scrollySteps as step, i (i)}
				<div class="step">
					<div class="step-card" class:active={activeStep === i}>
						<p class="step-title">{step.title}</p>
						<p class="step-text">{step.text}</p>
					</div>
				</div>
			{/each}
			<div class="step-spacer"></div>
		</Scrolly>
	</div>
</section>

<!-- ── Outro ────────────────────────────────────────────────────────────── -->
{#if outroStep}
	<section class="prose-section">
		{#each outroStep.text.split('\n\n') as paragraph, i (i)}
			<p>{@html renderRef(paragraph)}</p>
		{/each}
	</section>
{/if}

<div class="charts-row">
	<ConfederationShareOverTime />
</div>

<section class="prose-section">
	<p>
		The interactive map below shows all player flows from the squads of every World Cup tournament between 1994 and 2026. The size of the circles indicates the number of players who stayed in their home country's leagues, while the arcs show the most common international moves. Use the dropdown menus to explore.
	</p>
</section>

<!-- ── Interactive section ───────────────────────────────────────────────── -->
<section class="interactive-section">
	<h1 class="interactive-heading">
		<span class="heading-text">Explore the</span>
		<select class="heading-select" bind:value={selectedNation}>
			{#each nations as nation (nation)}
				<option value={nation}>{nation}</option>
			{/each}
		</select>
		<span class="heading-text">squad at the</span>
		<select class="heading-select" bind:value={selectedYear}>
			{#each years as year (year)}
				<option value={year}>{year}</option>
			{/each}
		</select>
		<span class="heading-text">World Cup</span>
	</h1>

	<div class="interactive-body">
	<div class="map-section">
		<div style="position: relative;">
			<WorldMap scale={$iMapScale} translate={$iMapTranslate} />
			<FlowLayer {squads} nation={selectedNation} scale={$iMapScale} translate={$iMapTranslate} />
		</div>
	</div>

	{#if squadStats[selectedNation]}
		<div class="squad-bar-section">
			<p class="squad-bar-label">share of squad by club nation</p>
			<div class="squad-bar-wrap">
				<LayerCake
					data={squadStats[selectedNation]}
					x={xAccessor}
					xDomain={[0, 100]}
				>
					<Svg>
						<StackedBar stackedData={squadStats[selectedNation]} />
					</Svg>
				</LayerCake>
			</div>
			<div class="squad-bar-legend">
				{#each squadStats[selectedNation].slice(0, 6) as seg (seg.label)}
					<span class="squad-legend-item">
						<span class="squad-legend-dot" style="background: {getConfederationColor(seg.confederation) ?? '#ccc'};"></span>
						<span>{seg.label}{seg.confederation ? ` (${seg.confederation})` : ''}: <span class="squad-legend-pct">{seg.percentage.toFixed(0)}%</span></span>
					</span>
				{/each}
				{#if squadStats[selectedNation].length > 6}
					{@const othersTotal = squadStats[selectedNation].slice(6).reduce((sum, s) => sum + s.percentage, 0)}
					<span class="squad-legend-item squad-legend-others">
						<span class="squad-legend-dot" style="background: #ccc;"></span>
						<span>Others <span class="squad-legend-pct">{othersTotal.toFixed(0)}%</span></span>
					</span>
				{/if}
			</div>
		</div>
	{/if}
	</div>
</section>

<!-- ── Methodology ──────────────────────────────────────────────────────── -->
<section class="methodology-section">
	<h3 class="methodology-heading">Methodology &amp; Sources</h3>
	<ol class="methodology-list">
		{#each FOOTNOTES as note (note.id)}
			<li id="fn-{note.id}">{note.text}</li>
		{/each}
	</ol>
</section>

<style>
	/* ── Scrollytelling ─────────────────────────────────────────────────────── */

	.scrolly-outer {
		position: relative;
		padding-top: 52px;
	}

	.sticky-vis {
		position: sticky;
		top: 0;
		height: 100vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.sticky-layout {
		width: 100%;
		display: block;
	}

	.sticky-margin {
		display: none;
	}

	.map-container {
		width: 100%;
	}

	.badge-year {
		font-size: 2.5rem;
		font-weight: 700;
		color: rgba(0, 0, 0, 0.15);
		line-height: 1;
	}

	.badge-nation {
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(0, 0, 0, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.steps-wrapper {
		position: relative;
		z-index: 2;
		margin-top: -100vh;
		pointer-events: none;
	}

	.step {
		min-height: 85vh;
		display: flex;
		align-items: center;
		padding: 2rem;
		pointer-events: none;
	}

	.step-card {
		pointer-events: auto;
		max-width: 360px;
		background: rgba(255, 255, 255, 0.93);
		padding: 1.5rem 1.75rem;
		border-radius: 6px;
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
		transition: opacity 0.4s ease;
		opacity: 0.35;
	}

	.step-card.active {
		opacity: 1;
	}

	.step-title {
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: #888;
		margin: 0 0 0.6rem;
	}

	.step-text {
		font-size: 0.95rem;
		line-height: 1.6;
		color: #222;
		margin: 0;
	}

	.step-spacer {
		height: 40vh;
	}

	@media (max-width: 768px) {
		.sticky-vis {
			justify-content: flex-end;
		}

		.map-container {
			height: 60vh;
			overflow: hidden;
		}

		.map-container :global(.map-wrap) {
			display: flex;
			justify-content: center;
			height: 100%;
		}

		.map-container :global(.world-svg) {
			height: 100%;
			width: calc(60vh * 960 / 500);
			max-width: none;
			flex-shrink: 0;
		}

		.map-container :global(.flow-layer) {
			height: 100%;
			width: calc(60vh * 960 / 500);
			max-width: none;
			left: 50%;
			transform: translateX(-50%);
		}

		.step {
			align-items: flex-start;
			padding: 0;
		}

		.step-card {
			max-width: 100%;
			padding: 0.75rem 1rem;
			box-shadow: none;
		}
	}

	@media (min-width: 1100px) {
		.sticky-layout {
			width: 100%;
			display: block;
			padding: 0 1.5rem;
		}

		.sticky-margin {
			display: none;
		}
	}

	/* ── Hero section ──────────────────────────────────────────────────────── */

	.hero-section {
		position: relative;
		width: 100%;
		overflow: hidden;
		background: #f5f4f0;
	}

	.hero-map {
		position: relative;
		width: 100%;
	}

	/* ── Story header ──────────────────────────────────────────────────────── */

	.story-header {
		position: absolute;
		right: 0;
		bottom: 25px;
		max-width: 600px;
		padding: 1rem 1rem;
		background: rgba(245, 244, 240, 0.78);
		border-radius: 4px;
	}

	.story-eyebrow {
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: -0.02em;
		color: #999;
		margin: 0 0 0.33rem;
	}

	.story-headline {
		font-size: clamp(2.25rem, 5vw, 3.5rem);
		letter-spacing: -0.04em;
		font-weight: 400;
		line-height: 1.05;
		margin: 0 0 0.33rem;
		color: #111;
	}

	.story-deck {
		font-size: 1xrem;
		line-height: 1.2;
		color: #444;
		margin: 0 0 0.33rem;
		max-width: 580px;
	}

	/* ── Charts row ──────────────────────────────────────────────────────── */

	.charts-row {
		display: flex;
		flex-direction: column;
		max-width: 860px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* ── Prose sections ────────────────────────────────────────────────────── */

	.prose-section {
		max-width: 680px;
		margin: 0 auto;
		padding: 3rem 2rem;
		font-size: 1.05rem;
		line-height: 1.7;
		color: #222;
	}

	.prose-section p {
		margin: 0 0 1.25rem;
	}

	.prose-section p:last-child {
		margin-bottom: 0;
	}

	.prose-with-infobox {
		display: grid;
		gap: 1.5rem;
	}

	.prose-copy {
		min-width: 0;
	}

	.prose-infobox {
		width: 100%;
	}

	@media (min-width: 1100px) {
		.prose-with-infobox {
			max-width: 1040px;
			grid-template-columns: minmax(0, 680px) minmax(240px, 280px);
			align-items: start;
			column-gap: 2rem;
		}

		.prose-infobox {
			position: sticky;
			top: calc(var(--nav-height) + 1.5rem);
		}
	}

	/* ── Interactive section ──────────────────────────────────────────────── */

	.interactive-section {
		padding: 3rem 2rem;
	}

	.interactive-heading {
		font-size: 2rem;
		font-weight: 600;
		line-height: 1.3;
		margin: 0 0 2rem;
		color: #111;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
	}

	.heading-select {
		background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 0.25rem center;
		background-size: 1.5rem;
		border: none;
		border-bottom: 2.5px solid #111;
		padding: 0.4rem 2rem 0.1rem 0;
		font-weight: 600;
		font-size: 1.5rem;
		color: #4a90d9;
		cursor: pointer;
		font-family: inherit;
		appearance: none;
		transition: border-color 0.15s;
	}

	.heading-select:hover {
		border-bottom-color: #555;
	}

	.heading-select:focus {
		outline: none;
		border-bottom-color: #333;
	}

	/* Style selected options in dropdown */
	.heading-select option:checked {
		background: linear-gradient(#4a90d9, #4a90d9);
		background-color: #4a90d9 !important;
		color: white !important;
		font-weight: 600;
		font-size: 1.5rem;
	}

	.heading-text {
		display: inline;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.interactive-body {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	@media (min-width: 900px) {
		.interactive-body {
			display: grid;
			grid-template-columns: 3fr 2fr;
			gap: 2rem;
			align-items: start;
		}
		.squad-bar-section {
			max-width: none;
			margin-top: 0;
		}
		.squad-bar-legend {
			flex-direction: column;
			flex-wrap: nowrap;
		}
	}

	.map-section {
		margin-bottom: 2rem;
	}

	.scatter-container {
		width: 100%;
		max-width: 800px;
		margin-bottom: 2.5rem;
	}

	:global(.scatter-container .layercake-container) {
		height: 400px !important;
	}

	.chart-container {
		width: 100%;
		max-width: 800px;
		padding: 0rem;
		margin-bottom: 1.5rem;
	}

	:global(.layercake-container) {
		height: 20px !important;
	}

	h2 {
		margin-top: 0;
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}

	.confederation-section {
		width: 100%;
		max-width: 800px;
		margin-bottom: 2.5rem;
	}

	.confederation-section h2 {
		margin-bottom: 0.5rem;
	}

	.confed-row {
		display: grid;
		grid-template-columns: 100px 1fr 90px;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.confed-header-row {
		display: grid;
		grid-template-columns: 100px 1fr 90px;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.confed-axis-label-left {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #999;
		text-align: right;
	}

	.confed-axis-label-right {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #999;
	}

	.confed-label {
		font-size: 0.85rem;
		font-weight: 600;
		text-align: right;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.25rem;
	}

	.confed-arrow {
		color: #bbb;
		font-weight: 400;
	}

	.confed-bar-wrap {
		height: 40px;
	}

	:global(.confed-bar-wrap .layercake-container) {
		height: 40px !important;
	}

	.confed-count {
		font-size: 1rem;
		color: #888;
	}

	/* ── Squad bar (interactive section) ────────────────────────────────────── */

	.squad-bar-section {
		max-width: 800px;
		margin-top: 1.5rem;
	}

	.squad-bar-label {
		font-size: 1.2rem;
		font-weight: 600;
		font-family: var(--font-display);
		letter-spacing: -0.02em;
		text-transform: uppercase;
		color: #999;
		margin: 0 0 0.5rem;
	}

	.squad-bar-wrap {
		height: 44px;
		width: 100%;
	}

	:global(.squad-bar-wrap .layercake-container) {
		height: 44px !important;
	}

	.squad-bar-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		margin-top: 0.75rem;
	}

	.squad-legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 1rem;
		font-family: var(--font-display);
		letter-spacing: -0.02em;
		color: #444;
	}

	.squad-legend-others {
		color: #999;
	}

	.squad-legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.squad-legend-pct {
		color: #888;
		font-weight: 600;
	}

	/* ── Methodology / footnotes ─────────────────────────────────────────────── */

	.methodology-section {
		max-width: 680px;
		margin: 0 auto;
		padding: 2rem 2rem 4rem;
		border-top: 1px solid #e0e0e0;
	}

	.methodology-heading {
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #aaa;
		margin: 0 0 0.75rem;
	}

	.methodology-list {
		font-size: 0.825rem;
		line-height: 1.65;
		color: #777;
		padding-left: 1.5rem;
		margin: 0;
	}

	.methodology-list li {
		margin-bottom: 0.5rem;
	}

	:global(.fn-ref) {
		font-size: 0.65em;
		vertical-align: super;
		color: #999;
		font-weight: 600;
	}

	/* ── Flow meta (legend + description below hero) ────────────────────────── */

	.flow-meta {
		max-width: 960px;
		margin: 0 auto;
		padding: 1.25rem 2rem 2rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.combined-flow-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.5rem;
		margin-bottom: 0.75rem;
	}

	.combined-flow-desc {
		font-family: var(--font-display);
		letter-spacing: -0.01em;
		font-size: 0.85rem;
		line-height: 1.25;
		color: #777;
		max-width: 640px;
		margin: 0;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #444;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
