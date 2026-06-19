import { feature } from 'topojson-client';
import { geoConicConformal } from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';
import { NAME_TO_ISO } from './nameToIso.js';

/** Projection viewport dimensions shared by the story maps. */
export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 500;

/** Scale of the default (un-zoomed) world view. */
export const DEFAULT_MAP_SCALE = 153;

// Feature lookup, built once at module load (the topology never changes).
// @ts-expect-error – world-atlas ships no types
const _zoomCountries = /** @type {any} */ (feature(worldData, worldData.objects.countries));
/** @type {Map<string, any>} */
const _featureById = new Map(
	_zoomCountries.features.map(/** @param {any} f */ (f) => [String(f.id), f])
);

/**
 * Returns the scale and translate needed to show `nationName` and all its club-nation
 * destinations centered in the viewport. Falls back to the default world view when no
 * nation is active — or, when `requirePlayers` is set, when the nation has no players.
 *
 * `fitWidth` (SVG coordinate units) and `centerX` (SVG x coordinate) control where the
 * bounding box lands. On mobile, pass the actual visible SVG width and x=480 (center).
 * On desktop, shift right by using centerX=640 with fitWidth=640 (right two-thirds).
 * @param {string} nationName
 * @param {Array<{ club_nation: string }>} players
 * @param {{ requirePlayers?: boolean, fitWidth?: number, centerX?: number }} [options]
 * @returns {{ scale: number, translate: [number, number] }}
 */
export function getZoomToFit(nationName, players = [], { requirePlayers = false, fitWidth = MAP_WIDTH, centerX = MAP_WIDTH / 2 } = {}) {
	const DEFAULT_TRANSLATE = /** @type {[number, number]} */ ([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
	if (!nationName || (requirePlayers && !players?.length)) {
		return { scale: DEFAULT_MAP_SCALE, translate: DEFAULT_TRANSLATE };
	}

	const names = new Set([nationName]);
	for (const p of players) {
		if (p.club_nation) names.add(p.club_nation);
	}

	const features = [];
	for (const name of names) {
		const id = NAME_TO_ISO[name];
		if (!id) continue;
		const f = _featureById.get(id);
		if (f) features.push(f);
	}

	if (!features.length) return { scale: DEFAULT_MAP_SCALE, translate: DEFAULT_TRANSLATE };

	// Clamp halfFitWidth so the extent stays within [0, MAP_WIDTH].
	const halfFitWidth = Math.min(fitWidth / 2, centerX, MAP_WIDTH - centerX);
	const collection = { type: 'FeatureCollection', features };
	const proj = geoConicConformal().fitExtent(
		[
			[centerX - halfFitWidth, 0],
			[centerX + halfFitWidth, MAP_HEIGHT]
		],
		/** @type {any} */ (collection)
	);
	const targetScale = proj.scale() * 0.97;
	const targetTranslate = /** @type {[number, number]} */ (proj.translate());
	return { scale: targetScale, translate: targetTranslate };
}
