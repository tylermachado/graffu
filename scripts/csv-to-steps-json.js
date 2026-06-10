#!/usr/bin/env node
// Reads src/data/scrolly-steps.csv and writes src/data/scrolly-steps.json.
// Empty "nation" cells become null.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/data');

const csv = readFileSync(join(dataDir, 'scrolly-steps.csv'), 'utf-8');

// Minimal RFC 4180-compatible CSV parser (handles quoted fields with embedded commas/newlines).
function parseCSV(raw) {
	const rows = [];
	let field = '';
	let inQuotes = false;
	let row = [];

	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i];
		const next = raw[i + 1];

		if (inQuotes) {
			if (ch === '"' && next === '"') {
				field += '"';
				i++;
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				field += ch;
			}
		} else {
			if (ch === '"') {
				inQuotes = true;
			} else if (ch === ',') {
				row.push(field);
				field = '';
			} else if (ch === '\r' && next === '\n') {
				row.push(field);
				field = '';
				rows.push(row);
				row = [];
				i++;
			} else if (ch === '\n') {
				row.push(field);
				field = '';
				rows.push(row);
				row = [];
			} else {
				field += ch;
			}
		}
	}

	// Last field/row if file doesn't end with newline
	if (field || row.length) {
		row.push(field);
		if (row.some(f => f !== '')) rows.push(row);
	}

	return rows;
}

const rows = parseCSV(csv);
const [headerRow, ...dataRows] = rows;
const headers = headerRow.map(h => h.trim());

const steps = dataRows.map(cols => {
	const obj = {};
	headers.forEach((key, i) => {
		obj[key] = cols[i] ?? '';
	});

	const rawYear = obj.year.trim();

	if (rawYear === 'intro' || rawYear === 'outro') {
		return {
			type: rawYear,
			title: obj.title.trim(),
			text: obj.text.trim().replace(/\r\n/g, '\n')
		};
	}

	return {
		year: Number(rawYear),
		nation: obj.nation.trim() === '' ? null : obj.nation.trim(),
		title: obj.title.trim(),
		text: obj.text.trim().replace(/\r\n/g, '\n')
	};
});

const json = JSON.stringify(steps, null, '\t') + '\n';
writeFileSync(join(dataDir, 'scrolly-steps.json'), json, 'utf-8');

console.log(`Wrote ${steps.length} steps to scrolly-steps.json`);
