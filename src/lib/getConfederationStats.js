import teams from '../data/2022/teams.json';

/** @type {Record<string, string>} */
const nationToConfederation = Object.fromEntries(teams.map((t) => [t.nation, t.confederation]));

const CONFEDERATIONS = ['UEFA', 'CAF', 'CONMEBOL', 'AFC', 'CONCACAF', 'OFC'];

/**
 * For each national-team confederation, compute the breakdown of where
 * players ply their club trade (by club confederation).
 *
 * @param {Record<string, Array<{ club_nation: string }>>} squads
 * @returns {Array<{ name: string; totalPlayers: number; segments: Array<{ label: string; value: number; percentage: number; start: number; end: number; index: number; confederation: string }> }>}
 */
export function getConfederationStats(squads) {
	/** @type {Record<string, Record<string, number>>} */
	const squadConfedTotals = {};

	for (const [squadName, players] of Object.entries(squads)) {
		const squadConfed = nationToConfederation[squadName];
		if (!squadConfed) continue;

		if (!squadConfedTotals[squadConfed]) {
			squadConfedTotals[squadConfed] = {};
		}

		for (const player of players) {
			const clubConfed = nationToConfederation[player.club_nation] ?? 'Unknown';
			squadConfedTotals[squadConfed][clubConfed] =
				(squadConfedTotals[squadConfed][clubConfed] ?? 0) + 1;
		}
	}

	return CONFEDERATIONS.filter((c) => squadConfedTotals[c]).map((squadConfed) => {
		const clubConfedCounts = squadConfedTotals[squadConfed];
		const totalPlayers = Object.values(clubConfedCounts).reduce((s, n) => s + n, 0);

		// Sort segments: same confederation first, then by count descending
		const sorted = Object.entries(clubConfedCounts).sort((a, b) => {
			if (a[0] === squadConfed) return -1;
			if (b[0] === squadConfed) return 1;
			return b[1] - a[1];
		});

		let cursor = 0;
		const segments = sorted.map(([clubConfed, count], index) => {
			const percentage = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;
			const start = cursor;
			const end = cursor + percentage;
			cursor = end;
			return {
				label: clubConfed,
				value: count,
				percentage,
				start,
				end,
				index,
				confederation: clubConfed
			};
		});

		return { name: squadConfed, totalPlayers, segments };
	});
}
