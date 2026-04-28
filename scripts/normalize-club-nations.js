#!/usr/bin/env node
/**
 * Normalizes club_nation values in a squads JSON file so they are always
 * the country name (not adjective form or abbreviation).
 *
 * Usage:
 *   node scripts/normalize-club-nations.js src/data/2018/squads.json
 *   node scripts/normalize-club-nations.js src/data/2018/squads.json --dry-run
 *   node scripts/normalize-club-nations.js --all   (processes every squads.json)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Adjective / abbreviation / odd form  →  canonical nation name
const NORMALIZE = {
  "Argentine": "Argentina",
  "Austrian": "Austria",
  "Brazilian Confederation": "Brazil",
  "Bulgarian": "Bulgaria",
  "Canadian": "Canada",
  "China PR": "China",
  "Chinese": "China",
  "Colombian": "Colombia",
  "Costa Rican": "Costa Rica",
  "Croatian": "Croatia",
  "Danish": "Denmark",
  "Dutch": "Netherlands",
  "Egyptian": "Egypt",
  "Federal Republic Yugoslavia": "Yugoslavia",
  "French": "France",
  "German": "Germany",
  "Guinean": "Guinea",
  "Hellenic": "Greece",
  "Islamic Republic Iran": "Iran",
  "Italian": "Italy",
  "Korea": "South Korea",
  "Mexican": "Mexico",
  "Moroccan": "Morocco",
  "National Autonomous Honduras": "Honduras",
  "National Guatemala": "Guatemala",
  "Norwegian": "Norway",
  "Panamanian": "Panama",
  "Paraguayan": "Paraguay",
  "Peruvian": "Peru",
  "Polish": "Poland",
  "Portuguese": "Portugal",
  "Romanian": "Romania",
  "Russian": "Russia",
  "Saudi Arabian": "Saudi Arabia",
  "Scottish": "Scotland",
  "Slovak": "Slovakia",
  "South African": "South Africa",
  "Spanish": "Spain",
  "Swedish": "Sweden",
  "Swiss": "Switzerland",
  "Tunisian": "Tunisia",
  "Turkish": "Turkey",
  "Ukrainian": "Ukraine",
  "Uruguayan": "Uruguay",
  "USA": "United States",
};

function processFile(filePath, dryRun) {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, "utf-8");
  const data = JSON.parse(raw);

  const changes = [];

  for (const [nation, players] of Object.entries(data)) {
    for (const player of players) {
      const original = player.club_nation;
      const normalized = NORMALIZE[original];
      if (normalized) {
        changes.push({
          nation,
          player: player.name,
          club: player.club,
          from: original,
          to: normalized,
        });
        if (!dryRun) player.club_nation = normalized;
      }
    }
  }

  if (changes.length === 0) {
    console.log(`${filePath}: already clean, no changes needed.`);
    return;
  }

  console.log(`\n${filePath}: ${changes.length} change(s)${dryRun ? " (dry run)" : ""}:`);
  for (const c of changes) {
    console.log(`  [${c.nation}] ${c.player} (${c.club}): "${c.from}" → "${c.to}"`);
  }

  if (!dryRun) {
    fs.writeFileSync(abs, JSON.stringify(data, null, 2));
    console.log(`  Saved.`);
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const all = args.includes("--all");
const files = args.filter((a) => !a.startsWith("--"));

if (all) {
  const dataDir = path.resolve(__dirname, "../src/data");
  const squadsFiles = fs
    .readdirSync(dataDir)
    .flatMap((year) => {
      const f = path.join(dataDir, year, "squads.json");
      return fs.existsSync(f) ? [f] : [];
    });
  for (const f of squadsFiles) processFile(f, dryRun);
} else if (files.length > 0) {
  for (const f of files) processFile(f, dryRun);
} else {
  console.error("Usage:");
  console.error("  node scripts/normalize-club-nations.js <file> [--dry-run]");
  console.error("  node scripts/normalize-club-nations.js --all [--dry-run]");
  process.exit(1);
}
