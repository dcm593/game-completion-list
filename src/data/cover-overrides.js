// Hand-maintained corrections for rows that don't name a standalone game.
//
// The sheet is written for a human reader, so a row can be a DLC, a chapter
// split, a mod, or a challenge mode inside a larger game. None of those have
// their own box art, and searching for them verbatim either finds nothing or
// finds the wrong thing. Each entry says what to look up instead.
//
// Three forms are accepted:
//   search: "..."   run this query instead of the row title
//   id: 1234        use this exact SteamGridDB game id (most precise)
//   file: "x.png"   use src/assets/covers/manual/x.png and skip the API
//
// Anything not listed here falls through to the automatic normalizer, which
// strips "(+DLCs)"-style parentheticals.

export const COVER_OVERRIDES = {
  // DLC and expansions: fall back to the base game's art.
  "God of War Ragnarök: Valhalla DLC": { search: "God of War Ragnarok" },
  // Hand-supplied: the DLC has its own key art, which reads better here than
  // the base game grid the search returns.
  "Elden Ring: Shadows of the Erdtree DLC": { file: "elden-ring-shadow-of-the-erdtree.jpg" },
  "Lies of P: Overture DLC": { search: "Lies of P" },
  "Risk of Rain 2: Seekers of the Storm DLC": { search: "Risk of Rain 2" },
  "Risk of Rain 2: Alloyed Collective DLC": { search: "Risk of Rain 2" },

  // A challenge mode inside Celeste, not a separate release.
  "Celeste: C Sides": { search: "Celeste" },

  // A mod. SteamGridDB does carry Calamity art, but the base game is the
  // safer match and reads correctly on a card.
  "Terraria: Calamity Mod": { search: "Terraria" },

  // DELTARUNE ships in chapters; all three rows are the same game.
  "DELTARUNE Chapter 1 & 2": { search: "DELTARUNE" },
  "DELTARUNE Chapters 3 & 4": { search: "DELTARUNE" },
  "DELTARUNE Chapter 5": { search: "DELTARUNE" },

  // The one row where the parenthetical is disambiguation rather than noise —
  // stripping it would collide with Marvel's Spider-Man. Pinned by id because
  // SteamGridDB lists four unrelated games all named exactly "Spider-Man".
  "Spider-Man (2000)": { id: 37423 },

  // Both are spelled with "&" upstream; searching "and" fuzzy-matches to
  // unrelated titles, so these are pinned by id.
  "Fear and Hunger": { id: 195 },
  "Fear and Hunger 2: Termina": { id: 5357907 },

  // Spelling in the sheet differs from the canonical title.
  "Deaths Door": { search: "Death's Door" },
  "Time Splitters: Future Perfect": { search: "TimeSplitters Future Perfect" },
  "Exit 8": { search: "The Exit 8" },
};

// "Doom Eternal (+DLCs)" -> "Doom Eternal". Deliberately does not touch a
// parenthesised year; those rows are handled by an explicit override.
export function normalizeTitle(title) {
  return title
    .replace(/\s*\(\+[^)]*\)/g, "")
    .replace(/\s*\((?!\d{4}\))[^)]*\)/g, "")
    .trim();
}

export function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
