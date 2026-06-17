/**
 * Maps squad/club-nation names (as used in squads.json) to flag emoji.
 *
 * Most flags are regional-indicator pairs derived from the ISO 3166-1 alpha-2
 * code. A few entries need special handling:
 *   - England, Scotland, Wales use Unicode subdivision tag sequences, not
 *     regional-indicator pairs (they all share the UK in the geo map).
 *   - Historical entities (FR Yugoslavia, Serbia and Montenegro) map to Serbia,
 *     matching the NAME_TO_ISO convention.
 *
 * @type {Record<string, string>}
 */
export const NAME_TO_FLAG = {
	Algeria: '🇩🇿',
	Angola: '🇦🇴',
	Argentina: '🇦🇷',
	Australia: '🇦🇺',
	Austria: '🇦🇹',
	Belgium: '🇧🇪',
	Bolivia: '🇧🇴',
	'Bosnia and Herzegovina': '🇧🇦',
	Brazil: '🇧🇷',
	Bulgaria: '🇧🇬',
	Cameroon: '🇨🇲',
	Canada: '🇨🇦',
	'Cape Verde': '🇨🇻',
	Chile: '🇨🇱',
	'China PR': '🇨🇳',
	Colombia: '🇨🇴',
	'Costa Rica': '🇨🇷',
	Croatia: '🇭🇷',
	Curaçao: '🇨🇼',
	Czechia: '🇨🇿',
	"Côte d'Ivoire": '🇨🇮',
	'DR Congo': '🇨🇩',
	Denmark: '🇩🇰',
	Ecuador: '🇪🇨',
	Egypt: '🇪🇬',
	England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
	'FR Yugoslavia': '🇷🇸',
	France: '🇫🇷',
	Germany: '🇩🇪',
	Ghana: '🇬🇭',
	Greece: '🇬🇷',
	Haiti: '🇭🇹',
	Honduras: '🇭🇳',
	Iceland: '🇮🇸',
	Iran: '🇮🇷',
	Iraq: '🇮🇶',
	Italy: '🇮🇹',
	Jamaica: '🇯🇲',
	Japan: '🇯🇵',
	Jordan: '🇯🇴',
	'Korea DPR': '🇰🇵',
	Mexico: '🇲🇽',
	Morocco: '🇲🇦',
	Netherlands: '🇳🇱',
	'New Zealand': '🇳🇿',
	Nigeria: '🇳🇬',
	Norway: '🇳🇴',
	Panama: '🇵🇦',
	Paraguay: '🇵🇾',
	Peru: '🇵🇪',
	Poland: '🇵🇱',
	Portugal: '🇵🇹',
	Qatar: '🇶🇦',
	'Republic of Ireland': '🇮🇪',
	Romania: '🇷🇴',
	Russia: '🇷🇺',
	'Saudi Arabia': '🇸🇦',
	Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
	Senegal: '🇸🇳',
	Serbia: '🇷🇸',
	'Serbia and Montenegro': '🇷🇸',
	Slovakia: '🇸🇰',
	Slovenia: '🇸🇮',
	'South Africa': '🇿🇦',
	'South Korea': '🇰🇷',
	Spain: '🇪🇸',
	Sweden: '🇸🇪',
	Switzerland: '🇨🇭',
	Togo: '🇹🇬',
	'Trinidad and Tobago': '🇹🇹',
	Tunisia: '🇹🇳',
	Turkey: '🇹🇷',
	Ukraine: '🇺🇦',
	'United States': '🇺🇸',
	Uruguay: '🇺🇾',
	Uzbekistan: '🇺🇿',
	Wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿'
};

/**
 * Returns the flag emoji for a nation name, or an empty string if unmapped.
 * @param {string} name
 * @returns {string}
 */
export function flagFor(name) {
	return NAME_TO_FLAG[name] ?? '';
}
