<script>
	import { LayerCake, Svg } from 'layercake';
	import StackedBar from '$lib/charts/StackedBar.svelte';
	import ScatterDots from '$lib/charts/ScatterDots.svelte';
	import { getSquadClubNationStats } from '$lib/getSquadClubNationStats.js';
	import squads from '../data/squads.json';
	import results from '../data/results.json';
	import teams from '../data/teams.json';

	/** @param {{ start: number }} d */
	const xAccessor = (d) => d.start;

	const squadStats = getSquadClubNationStats(squads);

	// Map results.json team names → squads.json keys where they differ
	/** @type {Record<string, string>} */
	const resultToSquadName = { USA: 'United States' };

	/** @type {Record<string, string>} */
	const nationToConfederation = Object.fromEntries(teams.map((t) => [t.nation, t.confederation]));

	const scatterData = results.map((result) => {
		const squadKey = resultToSquadName[result.team] ?? result.team;
		/** @type {Record<string, Array<{club_nation: string}>>} */
		const squadsByName = /** @type {any} */ (squads);
		const players = squadsByName[squadKey] ?? [];
		const total = players.length;
		const domestic = players.filter((/** @type {{club_nation: string}} */ p) => p.club_nation === squadKey).length;
		const domesticPct = total > 0 ? (domestic / total) * 100 : 0;
		const confederation = nationToConfederation[squadKey] ?? null;
		return { team: result.team, rank: result.rank, stage: result.stage, domesticPct, confederation };
	});

	/** @param {{ rank: number }} d */
	const scatterX = (d) => d.rank;
	/** @param {{ domesticPct: number }} d */
	const scatterY = (d) => d.domesticPct;
</script>

<h1>Club vs Country Statistics</h1>

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
</style>
