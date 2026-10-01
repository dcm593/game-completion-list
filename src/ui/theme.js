// The platform table is data rather than styling: every view looks a game's
// platform up here, and its colour reaches the stylesheet as --pc, set inline
// on whichever element that platform tints. Everything else visual lives in
// src/styles/.
//
// Keyed by the slug the parser emits for each legend swatch.

export const PLAT = {
  playstation: { name: "PlayStation", short: "PLAYSTATION", abbr: "PS", color: "oklch(0.66 0.16 254)" },
  steam: { name: "Steam", short: "STEAM", abbr: "S", color: "oklch(0.72 0.03 240)" },
  nintendo: { name: "Nintendo", short: "NINTENDO", abbr: "N", color: "oklch(0.63 0.20 25)" },
};

// A record whose title colour matched no legend swatch. The sync refuses to
// write one, so this only catches a hand-edited games.json - but a missing
// palette entry would otherwise throw mid-render and blank the whole page.
const UNKNOWN = { name: "Unknown", short: "UNKNOWN", abbr: "?", color: "oklch(0.6 0 0)" };

export const platformOf = (slug) => PLAT[slug] ?? UNKNOWN;

// The order platforms are listed in the rail, summary and hour bands.
export const ORDER = ["nintendo", "playstation", "steam"];

// Filter chips. These follow the original mockup's order rather than ORDER;
// use ["all", ...ORDER] if they should match the rest of the page.
export const CHIPS = ["all", "playstation", "steam", "nintendo"];
export const chipLabel = (chip) => (chip === "all" ? "All" : PLAT[chip].name);

// Sets a platform's colour on an element for the stylesheet to tint with.
export const tint = (slug) => ({ "--pc": platformOf(slug).color });
