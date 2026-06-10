import confederations from '../data/confederations.json';

/**
 * Creates a map of confederation names to their hex color codes
 * @type {Record<string, string>}
 */
export const CONFEDERATION_COLOR = Object.fromEntries(
	confederations.map((c) => [c.confederation, c.color])
);

/**
 * Get the color for a given confederation
 * Falls back to a default gray if confederation is not found
 * @param {string} confederationName
 * @returns {string}
 */
export function getConfederationColor(confederationName) {
	return CONFEDERATION_COLOR[confederationName] ?? '#aaa';
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
