// Design tokens lifted from the Claude Design mockup, kept in one place so a
// color change never has to be chased through the view modules.

export const PLAT = {
  PlayStation: { c: "oklch(0.66 0.16 254)", short: "PLAYSTATION", abbr: "PS" },
  Steam: { c: "oklch(0.72 0.03 240)", short: "STEAM", abbr: "S" },
  Nintendo: { c: "oklch(0.63 0.20 25)", short: "NINTENDO", abbr: "N" },
};

export const ORDER = ["Nintendo", "PlayStation", "Steam"];
export const MEDAL = ["oklch(0.80 0.13 85)", "oklch(0.80 0.02 260)", "oklch(0.68 0.10 55)"];
export const CHIPS = ["All", "PlayStation", "Steam", "Nintendo"];

export const MONO = "'JetBrains Mono', monospace";
export const SANS = "'Space Grotesk', sans-serif";

export const INK = "#e9e7e4";
export const dim = (a) => `rgba(233,231,228,${a})`;
export const line = (a) => `rgba(255,255,255,${a})`;

// oklch(...) -> oklch(... / .16). The design does this with a string replace
// on the closing paren; keeping it as a helper makes the intent obvious.
export const alpha = (color, a) => color.replace(")", ` / ${a})`);

export const GOOD = "oklch(0.78 0.13 168)";
export const WARN = "oklch(0.72 0.15 25)";

export function badge(c) {
  return {
    font: `700 8.5px/1 ${MONO}`,
    letterSpacing: ".1em",
    padding: "4px 6px",
    borderRadius: "4px",
    color: c,
    background: alpha(c, ".16"),
    border: `1px solid ${alpha(c, ".35")}`,
    backdropFilter: "blur(4px)",
  };
}

export function chipStyle(active) {
  return {
    font: `500 11.5px/1 ${MONO}`,
    letterSpacing: ".06em",
    padding: "8px 13px",
    borderRadius: "999px",
    cursor: "pointer",
    border: `1px solid ${line(active ? ".28" : ".1")}`,
    background: active ? line(".1") : "transparent",
    color: active ? "#f4f2ef" : dim(".55"),
  };
}

export function tagStyle(done) {
  const c = done ? "oklch(0.75 0.13 168)" : "oklch(0.78 0.13 85)";
  return {
    font: `500 9px/1 ${MONO}`,
    letterSpacing: ".11em",
    textTransform: "uppercase",
    padding: "4px 7px",
    borderRadius: "4px",
    color: c,
    background: alpha(c, ".14"),
    border: `1px solid ${alpha(c, ".3")}`,
  };
}

export const label = (extra = {}) => ({
  font: `500 9px/1 ${MONO}`,
  letterSpacing: ".14em",
  color: dim(".3"),
  ...extra,
});
