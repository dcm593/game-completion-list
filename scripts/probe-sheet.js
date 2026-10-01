// Dumps the raw, unmasked API response for chosen sheet rows.
//
//   npm run probe -- 18 22 30 33
//
// Prints every field of every cell in the given 1-based rows, A through J.
// The sync asks the API for only the handful of fields the parser reads
// (scripts/lib/sheets-api.js); this asks for everything, which is how to work
// out how the sheet encodes something new before teaching parse.js about it.
// That is how the in-cell images were found to arrive as an empty
// userEnteredValue - see the notes at the top of src/data/parse.js.

import { getSpreadsheet } from "./lib/sheets-api.js";

const rows = process.argv.slice(2).map(Number).filter(Number.isFinite);
if (rows.length === 0) {
  console.error("usage: npm run probe -- <row> [<row> ...]   (1-based)");
  process.exit(1);
}

const ranges = rows.map((r) => `Sheet1!A${r}:J${r}`);
const data = await getSpreadsheet({ ranges, fields: null });

data.sheets?.[0]?.data?.forEach((range, i) => {
  console.log(`\n=== row ${rows[i]} ===`);
  const cells = range.rowData?.[0]?.values ?? [];
  cells.forEach((cell, col) => {
    const letter = String.fromCharCode(65 + col);
    const keys = Object.keys(cell);
    if (keys.length === 0) {
      console.log(`  ${letter}: (completely empty)`);
      return;
    }
    console.log(`  ${letter}: ${JSON.stringify(cell, null, 2).replace(/\n/g, "\n  ")}`);
  });
});
