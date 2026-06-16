import teams from '../data/teams.json';

/**
 * Creates a map of nation names to their hex color codes
 * @type {Record<string, string>}
 */
export const NATION_COLOR = Object.fromEntries(
	teams.map((team) => [team.nation, team.color])
);

/**
 * Get the color for a given nation
 * Falls back to a default gray if nation is not found
 * @param {string} nationName
 * @returns {string}
 */
export function getNationColor(nationName) {
	return NATION_COLOR[nationName] ?? '#aaa';
}

export { hexToRgba } from './color.js';
