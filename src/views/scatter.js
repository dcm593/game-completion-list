import { h, s } from "../ui/dom.js";
import { tint } from "../ui/theme.js";
import {
  formatHours, formatPrice, formatRate, costPerHour, RATE_BARGAIN, RATE_STEEP,
} from "../ui/format.js";
import { shortTitle } from "../data/titles.js";
import { attachHoverCard } from "../components/hover-card.js";
import { isNarrow } from "../ui/media.js";

// Plot geometry, in viewBox units. The dot overlays are positioned in
// percentages derived from these numbers rather than hardcoded, so the grid
// and the dots cannot drift apart when the box changes.
const WIDE = {
  W: 1000,
  H: 546,
  L: 74,
  R: 34,
  T: 22,
  PLOT_H: 406,
  LANE_Y: 478,
  LANE_H: 46,
  Y_TITLE_X: 18,
  hourTicks: [5, 10, 30, 60, 120, 250],
  dotScale: 1,
};

// Portrait layout for phones. The wide box squeezed into a ~350px column
// draws its 11-unit labels at under 4px; a viewBox about as wide as the
// screen keeps them near their true size, and the extra height keeps the
// points from crowding. One fewer hour tick, since the labels would touch.
const NARROW = {
  W: 380,
  H: 478,
  L: 58,
  R: 14,
  T: 16,
  PLOT_H: 360,
  LANE_Y: 410,
  LANE_H: 40,
  Y_TITLE_X: 12,
  hourTicks: [5, 10, 30, 100, 250],
  dotScale: 0.8,
};

const geometry = () => (isNarrow() ? NARROW : WIDE);

// The drawn domain of each log axis.
const HOURS = { min: 3, max: 300 };
const PRICE = { min: 2, max: 200 };

// Both axes clamp to the drawn domain so a point outside it lands on the
// boundary rather than escaping the plot. Bargain-bin buys are what hit this:
// Half-Life at $1.13 and Half-Life 2 at $1.60 sit below the $2 floor, and a
// couple of very short games sit under the 3h mark. The tooltip still reports
// each point's true hours and price.
const clamp = (v, range) => Math.min(range.max, Math.max(range.min, v));

// Position along an axis, 0..1, on a log scale.
const along = (v, range) =>
  (Math.log10(clamp(v, range)) - Math.log10(range.min)) /
  (Math.log10(range.max) - Math.log10(range.min));

const fx = (hours) => along(hours, HOURS);
const fy = (price) => 1 - along(price, PRICE);

const pct = (n) => `${n * 100}%`;

function grid(g, freeCount) {
  const PW = g.W - g.L - g.R;
  const X = (hours) => g.L + fx(hours) * PW;
  const Y = (price) => g.T + fy(price) * g.PLOT_H;
  const kids = [];

  kids.push(s("rect", { class: "plot-frame", x: g.L, y: g.T, width: PW, height: g.PLOT_H, rx: 6 }));

  for (const hours of g.hourTicks) {
    kids.push(s("line", { class: "plot-grid", x1: X(hours), y1: g.T, x2: X(hours), y2: g.T + g.PLOT_H }));
    kids.push(
      s("text", {
        class: "plot-tick", x: X(hours), y: g.T + g.PLOT_H + 22, "text-anchor": "middle",
      }, `${hours}h`)
    );
  }

  for (const price of [3, 10, 30, 100]) {
    kids.push(s("line", { class: "plot-grid", x1: g.L, y1: Y(price), x2: g.L + PW, y2: Y(price) }));
    kids.push(
      s("text", {
        class: "plot-tick", x: g.L - 12, y: Y(price) + 4, "text-anchor": "end",
      }, `$${price}`)
    );
  }

  // Constant cost-per-hour diagonals.
  const RATES = [
    { r: 0.05, l: "5c/h" },
    { r: 0.5, l: "50c/h" },
    { r: 5, l: "$5/h" },
  ];
  for (const { r, l } of RATES) {
    const seg = [];
    for (let hours = HOURS.min; hours <= HOURS.max; hours *= 1.6) {
      const price = r * hours;
      if (price >= PRICE.min && price <= PRICE.max) seg.push([X(hours), Y(price)]);
    }
    if (seg.length < 2) continue;
    const [x1, y1] = seg[0];
    const [x2, y2] = seg[seg.length - 1];
    kids.push(s("line", { class: "plot-rate", x1, y1, x2, y2 }));
    kids.push(
      s("text", { class: "plot-rate-label", x: x2 - 6, y: y2 - 8, "text-anchor": "end" }, l)
    );
  }

  // Free games have no price, and a log axis has no room for zero - so they
  // get their own lane rather than being dropped from the view entirely.
  if (freeCount) {
    kids.push(
      s("rect", { class: "plot-lane", x: g.L, y: g.LANE_Y, width: PW, height: g.LANE_H, rx: 6 })
    );
    kids.push(
      s("text", {
        class: "plot-lane-label", x: g.L - 12, y: g.LANE_Y + g.LANE_H / 2 + 4, "text-anchor": "end",
      }, "free")
    );
  }

  kids.push(s("text", { class: "plot-axis", x: g.L, y: g.H - 8 }, "HOURS PLAYED"));
  const mid = (g.T + g.PLOT_H) / 2;
  kids.push(
    s("text", {
      class: "plot-axis", x: g.Y_TITLE_X, y: mid, "text-anchor": "middle",
      transform: `rotate(-90 ${g.Y_TITLE_X} ${mid})`,
    }, "PRICE PAID")
  );

  return s("svg", { viewBox: `0 0 ${g.W} ${g.H}` }, kids);
}

function dot(game, { size, key, atX, atY }) {
  const rate = costPerHour(game);

  const mark = h("div", { class: "scatter-mark", style: { "--dot-size": `${size}px` } }, key ?? "");

  const anchor = h(
    "div",
    { class: "scatter-dot", style: { ...tint(game.platform), left: pct(atX), top: pct(atY) } },
    mark
  );

  const rows = [["HOURS", formatHours(game.hours)], ["PRICE", formatPrice(game.price)]];
  if (rate != null) rows.push(["PER HOUR", formatRate(rate)]);

  attachHoverCard(mark, game, rows, (on) => anchor.classList.toggle("is-hot", on));

  return anchor;
}

export function scatter(games) {
  const g = geometry();
  const priced = games.filter((game) => game.hours && game.price > 0);
  const free = games.filter((game) => game.hours && game.price === 0);
  const unplottable = games.length - priced.length - free.length;
  const sizeFor = (game) => (7 + Math.min(13, game.hours / 10)) * g.dotScale;

  const outliers = [];
  const pricedDots = priced.map((game) => {
    const rate = costPerHour(game);
    const notable = rate < RATE_BARGAIN || rate > RATE_STEEP;
    let key = null;
    if (notable) {
      key = String(outliers.length + 1);
      outliers.push({
        key,
        title: shortTitle(game.title),
        stat: `${formatHours(game.hours)} - ${formatPrice(game.price)} - ${formatRate(rate)}`,
        platform: game.platform,
      });
    }
    return dot(game, {
      size: notable ? 20 * g.dotScale : sizeFor(game),
      key,
      atX: fx(game.hours),
      atY: fy(game.price),
    });
  });

  const freeDots = free.map((game) =>
    dot(game, { size: sizeFor(game), key: null, atX: fx(game.hours), atY: 0.5 })
  );

  const missing = unplottable
    ? ` ${unplottable} game${unplottable > 1 ? "s" : ""} with no recorded hours cannot be placed.`
    : "";

  return h(
    "div",
    { class: "chart" },
    h(
      "div",
      { class: "chart-intro" },
      h("div", { class: "chart-title", text: "Hours vs. price" }),
      h("div", {
        class: "chart-desc",
        text:
          "Log-log. Dashed diagonals are constant cost-per-hour; numbered points are the best and worst value of the year. " +
          "Free games sit in their own lane, since a log axis has no zero." +
          missing,
      })
    ),

    h(
      "div",
      { class: "scatter-plot", style: { aspectRatio: `${g.W} / ${g.H}` } },
      grid(g, free.length),
      // Priced dots, aligned to the plot box.
      h("div", {
        class: "scatter-layer",
        style: {
          left: pct(g.L / g.W), right: pct(g.R / g.W),
          top: pct(g.T / g.H), bottom: pct((g.H - g.T - g.PLOT_H) / g.H),
        },
      }, pricedDots),
      // Free lane dots, aligned to the lane box.
      h("div", {
        class: "scatter-layer",
        style: {
          left: pct(g.L / g.W), right: pct(g.R / g.W),
          top: pct(g.LANE_Y / g.H), height: pct(g.LANE_H / g.H),
        },
      }, freeDots)
    ),

    outliers.length
      ? h(
          "div",
          { class: "outliers" },
          outliers.map((o) =>
            h(
              "div",
              { class: "outlier", style: tint(o.platform) },
              h("div", { class: "outlier-num", text: o.key }),
              h(
                "div",
                { class: "outlier-text" },
                h("div", { class: "outlier-title", text: o.title }),
                h("div", { class: "outlier-stat", text: o.stat })
              )
            )
          )
        )
      : null
  );
}
