<script>
	import { LayerCake, Svg } from 'layercake';
	import Scrolly from '$lib/Scrolly.svelte';
	import StackedBar from '$lib/charts/StackedBar.svelte';
	import ScatterDots from '$lib/charts/ScatterDots.svelte';
	import WorldMap from '$lib/charts/WorldMap.svelte';
	import FlowLayer from '$lib/charts/FlowLayer.svelte';
	import { getSquadClubNationStats } from '$lib/getSquadClubNationStats.js';
	import { getConfederationStats } from '$lib/getConfederationStats.js';
	import { scatterData, scatterX, scatterY } from '$lib/getScatterData.js';
	import squads1994 from '../../data/1994/squads.json';
	import squads1998 from '../../data/1998/squads.json';
	import squads2002 from '../../data/2002/squads.json';
	import squads2006 from '../../data/2006/squads.json';
	import squads2010 from '../../data/2010/squads.json';
	import squads2014 from '../../data/2014/squads.json';
	import squads2018 from '../../data/2018/squads.json';
	import squads2022 from '../../data/2022/squads.json';
	import steps from '../../data/scrolly-steps.json';

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

	// ── Scrollytelling ─────────────────────────────────────────────────────────

	let activeStep = $state(0);

	const currentScrollyStep = $derived(steps[activeStep] ?? steps[0]);
	const scrollyYear = $derived(currentScrollyStep.year);
	const scrollyNation = $derived(currentScrollyStep.nation ?? '');
	const scrollySquads = $derived(allSquads[scrollyYear]);

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
</script>

<!-- ── Scrollytelling section ────────────────────────────────────────────── -->
<section class="scrolly-outer">
	<div class="sticky-vis">
		<div class="map-container" style="position: relative;">
			<WorldMap />
			{#if scrollyNation}
				<FlowLayer squads={scrollySquads} nation={scrollyNation} />
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
			{#each steps as step, i (i)}
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

<!-- ── Interactive section ───────────────────────────────────────────────── -->
<section class="interactive-section">
	<h1>Club vs Country Statistics</h1>

	<div class="year-toggle">
		{#each years as year (year)}
			<button
				class="toggle-btn"
				class:active={selectedYear === year}
				onclick={() => { selectedYear = year; }}
			>{year}</button>
		{/each}
	</div>

	<div class="map-section">
		<div class="nation-toggle">
			{#each nations as nation (nation)}
				<button
					class="toggle-btn toggle-btn--sm"
					class:active={selectedNation === nation}
					onclick={() => { selectedNation = nation; }}
				>{nation}</button>
			{/each}
		</div>
		<div style="position: relative;">
			<WorldMap />
			<FlowLayer {squads} nation={selectedNation} />
		</div>
	</div>
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

	/* ── Interactive section ──────────────────────────────────────────────── */

	.interactive-section {
		padding: 3rem 2rem;
	}

	.year-toggle {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 1.5rem;
	}

	.nation-toggle {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}

	.toggle-btn {
		padding: 0.3rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: #fff;
		cursor: pointer;
		font-size: 0.9rem;
		color: #333;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
	}

	.toggle-btn--sm {
		padding: 0.2rem 0.5rem;
		font-size: 0.75rem;
	}

	.toggle-btn.active {
		background: #333;
		color: #fff;
		border-color: #333;
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
</style>
