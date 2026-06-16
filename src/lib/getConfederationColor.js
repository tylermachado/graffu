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

export { hexToRgba } from './color.js';
