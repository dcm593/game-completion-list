// The platform table is data rather than styling: every view looks a game's
// platform up here, and its colour reaches the stylesheet as --pc, set inline
// on whichever element that platform tints. Everything else visual lives in
// src/styles/.

export const PLAT = {
  PlayStation: { c: "oklch(0.66 0.16 254)", short: "PLAYSTATION", abbr: "PS" },
  Steam: { c: "oklch(0.72 0.03 240)", short: "STEAM", abbr: "S" },
  Nintendo: { c: "oklch(0.63 0.20 25)", short: "NINTENDO", abbr: "N" },
};

export const ORDER = ["Nintendo", "PlayStation", "Steam"];
export const CHIPS = ["All", "PlayStation", "Steam", "Nintendo"];

// Sets a platform's colour on an element for the stylesheet to tint with.
export const tint = (platform) => ({ "--pc": PLAT[platform].c });
