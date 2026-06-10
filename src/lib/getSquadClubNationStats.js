import teams from '../data/teams.json';

/** @param {Record<string, Array<{ club_nation: string }>>} squads */
export function getSquadClubNationStats(squads) {
	// Create a map of nation to confederation
	const nationToConfederation = Object.fromEntries(
		teams.map((team) => [team.nation, team.confederation])
	);

	// Get the confederation of the squad
	const getSquadConfederation = (squadName) => nationToConfederation[squadName];

	return Object.fromEntries(
		Object.entries(squads).map(([squad, players]) => {
			/** @type {Record<string, number>} */
			const counts = {};
			for (const player of players) {
				counts[player.club_nation] = (counts[player.club_nation] ?? 0) + 1;
			}
			const total = players.length;
			const squadConfederation = getSquadConfederation(squad);
			let cursor = 0;
			const entries = Object.entries(counts).map(([club_nation, count]) => ({
					label: club_nation,
					value: count,
					club_nation,
					count,
					proportion: total > 0 ? count / total : 0,
					percentage: total > 0 ? (count / total) * 100 : 0,
					confederation: nationToConfederation[club_nation],
				}));

			// Pre-compute max value per non-squad confederation so they sort as groups
			/** @type {Record<string, number>} */
			const confedMaxValue = {};
			for (const entry of entries) {
				if (entry.confederation !== squadConfederation) {
					confedMaxValue[entry.confederation] = Math.max(
						confedMaxValue[entry.confederation] ?? 0,
						entry.count
					);
				}
			}

			const stats = entries
				.sort((a, b) => {
					// 1. club_nation matching the squad name comes first
					if (a.club_nation === squad) return -1;
					if (b.club_nation === squad) return 1;

					// 2. Other club_nations in the squad's confederation, ordered by value
					const aMatchesConfed = a.confederation === squadConfederation;
					const bMatchesConfed = b.confederation === squadConfederation;
					if (aMatchesConfed && !bMatchesConfed) return -1;
					if (!aMatchesConfed && bMatchesConfed) return 1;

					// 3. Within the same confederation, order by value descending
					if (a.confederation === b.confederation) return b.count - a.count;

					// 4. Across different non-squad confederations, keep confederations grouped
					//    by ordering each confederation by its highest value
					return (confedMaxValue[b.confederation] ?? 0) - (confedMaxValue[a.confederation] ?? 0);
				})
				.map((item, index) => {
					const start = cursor;
					const end = cursor + item.percentage;
					cursor = end;
					return {
						...item,
						start,
						end,
						index
					};
				});
			return [squad, stats];
		})
	);
}
