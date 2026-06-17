<script>
	import { LayerCake, Svg } from 'layercake';
	import WorldMap from '$lib/charts/WorldMap.svelte';
	import FlowLayer from '$lib/charts/FlowLayer.svelte';
	import StackedBar from '$lib/charts/StackedBar.svelte';
	import { MAP_WIDTH, MAP_HEIGHT, DEFAULT_MAP_SCALE, getZoomToFit } from '$lib/mapZoom.js';
	import { getSquadClubNationStats } from '$lib/getSquadClubNationStats.js';
	import { getConfederationColor } from '$lib/getConfederationColor.js';
	import { flagFor } from '$lib/nameToFlag.js';
	import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	/** @type {{ allSquads: Record<number, Record<string, Array<{ club_nation: string }>>>, years: number[] }} */
	let { allSquads, years } = $props();

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

	let selectedYear = $state(2026);
	let selectedNation = $state(Object.keys(allSquads[2026]).sort()[0]);

	const iMapScale = tweened(DEFAULT_MAP_SCALE, { duration: ZOOM_DURATION, easing: cubicInOut });
	const iMapTranslate = tweened(
		/** @type {[number, number]} */ ([MAP_WIDTH / 2, MAP_HEIGHT / 2]),
		{ duration: ZOOM_DURATION, easing: cubicInOut }
	);

	const squads = $derived(allSquads[selectedYear]);

	$effect(() => {
		const players = squads[selectedNation] ?? [];
		const target = getZoomToFit(selectedNation, players, { requirePlayers: true });
		iMapScale.set(target.scale, zoomTween());
		iMapTranslate.set(target.translate, zoomTween());
	});

	const nations = $derived(Object.keys(squads).sort());
	const squadStats = $derived(getSquadClubNationStats(squads));

	$effect(() => {
		// Reset nation when year changes if it's not available
		if (!nations.includes(selectedNation)) {
			selectedNation = nations[0];
		}
	});

	/** @param {{ start: number }} d */
	const xAccessor = (d) => d.start;
</script>

<section class="interactive-section">
	<h1 class="interactive-heading">
		<span class="heading-text">Explore the</span>
		<select class="heading-select" bind:value={selectedNation}>
			{#each nations as nation (nation)}
				<option value={nation}>{flagFor(nation)} {nation}</option>
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
					<LayerCake data={squadStats[selectedNation]} x={xAccessor} xDomain={[0, 100]}>
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

<style>
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
</style>
