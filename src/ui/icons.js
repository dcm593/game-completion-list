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
//
// Each fills whatever box it is put in (.icon), so the size is set by the
// context - a card's medal slot, the rail, the summary strip.

export const platinumIcon = () => icon(platinumPng, "Platinum trophy");
export const perfectIcon = () => icon(steamPng, "100% achievements");

function icon(src, alt) {
  return h("img", { src, alt, decoding: "async", class: "icon" });
}
