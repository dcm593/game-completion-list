// Google returns colors as floats (0..1) and re-quantizes them, so a cell
// painted with the same swatch as the legend can come back a hair off.
// Everything here matches by distance, never by equality.

const DEFAULT_TOLERANCE = 0.06;

export function toRgb(color) {
  if (!color) return null;
  return {
    red: color.red ?? 0,
    green: color.green ?? 0,
    blue: color.blue ?? 0,
  };
}

export function toHex(color) {
  const rgb = toRgb(color);
  if (!rgb) return null;
  const channel = (v) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(rgb.red)}${channel(rgb.green)}${channel(rgb.blue)}`;
}

export function distance(a, b) {
  const x = toRgb(a);
  const y = toRgb(b);
  if (!x || !y) return Infinity;
  return Math.hypot(x.red - y.red, x.green - y.green, x.blue - y.blue);
}

// `swatches` is [{ label, color }]. Returns the closest label within
// tolerance, or null when nothing is close enough — an unrecognized color
// should surface as "unknown", not get snapped to the nearest platform.
export function matchSwatch(color, swatches, tolerance = DEFAULT_TOLERANCE) {
  if (!color) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const swatch of swatches) {
    const d = distance(color, swatch.color);
    if (d < bestDistance) {
      bestDistance = d;
      best = swatch;
    }
  }
  return bestDistance <= tolerance ? best.label : null;
}

export function fontColor(cell) {
  return cell?.effectiveFormat?.textFormat?.foregroundColor ?? null;
}

export function fillColor(cell) {
  return cell?.effectiveFormat?.backgroundColor ?? null;
}
