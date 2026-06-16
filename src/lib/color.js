/**
 * Convert a hex color to rgba with custom opacity.
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
