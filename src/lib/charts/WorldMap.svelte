<script>
	import { feature } from 'topojson-client';
	import { geoConicConformal, geoPath } from 'd3-geo';
	// @ts-ignore – world-atlas ships no types
	import worldData from 'world-atlas/countries-110m.json';

	const width = 960;
	const height = 500;

	const projection = geoConicConformal().scale(153).translate([width / 2, height / 2]);
	const pathGen = geoPath(projection);

	// @ts-ignore
	const countries = /** @type {any} */ (feature(worldData, worldData.objects.countries));
</script>

<div class="map-wrap">
	<svg viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet" class="world-svg">
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
		fill: #d0d0d0;
		stroke: #fff;
		stroke-width: 0.4;
	}
</style>
