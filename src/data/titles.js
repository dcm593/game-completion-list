// Title string helpers shared by the page and the build scripts. Kept apart
// from cover-overrides.js so browser code doesn't pull in the scripts'
// override table just to slugify a title.

// "Doom Eternal (+DLCs)" -> "Doom Eternal". Drops every parenthetical, for
// display where the full row title is too long - the scatter's outlier key,
// the platform bands' legend - and for loose title matching.
export const shortTitle = (title) => title.split(" (")[0];

// A stricter shortTitle for search terms: drops "(+DLCs)"-style asides but
// deliberately keeps a parenthesised year; those rows are handled by an
// explicit override.
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
