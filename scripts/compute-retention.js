import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  const retention = {};

  for (const [nation, players] of Object.entries(squads)) {
    const total = players.length;
    const domestic = players.filter((p) => p.club_nation === nation).length;
    retention[nation] = {
      total,
      domestic,
      rate: total > 0 ? domestic / total : 0,
    };
  }

  const outPath = join(__dirname, `../src/data/${year}/retention.json`);
  writeFileSync(outPath, JSON.stringify(retention, null, 2));
  console.log(`Wrote ${outPath}`);
}
