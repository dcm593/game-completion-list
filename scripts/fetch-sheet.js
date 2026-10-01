// Build-time sync: Sheets API -> src/data/games.json (committed).
//
//   npm run sync
//
// The site itself never talks to Google. The generated JSON is checked in, so
// the deployed page is fully static and the repo carries a git history of the
// backlog.

import { writeFile } from "node:fs/promises";
import { getSpreadsheet, toGrid } from "./lib/sheets-api.js";
import { parseSheet } from "../src/data/parse.js";

const OUT = new URL("../src/data/games.json", import.meta.url);

const data = await getSpreadsheet();
const sheet = data.sheets?.[0];
if (!sheet) throw new Error("No sheets in the API response.");

const parsed = parseSheet(toGrid(sheet));

// Free correctness check: the sheet maintains its own totals by hand, so any
// drift means the parser is dropping or misreading rows.
let drifted = false;
const unknown = [];
for (const year of parsed.years) {
  const counted = year.games.length;
  const spend = year.games.reduce((sum, g) => sum + (g.price ?? 0), 0);
  const hours = year.games.reduce((sum, g) => sum + (g.hours ?? 0), 0);
  for (const g of year.games) {
    if (g.platform === "unknown") unknown.push(`${year.year}  ${g.title}`);
  }

  console.log(`${year.year}: ${counted} games, ${hours.toFixed(2)}h, $${spend.toFixed(2)}`);

  if (!year.reported) continue;
  const off = (a, b) => a != null && b != null && Math.abs(a - b) > 0.02;
  if (off(counted, year.reported.count) || off(spend, year.reported.spend) || off(hours, year.reported.hours)) {
    drifted = true;
    console.warn(
      `  ! sheet reports ${year.reported.count} games, ` +
        `${year.reported.hours}h, $${year.reported.spend}`
    );
  }
}

// A title whose font colour matches no legend swatch has no platform to file
// it under. Writing it anyway would hand the page a platform it has no
// palette for, so stop here and say which rows need recolouring.
if (unknown.length) {
  console.error(`\n${unknown.length} title(s) match no platform colour in the legend:`);
  for (const row of unknown) console.error(`  ${row}`);
  console.error("games.json was not written. Recolour those titles to a legend swatch and re-run.");
  process.exit(1);
}

await writeFile(OUT, `${JSON.stringify(parsed, null, 2)}\n`);
const total = parsed.years.reduce((sum, y) => sum + y.games.length, 0);
console.log(`\nWrote ${total} games to src/data/games.json`);
if (drifted) console.warn("Totals drifted from the sheet — check the warnings above.");
