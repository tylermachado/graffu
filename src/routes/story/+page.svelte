<script>
	import { LayerCake, Svg } from 'layercake';
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
	import teams from '../../data/2022/teams.json';
	import { scatterData, scatterX, scatterY } from '$lib/getScatterData.js';
	import RetentionOverTime from '$lib/charts/RetentionOverTime.svelte';
	import squads1994 from '../../data/1994/squads.json';
	import squads1998 from '../../data/1998/squads.json';
	import squads2002 from '../../data/2002/squads.json';
	import squads2006 from '../../data/2006/squads.json';
	import squads2010 from '../../data/2010/squads.json';
	import squads2014 from '../../data/2014/squads.json';
	import squads2018 from '../../data/2018/squads.json';
	import squads2022 from '../../data/2022/squads.json';
	import steps from '../../data/scrolly-steps.json';

	const introStep = steps.find(s => s.type === 'intro');
	const outroStep = steps.find(s => s.type === 'outro');
	const scrollySteps = steps.filter(s => s.type !== 'intro' && s.type !== 'outro');

	const years = [1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022];

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
	 * Returns the scale and translate needed to show `nationName` centered in the
	 * viewport with surrounding context (fitSize to 50% of viewport dimensions).
	 * Falls back to the default world view when no nation is active.
	 * @param {string} nationName
	 * @returns {{ scale: number, translate: [number, number] }}
	 */
	function getZoomForNation(nationName) {
		const DEFAULT_SCALE = 153;
		const DEFAULT_TRANSLATE = /** @type {[number, number]} */ ([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
		if (!nationName) return { scale: DEFAULT_SCALE, translate: DEFAULT_TRANSLATE };
		const id = NAME_TO_ISO[nationName];
		if (!id) return { scale: DEFAULT_SCALE, translate: DEFAULT_TRANSLATE };
		const f = _featureById.get(id);
		if (!f) return { scale: DEFAULT_SCALE, translate: DEFAULT_TRANSLATE };
		// Scale to 30% of full-fit: country is visible with surrounding context.
		// Center is computed by projecting the geographic centroid at targetScale with
		// zero translation, then offsetting to place it at the viewport center.
		const targetScale = geoConicConformal().fitSize([MAP_WIDTH, MAP_HEIGHT], f).scale() * 0.3;
		const geoCenter = geoCentroid(f);
		const rawProj = geoConicConformal().scale(targetScale).translate([0, 0]);
		const pt = rawProj(geoCenter);
		if (!pt) return { scale: 153, translate: /** @type {[number, number]} */ ([MAP_WIDTH / 2, MAP_HEIGHT / 2]) };
		const targetTranslate = /** @type {[number, number]} */ ([MAP_WIDTH / 2 - pt[0], MAP_HEIGHT / 2 - pt[1]]);
		return { scale: targetScale, translate: targetTranslate };
	}

	const mapScale = tweened(153, { duration: 700, easing: cubicInOut });
	const mapTranslate = tweened(/** @type {[number, number]} */ ([MAP_WIDTH / 2, MAP_HEIGHT / 2]), { duration: 700, easing: cubicInOut });

	$effect(() => {
		const target = getZoomForNation(scrollyNation);
		mapScale.set(target.scale);
		mapTranslate.set(target.translate);
	});

	// ── Interactive section ────────────────────────────────────────────────────

	let selectedYear = $state(2022);
	let selectedNation = $state(Object.keys(squads2022)[0]);

	const squads = $derived(allSquads[selectedYear]);
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
	 * Safe: text comes from a local JSON file, not user input.
	 * @param {string} text
	 */
	function renderRef(text) {
		return text.replace(/\[(\d+)\]/g, '<sup class="fn-ref">$1</sup>');
	}

	const FOOTNOTES = [
		{
			id: 1,
			text: 'Squad data compiled from FIFA official World Cup squad lists and Wikipedia tournament records, 1994–2022. Domestic retention rate is defined as the share of a squad’s players based at clubs in their home country at the time of each tournament.'
		},
	];
</script>

<!-- ── Story header ─────────────────────────────────────────────────────── -->
<header class="story-header">
	<p class="story-eyebrow">African Football at the World Cup</p>
	<h1 class="story-headline">Club vs Country</h1>
	<p class="story-deck">
		Since 1994, African footballers have become the world’s most exported talent — yet the clubs and leagues that develop them have barely registered on football’s biggest stage. This is the story of what that looks like, squad by squad, tournament by tournament.
	</p>
	<div class="story-meta">
		<!-- <span>By Your Name</span> -->
		<!-- <span class="meta-sep">·</span> -->
		<span>Published May 2026</span>
	</div>
</header>

<!-- ── Combined flows section ────────────────────────────────────────────── -->
<section class="combined-flow-section">
	<p class="combined-flow-desc">
		Player flows from national squad to club nation, aggregated across all World Cup tournaments 1994–2022.
		Arcs colored by source confederation. Filled circles = domestic retention.
	</p>
	<div class="combined-flow-map" style="position: relative;">
		<WorldMap />
		<CombinedFlowLayer flows={combinedFlows} />
	</div>
	<div class="combined-flow-legend">
		{#each [['UEFA', '#4a90d9'], ['CAF', '#3cb371'], ['CONMEBOL', '#e67e22'], ['AFC', '#9b59b6'], ['CONCACAF', '#e74c3c'], ['OFC', '#95a5a6']] as [confed, color] (confed)}
			<span class="legend-item">
				<span class="legend-dot" style="background: {color};"></span>
				{confed}
			</span>
		{/each}
	</div>
</section>

<!-- ── Intro ────────────────────────────────────────────────────────────── -->
{#if introStep}
	<section class="prose-section">
		{#each introStep.text.split('\n\n') as paragraph, i (i)}
			<p>{@html renderRef(paragraph)}</p>
		{/each}
	</section>
{/if}

<RetentionOverTime />

<!-- ── Scrollytelling section ────────────────────────────────────────────── -->
<section class="scrolly-outer">
	<div class="sticky-vis">
		<div class="map-container" style="position: relative;">
			<WorldMap scale={$mapScale} translate={$mapTranslate} />
			{#if scrollyNation}
				<FlowLayer squads={scrollySquads} nation={scrollyNation} scale={$mapScale} translate={$mapTranslate} />
			{/if}
		</div>
		<div class="step-badge">
			<span class="badge-year">{scrollyYear}</span>
			{#if currentScrollyStep.nation}
				<span class="badge-nation">{currentScrollyStep.nation}</span>
			{/if}
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

	<div class="map-section">
		<div style="position: relative;">
			<WorldMap />
			<FlowLayer {squads} nation={selectedNation} />
		</div>
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
		background: #f5f4f0;
	}

	.map-container {
		width: 100%;
	}

	.step-badge {
		position: absolute;
		top: 1.25rem;
		right: 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.2rem;
		pointer-events: none;
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
		font-size: 0.75rem;
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

	/* ── Story header ──────────────────────────────────────────────────────── */

	.story-header {
		max-width: 680px;
		margin: 0 auto;
		padding: 4rem 2rem 2rem;
	}

	.story-eyebrow {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #999;
		margin: 0 0 0.75rem;
	}

	.story-headline {
		font-size: clamp(2.25rem, 5vw, 3.5rem);
		font-weight: 800;
		line-height: 1.05;
		margin: 0 0 1rem;
		color: #111;
	}

	.story-deck {
		font-size: 1.2rem;
		line-height: 1.55;
		color: #444;
		margin: 0 0 1.5rem;
		max-width: 580px;
	}

	.story-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #999;
		border-top: 1px solid #e0e0e0;
		padding-top: 1rem;
	}

	.meta-sep {
		color: #ccc;
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
		padding: 0.4rem 2rem 0.4rem 0;
		font-size: 2rem;
		font-weight: 700;
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
		font-weight: 700;
	}

	.heading-text {
		display: inline;
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
		font-size: 0.75rem;
		color: #888;
	}

	/* ── Methodology / footnotes ─────────────────────────────────────────────── */

	.methodology-section {
		max-width: 680px;
		margin: 0 auto;
		padding: 2rem 2rem 4rem;
		border-top: 1px solid #e0e0e0;
	}

	.methodology-heading {
		font-size: 0.75rem;
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

	/* ── Combined flows section ──────────────────────────────────────────────── */

	.combined-flow-section {
		max-width: 960px;
		margin: 0 auto;
		padding: 3rem 2rem;
		border-top: 1px solid #e0e0e0;
	}

	.combined-flow-desc {
		font-size: 0.85rem;
		line-height: 1.5;
		color: #777;
		max-width: 640px;
		margin: 0 0 1.5rem;
	}

	.combined-flow-map {
		width: 100%;
		background: #f5f4f0;
		border-radius: 4px;
		overflow: hidden;
	}

	.combined-flow-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.5rem;
		margin-top: 1rem;
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
