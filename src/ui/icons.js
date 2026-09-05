import { s } from "./dom.js";

// Completion marks, drawn rather than sourced.
//
// The obvious route was to download Sony's platinum trophy render and Valve's
// perfect-game badge, but the only copies available are aggregator reuploads
// carrying "personal use only" terms, and both are raster art that would need
// a 4x asset to stay sharp at 22px. Inline SVG is transparent by construction,
// costs no request, scales cleanly, and sidesteps the licensing question.
//
// Both are drawn on a 24x24 grid and scale from the `size` argument.

const PLATINUM = {
  cup: "#e3e9f2",
  shade: "#aebbcd",
  rim: "#f4f7fb",
};

const PERFECT = {
  ribbon: "#3d7fc4",
  ribbonDark: "#2f6aa8",
  medal: "#f2b632",
  medalDark: "#d2941c",
};

function icon(size, title, children) {
  return s(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      role: "img",
      "aria-label": title,
      style: { display: "block", flex: "none", overflow: "visible" },
    },
    s("title", {}, title),
    children
  );
}

// A two-handled cup on a stepped plinth. The PlayStation face buttons that sit
// on the real trophy are illegible below about 40px, so they are left off
// rather than rendered as mud.
export function platinumTrophy(size = 22) {
  return icon(size, "Platinum trophy", [
    // Handles, behind the cup.
    s("path", {
      d: "M7.2 4.2H4.2v2.1a4 4 0 0 0 3.2 3.9",
      fill: "none",
      stroke: PLATINUM.shade,
      "stroke-width": 1.5,
      "stroke-linecap": "round",
    }),
    s("path", {
      d: "M16.8 4.2h3v2.1a4 4 0 0 1-3.2 3.9",
      fill: "none",
      stroke: PLATINUM.shade,
      "stroke-width": 1.5,
      "stroke-linecap": "round",
    }),
    // Cup.
    s("path", {
      d: "M6.6 2.8h10.8v5.4a5.4 5.4 0 0 1-10.8 0z",
      fill: PLATINUM.cup,
    }),
    // Highlight down the left of the bowl, which reads as metal at small size.
    s("path", {
      d: "M8.6 3.6v4.6a3.4 3.4 0 0 0 1.5 2.8",
      fill: "none",
      stroke: PLATINUM.rim,
      "stroke-width": 1.1,
      "stroke-linecap": "round",
      opacity: 0.9,
    }),
    // Stem and plinth.
    s("path", { d: "M10.9 13.4h2.2v3.1h-2.2z", fill: PLATINUM.shade }),
    s("rect", {
      x: 7.4, y: 16.4, width: 9.2, height: 2.1, rx: 0.9,
      fill: PLATINUM.cup,
    }),
    s("rect", {
      x: 6.2, y: 18.5, width: 11.6, height: 2.3, rx: 1,
      fill: PLATINUM.shade,
    }),
  ]);
}

// Valve's perfect-game mark: a gold medallion over two blue ribbon tails.
export function steamPerfect(size = 22) {
  return icon(size, "100% achievements", [
    // Ribbon tails, splayed left and right beneath the medal.
    s("path", {
      d: "M7.9 13.2 3.6 19.8l3.9-.5 1.7 3.4 3.4-5.3z",
      fill: PERFECT.ribbonDark,
    }),
    s("path", {
      d: "M16.1 13.2l4.3 6.6-3.9-.5-1.7 3.4-3.4-5.3z",
      fill: PERFECT.ribbon,
    }),
    // Medallion.
    s("circle", { cx: 12, cy: 9.4, r: 7.4, fill: PERFECT.medalDark }),
    s("circle", { cx: 12, cy: 9.4, r: 6, fill: PERFECT.medal }),
    s("circle", {
      cx: 12, cy: 9.4, r: 4.3,
      fill: "none",
      stroke: PERFECT.medalDark,
      "stroke-width": 0.9,
      opacity: 0.65,
    }),
    // Star, the "all unlocked" mark at the centre.
    s("path", {
      d: "M12 5.9l1.35 2.74 3.02.44-2.18 2.13.51 3.01L12 12.8l-2.7 1.42.51-3.01-2.18-2.13 3.02-.44z",
      fill: "#fff8e4",
    }),
  ]);
}
