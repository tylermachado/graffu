/**
 * Generates src/data/squad-club-nations.json — a slimmed projection of the raw
 * per-year squad files containing only the one field the site actually uses
 * (`club_nation`). The full squad records carry 8 fields per player (~1.3MB
 * total); the visuals only ever read `player.club_nation` and `players.length`,
 * so shipping the rest to the browser is pure waste.
 *
 * Re-run after editing any data/<year>/squads.json:  npm run slim-data
 *
 * Output shape: { [year]: { [nation]: Array<{ club_nation: string }> } }
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/data');

// Keep in sync with src/lib/constants.js (TOURNAMENT_YEARS).
const YEARS = [1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026];

/** @type {Record<number, Record<string, Array<{ club_nation: string }>>>} */
const out = {};

for (const year of YEARS) {
	const raw = JSON.parse(readFileSync(resolve(DATA_DIR, `${year}/squads.json`), 'utf8'));
	/** @type {Record<string, Array<{ club_nation: string }>>} */
	const slimYear = {};
	for (const [nation, players] of Object.entries(raw)) {
		slimYear[nation] = players.map((p) => ({ club_nation: p.club_nation }));
	}
	out[year] = slimYear;
}

const outPath = resolve(DATA_DIR, 'squad-club-nations.json');
writeFileSync(outPath, JSON.stringify(out));
console.log(`Wrote ${outPath}`);
