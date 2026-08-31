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
for (const year of parsed.years) {
  const counted = year.games.length;
  const spend = year.games.reduce((sum, g) => sum + (g.price ?? 0), 0);
  const hours = year.games.reduce((sum, g) => sum + (g.hours ?? 0), 0);
  const unknown = year.games.filter((g) => g.platform === "unknown").length;

  console.log(
    `${year.year}: ${counted} games, ${hours.toFixed(2)}h, $${spend.toFixed(2)}` +
      (unknown ? `  [${unknown} unknown platform]` : "")
  );

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

await writeFile(OUT, `${JSON.stringify(parsed, null, 2)}\n`);
console.log(`\nWrote ${parsed.games.length} games to src/data/games.json`);
if (drifted) console.warn("Totals drifted from the sheet — check the warnings above.");
