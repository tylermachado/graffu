<script>
	import { getContext } from 'svelte';

	const { xScale, yScale, width, height } = getContext('LayerCake');

	/** @type {{data: Array<{team: string, rank: number, domesticPct: number, stage: string, confederation: string|null}>}} */
	let { data } = $props();

	const yTicks = [0, 25, 50, 75, 100];
</script>

<!-- Y-axis gridlines and labels -->
<g class="y-axis">
	{#each yTicks as tick (tick)}
		<line
			class="gridline"
			x1={0}
			x2={$width}
			y1={$yScale(tick)}
			y2={$yScale(tick)}
		/>
		<text class="y-label" x={-8} y={$yScale(tick)} dy="0.35em">{tick}%</text>
	{/each}
	<text class="axis-title y-title" x={-36} y={$height / 2} transform="rotate(-90, -36, {$height / 2})">
		Domestic league %
	</text>
</g>

<!-- X-axis labels -->
<g class="x-axis">
	<line class="baseline" x1={0} x2={$width} y1={$height} y2={$height} />
	{#each [32, 24, 16, 8, 1] as tick (tick)}
		<g transform="translate({$xScale(tick)}, {$height})">
			<line y2={5} />
			<text class="x-label" y={18}>{tick}</text>
		</g>
	{/each}
	<text class="axis-title x-title" x={$width / 2} y={$height + 40}>
		World Cup ranking (32 = last, 1 = winner)
	</text>
</g>

<!-- Dots and labels -->
<g class="dots">
	{#each data as d (d.team)}
		<circle
			cx={$xScale(d.rank)}
			cy={$yScale(d.domesticPct)}
			r={5}
			class="dot {d.confederation === 'CAF' ? 'dot--africa' : ''}"
		/>
		<text
			class="dot-label"
			x={$xScale(d.rank)}
			y={$yScale(d.domesticPct) - 9}
		>{d.team}</text>
	{/each}
</g>

<style>
	.gridline {
		stroke: #e5e5e5;
		stroke-width: 1;
	}

	.baseline {
		stroke: #ccc;
		stroke-width: 1;
	}

	.y-label {
		font-size: 11px;
		fill: #666;
		text-anchor: end;
	}

	.x-label {
		font-size: 11px;
		fill: #666;
		text-anchor: middle;
	}

	.axis-title {
		font-size: 12px;
		fill: #444;
		text-anchor: middle;
	}

	.y-title {
		dominant-baseline: middle;
	}

	.dot {
		fill: #e07b39;
		fill-opacity: 0.8;
		stroke: #c05a20;
		stroke-width: 1;
	}

	.dot--africa {
		fill: #2a9d8f;
		stroke: #1a7268;
	}

	.dot-label {
		font-size: 10px;
		fill: #333;
		text-anchor: middle;
	}
</style>
