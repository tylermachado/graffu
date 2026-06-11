<script>
	import { feature } from 'topojson-client';
	import { geoConicConformal, geoPath, geoCentroid } from 'd3-geo';
	import { scaleSqrt } from 'd3-scale';
	import worldData from 'world-atlas/countries-110m.json';
	import { getClubNationFlows } from '$lib/getClubNationFlows.js';
	import { getNationColor, hexToRgba } from '$lib/getNationColor.js';
	import { NAME_TO_ISO } from '$lib/nameToIso.js';

	const WIDTH = 960;
	const HEIGHT = 500;

	// countries-110m omits a few small territories; provide fallback lon/lat centroids.
	/** @type {Record<string, [number, number]>} */
	const GEO_CENTROID_FALLBACKS = {
		'132': [-23.62, 15.11],
		'531': [-68.99, 12.19]
	};

	/** @type {{ squads: Record<string, Array<{ club_nation: string }>>, nation: string, scale?: number, translate?: [number, number] }} */
	let { squads, nation, scale = 153, translate = [WIDTH / 2, HEIGHT / 2] } = $props();

	// Pre-compute geographic centroids once (lon/lat, never change)
	const countries = /** @type {any} */ (feature(/** @type {any} */ (worldData), /** @type {any} */ (worldData).objects.countries));
	/** @type {Map<string, [number, number]>} */
	const geoCenterMap = new Map();
	for (const f of countries.features) {
		const c = geoCentroid(/** @type {any} */ (f));
		if (c && !isNaN(c[0]) && !isNaN(c[1])) {
			geoCenterMap.set(String(f.id), /** @type {[number, number]} */ (c));
		}
	}

	for (const [id, geo] of Object.entries(GEO_CENTROID_FALLBACKS)) {
		if (!geoCenterMap.has(id)) {
			geoCenterMap.set(id, geo);
		}
	}

	// Reactive projection — re-derived whenever scale or translate props change
	const projection = $derived(geoConicConformal().scale(scale).translate(translate));

	// Reactive screen-space centroid map — cheaply re-projected each time projection updates
	const centroidMap = $derived.by(() => {
		/** @type {Map<string, [number, number]>} */
		const m = new Map();
		for (const [id, geo] of geoCenterMap) {
			const pt = projection(geo);
			if (pt && !isNaN(pt[0])) m.set(id, /** @type {[number, number]} */ ([pt[0], pt[1]]));
		}
		return m;
	});

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

	// Nation color from teams.json
	const nationColor = $derived(getNationColor(nation));
	const nationColorRgba70 = $derived(hexToRgba(nationColor, 0.7));
	const nationColorRgba35 = $derived(hexToRgba(nationColor, 0.35));
	const nationColorRgbaStroke = $derived(hexToRgba(nationColor, 0.85));
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
		viewBox="0 0 {WIDTH} {HEIGHT}"
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
					stroke={nationColorRgba70}
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
				fill={nationColorRgba35}
				stroke={nationColorRgbaStroke}
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
		aspect-ratio: 960 / 500;
		pointer-events: none;
	}
</style>
