// Corrections to how a sheet row resolves to cover art.
//
// Two kinds of entry live here. Most are hand-picked art: a file dropped into
// src/assets/covers/manual/ that reads better than anything the API returns.
// The rest are rows that don't name a standalone game — a DLC, a chapter
// split, a mod, or a challenge mode inside a larger game — where searching the
// row title verbatim finds nothing or finds the wrong thing.
//
// Three forms are accepted:
//   file: "x.png"   use src/assets/covers/manual/x.png and skip the API
//   id: 1234        use this exact SteamGridDB game id (most precise)
//   search: "..."   run this query instead of the row title
//
// Keys must match the sheet title exactly. Anything not listed falls through
// to the automatic normalizer, which strips "(+DLCs)"-style parentheticals.
//
// `npm run covers` validates every `file` entry: a missing or undecodable
// image is an error, and an extension that disagrees with the file's contents
// is reported.

export const COVER_OVERRIDES = {
  // ---------------------------------------------------------------- 2024
  "Subnautica: Below Zero": { file: "subnautica-below-zero.webp" },
  "Horizon Forbidden West": { file: "horizon-forbidden-west.webp" },
  "Doom Eternal (+DLCs)": { file: "doom-eternal.webp" },
  "God of War Ragnarök: Valhalla DLC": { file: "god-of-war-ragnarok.webp" },
  "Little Nightmares II": { file: "little-nightmares-2.webp" },
  "Death's Door": { file: "deaths-door.webp" },
  "Marvel's Spider-Man Remastered": { file: "marvels-spider-man.webp" },
  "Outer Wilds (+Echos of the Eye DLC)": { file: "outer-wilds.webp" },
  "Marvel's Spider-Man: Miles Morales": { file: "marvels-spider-man-miles-morales.webp" },
  "Resident Evil 2 (+Extra Modes)": { file: "resident-evil-2.webp" },
  "Luigi's Mansion 3": { file: "luigis-mansion-3.webp" },
  "Resident Evil 3": { file: "resident-evil-3.webp" },
  "DELTARUNE Chapter 1 & 2": { file: "deltarune.webp" },
  "Elden Ring: Shadow of the Erdtree DLC": { file: "elden-ring-shadow-of-the-erdtree.webp" },
  "Superhot VR": { file: "superhot.webp" },
  "Risk of Rain 2: Seekers of the Storm DLC": { file: "risk-of-rain-2-sots.webp" },
  "Halo 3": { file: "halo-3.webp" },
  "Half-Life (+DLCs)": { file: "half-life.webp" },
  "The Legend of Zelda: Tears of the Kingdom": { file: "tears-of-the-kingdom.webp" },

  // ---------------------------------------------------------------- 2025
  "Terraria: Calamity Mod": { file: "terraria-calamity.webp" },
  "The Binding of Isaac": { file: "the-binding-of-isaac.webp" },
  "Unravel Two": { file: "unravel-two.webp" },
  "Spelunky 2": { file: "spelunky-2.webp" },
  "Remnant: From the Ashes": { file: "remnant-from-the-ashes.webp" },
  "Hollow Knight": { file: "hollow-knight.webp" },
  "Tunic": { file: "tunic.webp" },
  "Half-Life 2 (+EP1 & EP2)": { file: "half-life-2.webp" },
  "Stardew Valley": { file: "stardew-valley.webp" },
  "DELTARUNE Chapters 3 & 4": { file: "deltarune-ch-3-4.webp" },
  "Before Your Eyes": { file: "before-your-eyes.webp" },
  DREDGE: { file: "dredge.webp" },
  "Lies of P: Overture DLC": { file: "lies-of-p-overture.webp" },
  "The Legend of Zelda: Ocarina of Time": { file: "ocarina-of-time.webp" },
  "The Dark Pictures Anthology: Man of Medan": { file: "dark-pictures-man-of-medan.webp" },
  "The Dark Pictures Anthology: Little Hope": { file: "dark-pictures-little-hope.webp" },
  "Spider-Man (2000)": { file: "spider-man-2000.webp" },
  "Ori and the Will of the Wisps": { file: "ori-and-the-will-of-the-wisps.webp" },
  "FAITH: The Unholy Trinity": { file: "faith.webp" },
  "Voices of the Void": { file: "voices-of-the-void.webp" },
  "Alien: Isolation": { file: "alien-isolation.webp" },
  "TimeSplitters: Future Perfect": { file: "timesplitters-future-perfect.webp" },
  "Risk of Rain 2: Alloyed Collective DLC": { file: "risk-of-rain-2-alloyed-collective.webp" },
  "Split Fiction": { file: "split-fiction.webp" },

  // ---------------------------------------------------------------- 2026
  "Fear & Hunger": { file: "fear-and-hunger.webp" },
  "Iron Lung": { file: "iron-lung.webp" },
  "Marvel's Spider-Man 2": { file: "marvels-spider-man-2.webp" },
  "Fallout: New Vegas": { file: "fallout-new-vegas.webp" },
  "Another Crab's Treasure": { file: "another-crabs-treasure.webp" },
  "Slay the Spire 2": { file: "slay-the-spire-2.webp" },
  "Tiny Tina's Wonderlands": { file: "wonderlands.webp" },
  "DELTARUNE Chapter 5": { file: "deltarune-ch-5.webp" },
  Hades: { file: "hades.webp" },
  "The Dark Pictures Anthology: House of Ashes": { file: "dark-pictures-house-of-ashes.webp" },

  // ------------------------------------------------- resolved via the API
  // A challenge mode inside Celeste, not a separate release.
  "Celeste: C Sides": { search: "Celeste" },

  // Spelled with "&" upstream, so searching "and" fuzzy-matches to an
  // unrelated title. Pinned by id.
  "Fear & Hunger 2: Termina": { id: 5357907 },

  // Canonical title differs from the sheet's.
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
