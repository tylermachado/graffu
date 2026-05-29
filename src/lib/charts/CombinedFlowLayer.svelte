<script>
	import { feature } from 'topojson-client';
	import { geoConicConformal, geoPath } from 'd3-geo';
	import { scaleSqrt } from 'd3-scale';
	import { SvelteMap } from 'svelte/reactivity';
	import worldData from 'world-atlas/countries-110m.json';
	import { NAME_TO_ISO } from '$lib/nameToIso.js';

	/**
	 * @type {{
	 *   flows: Array<{ srcNation: string; clubNation: string; srcConfederation: string; count: number }>
	 * }}
	 */
	let { flows } = $props();

	const width = 960;
	const height = 500;

	// Must match the projection in WorldMap.svelte exactly
	const projection = geoConicConformal().scale(153).translate([width / 2, height / 2]);
	const pathGen = geoPath(projection);

	/** @type {Record<string, string>} */
	const CONFEDERATION_COLOR = {
		UEFA: '#4a90d9',
		CAF: '#3cb371',
		CONMEBOL: '#e67e22',
		AFC: '#9b59b6',
		CONCACAF: '#e74c3c',
		OFC: '#95a5a6'
	};

	// Pre-compute projected centroids for every world-atlas feature, keyed by numeric ID string
	const countries = /** @type {any} */ (
		feature(/** @type {any} */ (worldData), /** @type {any} */ (worldData).objects.countries)
	);
	/** @type {SvelteMap<string, [number, number]>} */
	const centroidMap = new SvelteMap();
	for (const f of countries.features) {
		const c = pathGen.centroid(/** @type {any} */ (f));
		if (c && !isNaN(c[0]) && !isNaN(c[1])) {
			centroidMap.set(String(f.id), c);
		}
	}

	/** @param {string} name @returns {[number, number] | null} */
	function getCentroid(name) {
		const id = NAME_TO_ISO[name];
		return id ? (centroidMap.get(id) ?? null) : null;
	}

	/**
	 * Quadratic Bézier arc between two projected points.
	 * The control point is perpendicular to the midpoint so arcs curve
	 * and directional flows don't fully overlap.
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

	// Separate domestic (same ISO feature) and foreign flows
	const domesticFlows = $derived(
		flows.filter((f) => NAME_TO_ISO[f.srcNation] === NAME_TO_ISO[f.clubNation])
	);

	const foreignFlows = $derived(
		flows.filter(
			(f) =>
				NAME_TO_ISO[f.srcNation] !== NAME_TO_ISO[f.clubNation] &&
				getCentroid(f.srcNation) !== null &&
				getCentroid(f.clubNation) !== null
		)
	);

	const maxCount = $derived(
		foreignFlows.length > 0 ? Math.max(...foreignFlows.map((f) => f.count)) : 1
	);

	const strokeScale = $derived(scaleSqrt().domain([1, maxCount]).range([0.3, 6]).clamp(true));
</script>

<svg
	class="combined-flow-layer"
	viewBox="0 0 {width} {height}"
	preserveAspectRatio="xMidYMid meet"
	role="img"
	aria-label="Combined player club-nation flows across all World Cup tournaments 1994–2022"
>
	<!-- Foreign flows as arcs (rendered first, behind circles) -->
	{#each foreignFlows as flow (flow.srcNation + '||' + flow.clubNation)}
		{@const src = getCentroid(flow.srcNation)}
		{@const dst = getCentroid(flow.clubNation)}
		{#if src && dst}
			{@const color = CONFEDERATION_COLOR[flow.srcConfederation] ?? '#aaa'}
			<path
				d={arcPath(src, dst)}
				fill="none"
				stroke={color}
				stroke-width={strokeScale(flow.count)}
				stroke-linecap="round"
				stroke-opacity="0.25"
			/>
		{/if}
	{/each}

	<!-- Domestic retention circles (rendered on top of arcs) -->
	{#each domesticFlows as flow (flow.srcNation + '||' + flow.clubNation)}
		{@const c = getCentroid(flow.srcNation)}
		{#if c}
			{@const color = CONFEDERATION_COLOR[flow.srcConfederation] ?? '#aaa'}
			<circle
				cx={c[0]}
				cy={c[1]}
				r={Math.sqrt(flow.count) * 3.5}
				fill={color}
				fill-opacity="0.55"
				stroke={color}
				stroke-width="1.5"
				stroke-opacity="1"
			/>
		{/if}
	{/each}
</svg>

<style>
	.combined-flow-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: auto;
		pointer-events: none;
	}
</style>
