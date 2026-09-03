// Maps the normalized records from parse.js onto the shape the view modules
// expect. Keeping this separate means the views never learn how the
// spreadsheet is organized, and re-syncing can't ripple into layout code.

import games from "./games.json";

// The design keys its palette off display names; the parser emits slugs.
const PLATFORM_NAME = {
  playstation: "PlayStation",
  steam: "Steam",
  nintendo: "Nintendo",
};

// A finished game reads differently per platform: PlayStation earns a
// platinum, Steam a 100% achievement sweep. Nintendo has neither, so those
// titles always land on "not-applicable" and never reach this branch.
function completionFlags(game) {
  const done = game.completion.state === "achieved";
  return {
    plat: done && game.platform === "playstation",
    hundred: done && game.platform !== "playstation",
  };
}

export function toDesignGame(game) {
  const { state, earned, total, ratio } = game.completion;
  return {
    y: game.year,
    t: game.title,
    p: game.price,
    h: game.hours,
    pl: PLATFORM_NAME[game.platform],
    coop: game.coop,
    replay: game.replay,
    note: game.note,
    ...completionFlags(game),
    // null means "no bar to draw", but for two opposite reasons — the game
    // has no achievement system, or nobody has filled the number in yet.
    // pctState keeps them distinguishable at render time.
    pct: ratio == null ? null : Math.round(ratio * 100),
    pctState: state,
    // Shown alongside the percentage: "36/51" is more informative than 71%.
    pctDetail: earned != null && total != null ? `${earned}/${total}` : null,
  };
}

export const GAMES = games.games.map(toDesignGame);

export const YEARS = games.years.map((y) => {
  const hours = y.games.reduce((sum, g) => sum + (g.hours ?? 0), 0);
  const spend = y.games.reduce((sum, g) => sum + (g.price ?? 0), 0);
  return {
    year: y.year,
    // The final year has no totals row in the sheet because it isn't over.
    tag: y.reported ? "complete" : "in progress",
    games: y.games.length,
    hours: Math.round(hours),
    spend: Math.round(spend),
    hoursLabel: Math.round(hours).toLocaleString(),
    spendLabel: `$${Math.round(spend).toLocaleString()}`,
  };
});

// The Top 3 lists are typed by hand and don't always match a row verbatim —
// "Outer Wilds" vs "Outer Wilds (+Echos of the Eye DLC)". The podium looks the
// game up to borrow its platform and stats, so an unresolved title would blow
// up on a missing palette entry. Fall back through progressively looser
// matches, then degrade to a title-only entry rather than throwing.
function resolveTitle(title, yearGames) {
  const bare = (t) => t.split(" (")[0].trim().toLowerCase();
  const wanted = title.trim().toLowerCase();
  return (
    yearGames.find((g) => g.title.trim().toLowerCase() === wanted) ??
    yearGames.find((g) => bare(g.title) === bare(title)) ??
    yearGames.find((g) => bare(g.title).startsWith(bare(title))) ??
    null
  );
}

export const TOP3 = Object.fromEntries(
  games.years.map((y) => [
    y.year,
    y.topThree.length
      ? y.topThree.map((title) => {
          const match = resolveTitle(title, y.games);
          // Stats come from the matched row, but the label stays exactly as
          // written in the sheet's Top 3 block.
          return match
            ? { ...toDesignGame(match), t: title }
            : { t: title, pl: "Steam", h: null, p: null, unresolved: true };
        })
      : // A year still in progress has no Top 3 yet.
        [0, 1, 2].map(() => ({
          t: "Awaiting your pick",
          pl: "Steam",
          h: null,
          p: null,
          placeholder: true,
        })),
  ])
);
