import squads from '../data/2022/squads.json';
import results from '../data/2022/results.json';
import teams from '../data/2022/teams.json';

/** @type {Record<string, string>} */
const resultToSquadName = { USA: 'United States' };

/** @type {Record<string, string>} */
const nationToConfederation = Object.fromEntries(teams.map((t) => [t.nation, t.confederation]));

export const scatterData = results.map((result) => {
	const squadKey = resultToSquadName[result.team] ?? result.team;
	/** @type {Record<string, Array<{club_nation: string}>>} */
	const squadsByName = /** @type {any} */ (squads);
	const players = squadsByName[squadKey] ?? [];
	const total = players.length;
	const domestic = players.filter((/** @type {{club_nation: string}} */ p) => p.club_nation === squadKey).length;
	const domesticPct = total > 0 ? (domestic / total) * 100 : 0;
	const confederation = nationToConfederation[squadKey] ?? null;
	return { team: result.team, rank: result.rank, stage: result.stage, domesticPct, confederation };
});

/** @param {{ rank: number }} d */
export const scatterX = (d) => d.rank;

/** @param {{ domesticPct: number }} d */
export const scatterY = (d) => d.domesticPct;
