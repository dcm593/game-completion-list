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
  "Subnautica: Below Zero": { file: "subnautica-below-zero.jpg" },
  "Horizon Forbidden West": { file: "horizon-forbidden-west.jpg" },
  "Doom Eternal (+DLCs)": { file: "doom-eternal.jpg" },
  "God of War Ragnarök: Valhalla DLC": { file: "god-of-war-ragnarok.jpg" },
  "Little Nightmares II": { file: "little-nightmares-2.jpg" },
  "Death's Door": { file: "deaths-door.jpg" },
  "Marvel's Spider-Man Remastered": { file: "marvels-spider-man.jpg" },
  "Outer Wilds (+Echos of the Eye DLC)": { file: "outer-wilds.jpg" },
  "Marvel's Spider-Man: Miles Morales": { file: "marvels-spider-man-miles-morales.jpg" },
  "Resident Evil 2 (+Extra Modes)": { file: "resident-evil-2.jpg" },
  "Luigi's Mansion 3": { file: "luigis-mansion-3.jpg" },
  "Resident Evil 3": { file: "resident-evil-3.jpg" },
  "DELTARUNE Chapter 1 & 2": { file: "deltarune.jpg" },
  "Elden Ring: Shadow of the Erdtree DLC": { file: "elden-ring-shadow-of-the-erdtree.jpg" },
  "Superhot VR": { file: "superhot.jpg" },
  "Risk of Rain 2: Seekers of the Storm DLC": { file: "risk-of-rain-2-sots.jpg" },
  "Halo 3": { file: "halo-3.jpg" },
  "Half-Life (+DLCs)": { file: "half-life.jpg" },
  "The Legend of Zelda: Tears of the Kingdom": { file: "tears-of-the-kingdom.jpg" },

  // ---------------------------------------------------------------- 2025
  "Terraria: Calamity Mod": { file: "terraria-calamity.jpg" },
  "The Binding of Isaac": { file: "the-binding-of-isaac.jpg" },
  "Unravel Two": { file: "unravel-two.jpg" },
  "Spelunky 2": { file: "spelunky-2.jpg" },
  "Remnant: From the Ashes": { file: "remnant-from-the-ashes.jpg" },
  "Hollow Knight": { file: "hollow-knight.jpg" },
  "Tunic": { file: "tunic.jpg" },
  "Half-Life 2 (+EP1 & EP2)": { file: "half-life-2.jpg" },
  "Stardew Valley": { file: "stardew-valley.jpg" },
  "DELTARUNE Chapters 3 & 4": { file: "deltarune-ch-3-4.jpg" },
  "Before Your Eyes": { file: "before-your-eyes.jpg" },
  DREDGE: { file: "dredge.jpg" },
  "Lies of P: Overture DLC": { file: "lies-of-p-overture.jpg" },
  "The Legend of Zelda: Ocarina of Time": { file: "ocarina-of-time.jpg" },
  "The Dark Pictures Anthology: Man of Medan": { file: "dark-pictures-man-of-medan.jpg" },
  "The Dark Pictures Anthology: Little Hope": { file: "dark-pictures-little-hope.jpg" },
  "Spider-Man (2000)": { file: "spider-man-2000.jpg" },
  "Ori and the Will of the Wisps": { file: "ori-and-the-will-of-the-wisps.jpg" },
  "FAITH: The Unholy Trinity": { file: "faith.jpg" },
  "Voices of the Void": { file: "voices-of-the-void.jpg" },
  "Alien: Isolation": { file: "alien-isolation.jpg" },
  "TimeSplitters: Future Perfect": { file: "timesplitters-future-perfect.jpg" },
  "Risk of Rain 2: Alloyed Collective DLC": { file: "risk-of-rain-2-alloyed-collective.jpg" },
  "Split Fiction": { file: "split-fiction.jpg" },

  // ------------------------------------------------- resolved via the API
  // A challenge mode inside Celeste, not a separate release.
  "Celeste: C Sides": { search: "Celeste" },

  // DELTARUNE ships in chapters; chapter 5 has no art of its own yet.
  "DELTARUNE Chapter 5": { search: "DELTARUNE" },

  // Spelled with "&" upstream, so searching "and" fuzzy-matches to unrelated
  // titles. Pinned by id.
  "Fear and Hunger": { id: 195 },
  "Fear and Hunger 2: Termina": { id: 5357907 },

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
