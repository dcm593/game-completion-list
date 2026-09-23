import { h, s } from "../ui/dom.js";
import { PLAT, tint } from "../ui/theme.js";
import { attachHoverCard } from "../components/hover-card.js";

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

const geometry = () => WIDE;

const H_MIN = Math.log10(3);
const H_MAX = Math.log10(300);
const P_MIN = Math.log10(2);
const P_MAX = Math.log10(200);

// Both axes clamp to the drawn domain so a point outside it lands on the
// boundary rather than escaping the plot. Bargain-bin buys are what hit this:
// Half-Life at $1.13 and Half-Life 2 at $1.60 sit below the $2 floor, and a
// couple of very short games sit under the 3h mark. The tooltip still reports
// each point's true hours and price.
const clampHours = (v) => Math.min(300, Math.max(3, v));
const clampPrice = (v) => Math.min(200, Math.max(2, v));
const fx = (hours) => (Math.log10(clampHours(hours)) - H_MIN) / (H_MAX - H_MIN);
const fy = (price) => 1 - (Math.log10(clampPrice(price)) - P_MIN) / (P_MAX - P_MIN);

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
    for (let hours = 3; hours <= 300; hours *= 1.6) {
      const price = r * hours;
      if (price >= 2 && price <= 200) seg.push([X(hours), Y(price)]);
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
  const price = game.p === 0 ? "free" : `$${game.p.toFixed(2)}`;
  const rate = game.h && game.p > 0 ? `$${(game.p / game.h).toFixed(2)}/h` : null;

  const mark = h("div", { class: "scatter-mark", style: { "--d": `${size}px` } }, key ?? "");

  const anchor = h(
    "div",
    { class: "scatter-dot", style: { ...tint(game.pl), left: pct(atX), top: pct(atY) } },
    mark
  );

  const rows = [["HOURS", `${game.h}h`], ["PRICE", price]];
  if (rate) rows.push(["PER HOUR", rate]);

  attachHoverCard(mark, game, rows, (on) => anchor.classList.toggle("is-hot", on));

  return anchor;
}

export function scatter(games) {
  const g = geometry();
  const priced = games.filter((game) => game.h && game.p > 0);
  const free = games.filter((game) => game.h && game.p === 0);
  const unplottable = games.length - priced.length - free.length;
  const sizeFor = (game) => (7 + Math.min(13, game.h / 10)) * g.dotScale;

  const outliers = [];
  const pricedDots = priced.map((game) => {
    const rate = game.p / game.h;
    const notable = rate < 0.2 || rate > 4.5;
    let key = null;
    if (notable) {
      outliers.push({
        num: String(outliers.length + 1),
        title: game.t.split(" (")[0],
        stat: `${game.h}h - $${game.p.toFixed(2)} - $${rate.toFixed(2)}/h`,
        pl: game.pl,
      });
      key = String(outliers.length);
    }
    return dot(game, {
      size: notable ? 20 * g.dotScale : sizeFor(game),
      key,
      atX: fx(game.h),
      atY: fy(game.p),
    });
  });

  const freeDots = free.map((game) =>
    dot(game, { size: sizeFor(game), key: null, atX: fx(game.h), atY: 0.5 })
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
              { class: "outlier", style: tint(o.pl) },
              h("div", { class: "outlier-num", text: o.num }),
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
