<script>
	import { feature } from 'topojson-client';
	import { geoConicConformal, geoPath } from 'd3-geo';
	import { scaleSqrt } from 'd3-scale';
	import { SvelteMap } from 'svelte/reactivity';
	import worldData from 'world-atlas/countries-110m.json';
	import { getClubNationFlows } from '$lib/getClubNationFlows.js';

	/** @type {{ squads: Record<string, Array<{ club_nation: string }>>, nation: string }} */
	let { squads, nation } = $props();

	const width = 960;
	const height = 500;

	// Must match the projection used in WorldMap.svelte exactly
	const projection = geoConicConformal().scale(153).translate([width / 2, height / 2]);
	const pathGen = geoPath(projection);

	/**
	 * Maps squad/club-nation names (as used in squads.json) to ISO 3166-1 numeric codes,
	 * which are the feature IDs in world-atlas/countries-110m.json.
	 * England, Scotland, and Wales all share the United Kingdom code (826).
	 * Historical entities (FR Yugoslavia, Serbia and Montenegro) map to Serbia (688).
	 * @type {Record<string, string>}
	 */
	const NAME_TO_ISO = {
		Algeria: '012',
		Angola: '024',
		Argentina: '032',
		Australia: '036',
		Austria: '040',
		Belgium: '056',
		Bolivia: '068',
		'Bosnia and Herzegovina': '070',
		Brazil: '076',
		Bulgaria: '100',
		Cameroon: '120',
		Canada: '124',
		Chile: '152',
		China: '156',
		'China PR': '156',
		Colombia: '170',
		'Costa Rica': '188',
		Croatia: '191',
		'Czech Republic': '203',
		Cyprus: '196',
		Denmark: '208',
		Ecuador: '218',
		Egypt: '818',
		England: '826',
		France: '250',
		'FR Yugoslavia': '688',
		Germany: '276',
		Ghana: '288',
		Greece: '300',
		Honduras: '340',
		Hungary: '348',
		Iceland: '352',
		Iran: '364',
		Ireland: '372',
		Israel: '376',
		'Ivory Coast': '384',
		Italy: '380',
		Jamaica: '388',
		Japan: '392',
		'South Korea': '410',
		Kuwait: '414',
		Mexico: '484',
		Morocco: '504',
		Netherlands: '528',
		'New Zealand': '554',
		Nigeria: '566',
		'North Korea': '408',
		Norway: '578',
		Panama: '591',
		Paraguay: '600',
		Peru: '604',
		Poland: '616',
		Portugal: '620',
		Qatar: '634',
		'Republic of Ireland': '372',
		Romania: '642',
		Russia: '643',
		'Saudi Arabia': '682',
		Scotland: '826',
		Senegal: '686',
		Serbia: '688',
		'Serbia and Montenegro': '688',
		Slovakia: '703',
		Slovenia: '705',
		'South Africa': '710',
		Spain: '724',
		Sweden: '752',
		Switzerland: '756',
		Togo: '768',
		'Trinidad and Tobago': '780',
		Tunisia: '788',
		Turkey: '792',
		Ukraine: '804',
		'United Arab Emirates': '784',
		'United Kingdom': '826',
		'United States': '840',
		Uruguay: '858',
		Wales: '826',
		Yugoslavia: '688'
	};

	// Pre-compute projected centroids for every world-atlas feature, keyed by numeric ID string
	const countries = /** @type {any} */ (feature(/** @type {any} */ (worldData), /** @type {any} */ (worldData).objects.countries));
	/** @type {SvelteMap<string, [number, number]>} */
	const centroidMap = new SvelteMap();
	for (const f of countries.features) {
		const c = pathGen.centroid(/** @type {any} */ (f));
		if (c && !isNaN(c[0]) && !isNaN(c[1])) {
			centroidMap.set(String(f.id), c);
		}
	}

	/** @param {string} name @returns {string | undefined} */
	function isoId(name) {
		return NAME_TO_ISO[name];
	}

	/** @param {string} name @returns {[number, number] | null} */
	function getCentroid(name) {
		const id = isoId(name);
		return id ? (centroidMap.get(id) ?? null) : null;
	}

	/**
	 * Builds a quadratic Bézier arc path between two projected points.
	 * The control point is offset perpendicularly from the midpoint so lines
	 * curve and don't overlap in both directions.
	 * @param {[number, number]} src
	 * @param {[number, number]} dst
	 * @returns {string}
	 */
	function arcPath(src, dst) {
		const mx = (src[0] + dst[0]) / 2;
		const my = (src[1] + dst[1]) / 2;
		const dx = dst[0] - src[0];
		const dy = dst[1] - src[1];
		const len = Math.sqrt(dx * dx + dy * dy);
		if (len === 0) return '';
		const off = len * 0.2;
		const cx = mx - (dy / len) * off;
		const cy = my + (dx / len) * off;
		return `M${src[0]},${src[1]} Q${cx},${cy} ${dst[0]},${dst[1]}`;
	}

	// ── Reactive derived data ─────────────────────────────────────────────────

	const flows = $derived(getClubNationFlows(squads, nation));
	const srcId = $derived(isoId(nation));
	const srcCentroid = $derived(getCentroid(nation));

	// Players whose club nation maps to the same world-atlas feature as the squad
	// (e.g. England/Scotland/Wales all share ISO 826)
	const domesticCount = $derived(
		flows
			.filter((f) => isoId(f.clubNation) === srcId)
			.reduce((sum, f) => sum + f.count, 0)
	);

	// Flows to genuinely foreign countries (different ISO feature, known centroid)
	const foreignFlows = $derived(
		flows.filter((f) => isoId(f.clubNation) !== srcId && getCentroid(f.clubNation) !== null)
	);

	const maxCount = $derived(
		foreignFlows.length > 0 ? Math.max(...foreignFlows.map((f) => f.count)) : 1
	);

	// Stroke width: sqrt-scaled so thin flows stay visible but thick ones stand out
	const strokeScale = $derived(scaleSqrt().domain([1, maxCount]).range([1, 8]).clamp(true));
</script>

<!--
  Overlay this SVG directly over <WorldMap /> by wrapping both in a container:

    <div style="position: relative;">
      <WorldMap />
      <FlowLayer {squads} {nation} />
    </div>
-->
{#if srcCentroid}
	<svg
		class="flow-layer"
		viewBox="0 0 {width} {height}"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="Player club-nation flows for {nation}"
	>
		<!-- Lines from squad nation to each foreign club nation -->
		{#each foreignFlows as flow (flow.clubNation)}
			{@const dst = getCentroid(flow.clubNation)}
			{#if dst}
				<path
					d={arcPath(srcCentroid, dst)}
					fill="none"
					stroke="rgba(220, 60, 60, 0.7)"
					stroke-width={strokeScale(flow.count)}
					stroke-linecap="round"
				/>
			{/if}
		{/each}

		<!-- Circle representing players whose club is in the same country -->
		{#if domesticCount > 0}
			<circle
				cx={srcCentroid[0]}
				cy={srcCentroid[1]}
				r={Math.sqrt(domesticCount) * 3}
				fill="rgba(220, 60, 60, 0.35)"
				stroke="rgba(180, 30, 30, 0.85)"
				stroke-width="1.5"
			/>
		{/if}
	</svg>
{/if}

<style>
	.flow-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: auto;
		pointer-events: none;
	}
</style>
