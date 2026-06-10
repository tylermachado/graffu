import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const teams = JSON.parse(
  readFileSync(join(__dirname, "../src/data/teams.json"), "utf-8")
);
const nationToConfederation = Object.fromEntries(
  teams.map((t) => [t.nation, t.confederation])
);

const years = ["1994", "1998", "2002", "2006", "2010", "2014", "2018", "2022", "2026"];

for (const year of years) {
  const squadsPath = join(__dirname, `../src/data/${year}/squads.json`);

  let squads;
  try {
    squads = JSON.parse(readFileSync(squadsPath, "utf-8"));
  } catch {
    console.log(`Skipping ${year} — no squads.json found`);
    continue;
  }

  // Track player counts and nation sets per club confederation
  const playerCounts = {};
  const nationSets = {};

  let totalPlayers = 0;
  const allNations = new Set(Object.keys(squads));

  // Count participating nations per confederation
  for (const nation of Object.keys(squads)) {
    const confed = nationToConfederation[nation] ?? "Unknown";
    if (!nationSets[confed]) nationSets[confed] = new Set();
    nationSets[confed].add(nation);
  }

  const unknownNations = new Set();

  for (const players of Object.values(squads)) {
    for (const player of players) {
      if (!player.club_nation) continue;
      const confed = nationToConfederation[player.club_nation] ?? "Unknown";
      if (confed === "Unknown") unknownNations.add(player.club_nation);
      playerCounts[confed] = (playerCounts[confed] ?? 0) + 1;
      totalPlayers++;
    }
  }

  if (unknownNations.size > 0) {
    console.warn(`  [${year}] Unknown club_nation values: ${[...unknownNations].sort().join(", ")}`);
  }

  const totalNations = allNations.size;

  const result = {};
  const allConfeds = new Set([...Object.keys(playerCounts), ...Object.keys(nationSets)]);
  for (const confed of [...allConfeds].sort()) {
    const players = playerCounts[confed] ?? 0;
    const nationSet = nationSets[confed] ?? new Set();
    const nationList = [...nationSet].sort();
    result[confed] = {
      players,
      players_pct: totalPlayers > 0 ? players / totalPlayers : 0,
      nations: nationList.length,
      nations_pct: totalNations > 0 ? nationList.length / totalNations : 0,
      nation_list: nationList,
    };
  }

  const outPath = join(__dirname, `../src/data/${year}/club-confederation.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`Wrote ${outPath}`);
}
