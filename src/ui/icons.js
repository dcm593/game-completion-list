import { h } from "./dom.js";
import platinumPng from "../assets/icons/platinum-trophy.png";
import steamPng from "../assets/icons/steam-100.png";

// Completion marks, lifted from the spreadsheet's own in-cell images. Sheets
// does not expose those through the REST API, but an .xlsx export is a zip and
// they sit in xl/media/; xl/drawings/drawing1.xml maps each to the legend row
// that gives it meaning.
//
// Both are downscaled to a 96px longest edge by scripts/downscale-png.js -
// 3x the size they are drawn at, so they stay sharp on any display without
// carrying the ~812KB the originals cost.

export const platinumIcon = (size) => icon(platinumPng, "Platinum trophy", size);
export const perfectIcon = (size) => icon(steamPng, "100% achievements", size);

// The trophy is portrait and the badge square, so "contain" keeps each at its
// own proportions inside the square slot rather than distorting either.
function icon(src, alt, size) {
  return h("img", {
    src,
    alt,
    decoding: "async",
    style: {
      width: `${size}px`,
      height: `${size}px`,
      objectFit: "contain",
      display: "block",
      flex: "none",
    },
  });
}
