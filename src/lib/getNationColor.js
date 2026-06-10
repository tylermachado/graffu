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

/**
 * Convert a hex color to rgba with custom opacity
 * @param {string} hex
 * @param {number} alpha
 * @returns {string}
 */
export function hexToRgba(hex, alpha = 1) {
	// Remove # if present
	const color = hex.replace('#', '');
	const r = parseInt(color.substring(0, 2), 16);
	const g = parseInt(color.substring(2, 4), 16);
	const b = parseInt(color.substring(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
