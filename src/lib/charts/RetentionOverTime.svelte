<script>
	/**
	 * Domestic retention rate by confederation, 1994–2026.
	 * Data compiled from squad files; matches the summary table in writing/outline.md.
	 */

	import { TOURNAMENT_YEARS as YEARS } from '$lib/constants.js';

	/** @type {Array<{ name: string; values: number[]; highlight: boolean; color: string }>} */
	const CONFEDERATIONS = [
		{ name: 'AFC',      values: [96, 91, 63, 65, 49, 41, 45, 58, 51], highlight: false, color: '#CC0000' },
		{ name: 'CONCACAF', values: [80, 77, 73, 59, 46, 48, 28, 50, 15], highlight: false, color: '#0000CC' },
		{ name: 'UEFA',     values: [64, 58, 50, 57, 51, 48, 33, 34, 31], highlight: false, color: '#660099' },
		{ name: 'CONMEBOL', values: [62, 42, 45, 32, 19, 17, 15, 11, 10], highlight: false, color: '#FF9900' },
		{ name: 'CAF',      values: [36, 33, 22, 20, 20, 10, 15, 12, 23], highlight: true,  color: '#009900' },
	];

	const W = 640;
	const H = 260;
	const M = { top: 16, right: 72, bottom: 36, left: 36 };
	const IW = W - M.left - M.right;
	const IH = H - M.top - M.bottom;

	const xMin = YEARS[0];
	const xMax = YEARS[YEARS.length - 1];

	/** @param {number} year */
	function x(year) {
		return ((year - xMin) / (xMax - xMin)) * IW;
	}

	/** @param {number} value */
	function y(value) {
		return IH - (value / 100) * IH;
	}

	/** @param {number[]} values */
	function points(values) {
		return YEARS.map((yr, i) => `${x(yr)},${y(values[i])}`).join(' ');
	}

	const yTicks = [0, 25, 50, 75, 100];
</script>

<figure class="retention-chart">
	<figcaption>
		<strong>Domestic retention rate by confederation, 1994–2026</strong>
		<span class="sub">Share of World Cup squad players based at clubs in their home country</span>
	</figcaption>
	<svg
		viewBox="0 0 {W} {H}"
		class="chart-svg"
		role="img"
		aria-label="Line chart showing the share of each confederation's World Cup squad players based at clubs in their home country, 1994 to 2026. Retention falls across all confederations over the period. CAF, highlighted, sits among the lowest throughout — starting at 36%, bottoming at 10% in 2014, and partially recovering to 23% by 2026."
	>
		<g transform="translate({M.left},{M.top})">
			<!-- Grid lines and Y labels -->
			{#each yTicks as tick}
				<line x1={0} y1={y(tick)} x2={IW} y2={y(tick)} class="grid-line" />
				<text x={-6} y={y(tick)} dy="0.35em" class="axis-label axis-label--y">{tick}%</text>
			{/each}

			<!-- X labels -->
			{#each YEARS as yr}
				<text x={x(yr)} y={IH + 20} class="axis-label axis-label--x axis-label--x-desktop">{yr}</text>
				<text
					x={x(yr)}
					y={IH + 20}
					class="axis-label axis-label--x axis-label--x-mobile"
					transform={`rotate(-45 ${x(yr)} ${IH + 20})`}
				>{yr}</text>
			{/each}

			<!-- Lines — draw non-highlighted first so CAF renders on top -->
			{#each CONFEDERATIONS as conf}
				{@const lx = x(YEARS[YEARS.length - 1])}
				{@const ly = y(conf.values[conf.values.length - 1])}
				<polyline
					points={points(conf.values)}
					fill="none"
					stroke={conf.color}
					stroke-width={conf.highlight ? 2.5 : 1.5}
					stroke-linejoin="round"
					stroke-linecap="round"
					opacity={conf.highlight ? 1 : 0.3}
				/>
				<circle cx={lx} cy={ly} r={conf.highlight ? 4 : 3} fill={conf.color} opacity={conf.highlight ? 1 : 0.3} />
				<text
					x={lx + 7}
					y={ly}
					dy="0.35em"
					class="conf-label"
					class:conf-label--highlight={conf.highlight}
					style:fill={conf.color}
					style:opacity={conf.highlight ? '1' : '0.35'}
				>{conf.name}</text>
			{/each}
		</g>
	</svg>
</figure>

<style>
	.retention-chart {
		width: 100%;
		margin: 0 auto 2.5rem;
		padding: 0 1.5rem;
	}

	figcaption {
		margin-bottom: 0.75rem;
	}

	figcaption strong {
		display: block;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: #111;
		margin-bottom: 0.3rem;
	}

	.sub {
		font-family: var(--font-display);
		font-size: 0.95rem;
		color: #888;
	}

	.chart-svg {
		width: 100%;
		height: auto;
		overflow: visible;
		display: block;
	}

	.grid-line {
		stroke: #e8e8e8;
		stroke-width: 1;
	}

	.axis-label {
		font-size: 14px;
		fill: #aaa;
		font-family: var(--font-display);
	}

	.axis-label--y {
		text-anchor: end;
	}

	.axis-label--x {
		text-anchor: middle;
	}

	.axis-label--x-mobile {
		display: none;
	}

	.conf-label {
		font-size: 10px;
		font-family: var(--font-display);
	}

	.conf-label--highlight {
		font-size: 11px;
		font-weight: 700;
	}

	@media (max-width: 640px) {
		/* SVG text scales with the viewBox; increase source sizes on small screens. */
		.axis-label {
			font-size: 28px;
		}

		.axis-label--x-desktop {
			display: none;
		}

		.axis-label--x-mobile {
			display: block;
			text-anchor: end;
		}

		.conf-label {
			font-size: 20px;
		}

		.conf-label--highlight {
			font-size: 22px;
		}
	}
</style>
