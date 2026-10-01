// Maps the normalized records from parse.js onto the shape the views use, and
// works out everything about them that never changes after load - per-year
// lists and totals, platform counts, the podiums. Keeping this separate means
// the views never learn how the spreadsheet is organized, and re-syncing
// can't ripple into layout code.

import data from "./games.json";
import { coverFor } from "./covers.js";
import { shortTitle } from "./titles.js";

// A finished game reads differently per platform: PlayStation earns a
// platinum, Steam a 100% achievement sweep. Nintendo has neither, so those
// titles always land on "not-applicable" and never reach this branch.
function completionOf(game) {
  const { state, earned, total, ratio } = game.completion;
  const done = state === "achieved";
  return {
    platinum: done && game.platform === "playstation",
    fullClear: done && game.platform !== "playstation",
    completion: {
      // null means "no bar to draw", but for two opposite reasons - the game
      // has no achievement system, or nobody has filled the number in yet.
      // `state` keeps them distinguishable at render time.
      percent: ratio == null ? null : Math.round(ratio * 100),
      state,
      // Shown alongside the percentage: "36/51" says more than 71%.
      detail: earned != null && total != null ? `${earned}/${total}` : null,
    },
  };
}

// games.json stores each game under its year rather than repeating the year
// on every record, so the year is passed in.
function toGame(game, year) {
  return {
    year,
    title: game.title,
    platform: game.platform,
    price: game.price,
    hours: game.hours,
    coop: game.coop,
    replay: game.replay,
    note: game.note,
    art: coverFor(game.title),
    ...completionOf(game),
  };
}

// A podium entry with nothing behind it: a title the Top 3 names but no row
// matches, or a slot in a year too early to have a Top 3.
const stub = (title, extra = {}) => ({ title, platform: "steam", hours: null, price: null, ...extra });

// The Top 3 lists are typed by hand and don't always match a row verbatim -
// "Outer Wilds" vs "Outer Wilds (+Echos of the Eye DLC)". The podium borrows
// the matched game's platform and stats, so fall back through progressively
// looser matches, then degrade to a title-only entry rather than throwing.
function resolveTitle(title, games) {
  const bare = (t) => shortTitle(t).trim().toLowerCase();
  const wanted = title.trim().toLowerCase();
  return (
    games.find((g) => g.title.trim().toLowerCase() === wanted) ??
    games.find((g) => bare(g.title) === bare(title)) ??
    games.find((g) => bare(g.title).startsWith(bare(title))) ??
    null
  );
}

function topThree(titles, games) {
  // A year still in progress has no Top 3 yet.
  if (!titles.length) return [0, 1, 2].map(() => stub("To be determined", { placeholder: true }));
  return titles.map((title) => {
    const match = resolveTitle(title, games);
    // Stats come from the matched row, but the label stays exactly as written
    // in the sheet's Top 3 block.
    return match ? { ...match, title } : stub(title);
  });
}

const sum = (list, key) => list.reduce((total, item) => total + (item[key] ?? 0), 0);

export const YEARS = data.years.map((y) => {
  const games = y.games.map((g) => toGame(g, y.year));
  const hours = Math.round(sum(games, "hours"));
  const spend = Math.round(sum(games, "price"));
  return {
    year: y.year,
    // The final year has no totals row in the sheet because it isn't over.
    tag: y.reported ? "complete" : "in progress",
    games,
    count: games.length,
    hours,
    spend,
    hoursLabel: hours.toLocaleString(),
    spendLabel: `$${spend.toLocaleString()}`,
    top3: topThree(y.topThree, games),
  };
});

export const GAMES = YEARS.flatMap((y) => y.games);

// All-time figures for the header, summed from the per-year rounded values
// so the header always agrees with the year headings.
export const TOTALS = {
  games: sum(YEARS, "count"),
  hours: sum(YEARS, "hours"),
  spend: sum(YEARS, "spend"),
};

const countBy = (key) =>
  GAMES.reduce((counts, g) => ({ ...counts, [g[key]]: (counts[g[key]] ?? 0) + 1 }), {});

// Games per platform slug (read with `?? 0`), and completion marks earned.
export const COUNTS = {
  platform: countBy("platform"),
  platinum: GAMES.filter((g) => g.platinum).length,
  fullClear: GAMES.filter((g) => g.fullClear).length,
};
