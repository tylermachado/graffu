/**
 * Returns the club-nation flow data for a given nation's squad.
 * Each entry has the club nation name and the count of players there,
 * sorted descending by count.
 *
 * @param {Record<string, Array<{ club_nation: string }>>} squads
 * @param {string} nation
 * @returns {{ clubNation: string, count: number }[]}
 */
export function getClubNationFlows(squads, nation) {
	const players = squads[nation] ?? [];
	/** @type {Record<string, number>} */
	const counts = {};
	for (const p of players) {
		counts[p.club_nation] = (counts[p.club_nation] ?? 0) + 1;
	}
	return Object.entries(counts)
		.map(([clubNation, count]) => ({ clubNation, count }))
		.sort((a, b) => b.count - a.count);
}
