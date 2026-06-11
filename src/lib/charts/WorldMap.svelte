<script>
	import { feature } from 'topojson-client';
	import { geoConicConformal, geoPath } from 'd3-geo';
	// @ts-ignore – world-atlas ships no types
	import worldData from 'world-atlas/countries-110m.json';

	const WIDTH = 960;
	const HEIGHT = 500;

	/** @type {{ scale?: number, translate?: [number, number] }} */
	let { scale = 153, translate = [WIDTH / 2, HEIGHT / 2] } = $props();

	const projection = $derived(geoConicConformal().scale(scale).translate(translate));
	const pathGen = $derived(geoPath(projection));

	// @ts-ignore
	const countries = /** @type {any} */ (feature(worldData, worldData.objects.countries));
</script>

<div class="map-wrap">
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" preserveAspectRatio="xMidYMid meet" class="world-svg">
		{#each countries.features as f, i (f.id ?? i)}
			<path d={pathGen(/** @type {any} */(f)) ?? ''} class="country" />
		{/each}
	</svg>
</div>

<style>
	.map-wrap {
		width: 100%;
	}

	.world-svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.country {
		fill: var(--color-cream-400);
		stroke: #fff;
		stroke-width: 0.4;
	}
</style>
