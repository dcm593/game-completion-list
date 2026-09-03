// Turns the raw Sheets grid into flat, normalized records.
//
// This is the ONLY module that knows the spreadsheet's shape. Views consume
// the records below and never see a row, a column letter, or a color — so
// re-laying-out the sheet should touch this file and nothing else.
//
// Sheet anatomy, repeated once per year:
//
//   row 0   |   | Games I Beat in 2024 |       | PlayStation  <- legend, C..
//   row 1   |   |                      |       | Steam
//   row 2   |   |                      |       | Nintendo
//   row 3   |   |                      |       | played co-op
//   row 4   |   |                      |       | replay/played previously
//   row 5   | $$$ Paid (CAD) | Title   | Hours |
//   row 6+  | $26.79 | Subnautica...   | 14.5  | <trophy>  ...  <-- note
//   ...     | $$$ Total | Games Beat   | Total Hours (~Approx)
//           | $1,257.36 | 29           | 700.05
//           |           | Top 3
//           |           | 1. Outer Wilds
//
// Encoding that lives in formatting rather than text:
//   platform  -> font color of the Title cell, matched against the legend
//   trophy    -> in-cell image in column D, or the literal text "N/A"
//   co-op     -> couch image in column E
//   replay    -> circular-arrow image in column F
//
// Sheets returns an in-cell image as a cell whose `userEnteredValue` is an
// EMPTY object. A genuinely blank cell omits the key altogether. That is the
// only signal available: the API exposes no way to tell one in-cell image
// from another, so which icon a cell holds is inferred purely from its
// column. Keep co-op in E and replay in F.

import { fontColor, matchSwatch, toHex } from "./colors.js";

const COL = { PRICE: 0, TITLE: 1, HOURS: 2, TROPHY: 3, COOP: 4, REPLAY: 5 };
const NOTE_MARKER = "<--";

const LEGEND_PLATFORMS = [
  { label: "playstation", text: "PlayStation" },
  { label: "steam", text: "Steam" },
  { label: "nintendo", text: "Nintendo" },
];

const value = (row, i) => row?.[i]?.formattedValue?.trim() ?? "";

// ---------------------------------------------------------------- scalars

// "$26.79" -> 26.79 | "Free" -> 0 | "$1,257.36" -> 1257.36 | "" -> null
export function parsePrice(raw) {
  if (!raw) return null;
  if (/^free$/i.test(raw)) return 0;
  const n = Number(raw.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Hours are genuinely missing for some games (shared playtime, stats that
// never synced) and once literally "5?". Coercing either to 0 would quietly
// drag down every average, so absence stays absence.
export function parseHours(raw) {
  if (!raw) return { hours: null, hoursApproximate: false };
  const approximate = /[?~]/.test(raw);
  const n = Number(raw.replace(/[?~\s]/g, ""));
  return Number.isFinite(n)
    ? { hours: n, hoursApproximate: approximate }
    : { hours: null, hoursApproximate: true };
}

// ---------------------------------------------------------------- legend

// Build the platform color map from the legend cells themselves rather than
// hardcoding hexes, so recoloring the sheet can't silently mislabel games.
function readLegend(grid, blockStart) {
  const swatches = [];
  for (const [offset, platform] of LEGEND_PLATFORMS.entries()) {
    const row = grid[blockStart + offset] ?? [];
    const cell = row.find((c) => c?.formattedValue?.trim() === platform.text);
    const color = fontColor(cell);
    if (color) swatches.push({ label: platform.label, color });
  }
  return swatches;
}

// ---------------------------------------------------------------- flags

// Sheets represents an in-cell image as a present-but-empty userEnteredValue.
// A blank cell has no userEnteredValue key at all, and a text cell has a
// formattedValue — so this matches images and nothing else.
export function hasIcon(cell) {
  return (
    !!cell &&
    cell.userEnteredValue !== undefined &&
    Object.keys(cell.userEnteredValue).length === 0 &&
    !cell.formattedValue
  );
}

// Column D carries four distinct states, and collapsing any of them would
// lose meaning:
//
//   an icon      -> platinum earned / 100% swept
//   "22/30"      -> partial progress, entered by hand
//   "N/A"        -> the game has no trophy or achievement system at all
//   empty        -> has one, but the count hasn't been filled in yet
//
// "not-applicable" and "pending" both lack a number but mean opposite things,
// so the UI must be able to tell them apart.
const FRACTION = /^(\d+)\s*\/\s*(\d+)$/;

function readCompletion(row) {
  if (hasIcon(row[COL.TROPHY])) {
    return { state: "achieved", earned: null, total: null, ratio: 1 };
  }

  const raw = value(row, COL.TROPHY);
  if (raw.toUpperCase() === "N/A") {
    return { state: "not-applicable", earned: null, total: null, ratio: null };
  }

  const fraction = raw.match(FRACTION);
  if (fraction) {
    const earned = Number(fraction[1]);
    const total = Number(fraction[2]);
    // Guard against a typo'd 30/22 rather than rendering a bar past 100%.
    const ratio = total > 0 ? Math.min(1, earned / total) : null;
    return {
      state: earned >= total && total > 0 ? "achieved" : "partial",
      earned,
      total,
      ratio,
    };
  }

  return { state: "pending", earned: null, total: null, ratio: null };
}

// ---------------------------------------------------------------- notes

// The "<--" marker drifts between columns from row to row, so scan for it
// rather than trusting a fixed index.
function extractNote(row) {
  const index = row.findIndex((c) => c?.formattedValue?.trim() === NOTE_MARKER);
  if (index === -1) return { note: null };
  const rest = row
    .slice(index + 1)
    .map((c) => c?.formattedValue?.trim() ?? "")
    .filter(Boolean);
  return { note: rest.join(" ") || null };
}

// ---------------------------------------------------------------- blocks

function parseGame(row, { year, swatches }) {
  const title = value(row, COL.TITLE);
  if (!title) return null;

  const { note } = extractNote(row);

  return {
    year,
    title,
    platform: matchSwatch(fontColor(row[COL.TITLE]), swatches) ?? "unknown",
    price: parsePrice(value(row, COL.PRICE)),
    currency: "CAD",
    ...parseHours(value(row, COL.HOURS)),
    completion: readCompletion(row),
    coop: hasIcon(row[COL.COOP]),
    replay: hasIcon(row[COL.REPLAY]),
    note,
  };
}

function parseTopThree(grid, from, to) {
  const start = grid.findIndex(
    (row, i) => i >= from && i < to && value(row, COL.TITLE) === "Top 3"
  );
  if (start === -1) return [];
  return grid
    .slice(start + 1, start + 4)
    .map((row) => value(row, COL.TITLE).replace(/^\d+\.\s*/, ""))
    .filter(Boolean);
}

export function parseSheet(grid) {
  const years = [];

  for (let r = 0; r < grid.length; r += 1) {
    const match = value(grid[r], COL.TITLE).match(/^Games I Beat in (\d{4})$/);
    if (!match) continue;

    const year = Number(match[1]);
    const swatches = readLegend(grid, r);

    const headerRow = grid.findIndex(
      (row, i) => i > r && value(row, COL.PRICE) === "$$$ Paid (CAD)"
    );
    if (headerRow === -1) continue;

    let totalsHeader = grid.findIndex(
      (row, i) => i > headerRow && value(row, COL.PRICE) === "$$$ Total"
    );
    // The final year is still in progress: no totals row yet.
    const blockEnd = totalsHeader === -1 ? grid.length : totalsHeader;

    const games = [];
    for (let i = headerRow + 1; i < blockEnd; i += 1) {
      const game = parseGame(grid[i], { year, swatches });
      if (game) games.push(game);
    }

    const totalsRow = totalsHeader === -1 ? null : grid[totalsHeader + 1];
    years.push({
      year,
      games,
      // The sheet's own totals — kept separately so the parser can be checked
      // against numbers you maintain by hand.
      reported: totalsRow
        ? {
            spend: parsePrice(value(totalsRow, COL.PRICE)),
            count: Number(value(totalsRow, COL.TITLE)) || null,
            hours: Number(value(totalsRow, COL.HOURS)) || null,
          }
        : null,
      topThree: parseTopThree(grid, blockEnd, blockEnd + 8),
    });

    r = blockEnd;
  }

  return {
    years,
    games: years.flatMap((y) => y.games),
  };
}
