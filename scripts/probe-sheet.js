// Answers the one open question: do the trophy / co-op / replay images come
// back from the API at all?
//
//   npm run probe -- 18 22 30 33
//
// Prints every field of every cell in the given 1-based sheet rows, unmasked.
// Pick rows whose flags you know by eye (row 18 Borderlands 3 has trophy +
// couch + replay; row 30 Super Mario 64 has replay alone) and compare.
//
// If the images are in-cell, they surface here as a cell value or formula and
// the parser can key on them. If these rows come back with empty cells that
// carry only a background color, the images are over-cell drawings, the REST
// API will never expose them, and we fall back to adding plain columns to the
// sheet for co-op and replay.

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
