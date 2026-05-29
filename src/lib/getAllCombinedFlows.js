import { NAME_TO_ISO } from './nameToIso.js';

/**
 * Aggregates player flows across all years and squads into unique
 * (srcNation → clubNation) pairs with a total count, tagged by the
 * source nation's confederation.
 *
 * Each player-year appearance counts as one data point; a player who
 * appeared at three tournaments contributes 3 to the count.
 *
 * @param {Record<number, Record<string, Array<{ club_nation: string }>>>} allSquads
 * @param {Record<string, string>} nationToConfederation
 * @returns {Array<{ srcNation: string; clubNation: string; srcConfederation: string; count: number }>}
 */
export function getAllCombinedFlows(allSquads, nationToConfederation) {
	/** @type {Record<string, { srcNation: string; clubNation: string; srcConfederation: string; count: number }>} */
	const pairTotals = {};

	for (const squads of Object.values(allSquads)) {
		for (const [nation, players] of Object.entries(squads)) {
			const srcConfederation = nationToConfederation[nation];
			if (!srcConfederation) continue;

			for (const player of players) {
				const clubNation = player.club_nation;
				// Only include club nations we can draw on the map
				if (!NAME_TO_ISO[clubNation]) continue;

				const key = `${nation}||${clubNation}`;
				if (!pairTotals[key]) {
					pairTotals[key] = { srcNation: nation, clubNation, srcConfederation, count: 0 };
				}
				pairTotals[key].count += 1;
			}
		}
	}

	return Object.values(pairTotals).sort((a, b) => b.count - a.count);
}
