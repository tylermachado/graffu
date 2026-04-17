<script>
	import { LayerCake, Svg } from 'layercake';
	import StackedBar from '$lib/charts/StackedBar.svelte';
	import ScatterDots from '$lib/charts/ScatterDots.svelte';
	import WorldMap from '$lib/charts/WorldMap.svelte';
	import FlowLayer from '$lib/charts/FlowLayer.svelte';
	import { getSquadClubNationStats } from '$lib/getSquadClubNationStats.js';
	import { getConfederationStats } from '$lib/getConfederationStats.js';
	import { scatterData, scatterX, scatterY } from '$lib/getScatterData.js';
	import squads from '../data/squads.json';

	/** @param {{ start: number }} d */
	const xAccessor = (d) => d.start;

	const squadStats = getSquadClubNationStats(squads);
	const confederationStats = getConfederationStats(squads);

	/** @param {{ start: number }} d */
	const confedXAccessor = (d) => d.start;
</script>

<h1>Club vs Country Statistics</h1>

<div style="position: relative;">
  <WorldMap />
  <FlowLayer {squads} nation="Australia" />
</div>

<div class="scatter-container">
	<h2>Domestic league share vs. World Cup ranking</h2>
	<LayerCake
		data={scatterData}
		x={scatterX}
		y={scatterY}
		xDomain={[32, 1]}
		yDomain={[0, 100]}
		padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
	>
		<Svg>
			<ScatterDots data={scatterData} />
		</Svg>
	</LayerCake>
</div>

<div class="confederation-section">
	<h2>Where do players play? By squad confederation</h2>
	<div class="confed-header-row">
		<div class="confed-axis-label-left">Players from</div>
		<div class="confed-axis-label-right">Play club football in →</div>
		<div></div>
	</div>
	{#each confederationStats as row (row.name)}
		<div class="confed-row">
			<div class="confed-label">
				{row.name}
				<span class="confed-arrow">→</span>
			</div>
			<div class="confed-bar-wrap">
				<LayerCake
					data={row.segments}
					x={confedXAccessor}
					xDomain={[0, 100]}
				>
					<Svg>
						<StackedBar stackedData={row.segments} />
					</Svg>
				</LayerCake>
			</div>
			<div class="confed-count">{row.totalPlayers} players</div>
		</div>
	{/each}
</div>

{#each Object.entries(squadStats).sort((a, b) => b[1][0].value - a[1][0].value) as [squadName, squadData] (squadName)}
	<div class="chart-container">
		<h2>{squadName}</h2>
		<LayerCake
			data={squadData}
			x={xAccessor}
			xDomain={[0, 100]}
		>
			<Svg>
				<StackedBar stackedData={squadData} />
			</Svg>
		</LayerCake>
	</div>
{/each}

<style>
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
		margin-bottom:1.5rem;
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
