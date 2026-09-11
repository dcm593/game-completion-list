import { h, s } from "../ui/dom.js";
import { PLAT, MONO, SANS, INK, dim, line, alpha } from "../ui/theme.js";
import { attachHoverCard } from "../components/hover-card.js";

// Plot geometry. The dot overlays are positioned in percentages derived from
// these numbers rather than hardcoded, so the grid and the dots cannot drift
// apart when the box changes.
const W = 1000;
const L = 74;
const R = 34;
const T = 22;
const PLOT_H = 406;
const LANE_Y = 478;
const LANE_H = 46;
const H = 546;
const PW = W - L - R;

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
const X = (hours) => L + fx(hours) * PW;
const Y = (price) => T + fy(price) * PLOT_H;

const pct = (n) => `${n * 100}%`;

function grid(freeCount) {
  const kids = [];

  kids.push(
    s("rect", {
      x: L, y: T, width: PW, height: PLOT_H,
      fill: line(".015"), stroke: line(".08"), rx: 6,
    })
  );

  for (const hours of [5, 10, 30, 60, 120, 250]) {
    kids.push(s("line", { x1: X(hours), y1: T, x2: X(hours), y2: T + PLOT_H, stroke: line(".05") }));
    kids.push(
      s("text", {
        x: X(hours), y: T + PLOT_H + 22, fill: dim(".4"),
        "font-size": 11, "text-anchor": "middle", "font-family": MONO,
      }, `${hours}h`)
    );
  }

  for (const price of [3, 10, 30, 100]) {
    kids.push(s("line", { x1: L, y1: Y(price), x2: L + PW, y2: Y(price), stroke: line(".05") }));
    kids.push(
      s("text", {
        x: L - 12, y: Y(price) + 4, fill: dim(".4"),
        "font-size": 11, "text-anchor": "end", "font-family": MONO,
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
    kids.push(
      s("line", {
        x1, y1, x2, y2,
        stroke: "oklch(0.70 0.13 254 / .35)", "stroke-width": 1, "stroke-dasharray": "5 5",
      })
    );
    kids.push(
      s("text", {
        x: x2 - 6, y: y2 - 8, fill: "oklch(0.72 0.10 254)",
        "font-size": 10.5, "text-anchor": "end", "font-family": MONO, "letter-spacing": ".06em",
      }, l)
    );
  }

  // Free games have no price, and a log axis has no room for zero - so they
  // get their own lane rather than being dropped from the view entirely.
  if (freeCount) {
    kids.push(
      s("rect", {
        x: L, y: LANE_Y, width: PW, height: LANE_H,
        fill: "oklch(0.75 0.13 168 / .05)",
        stroke: "oklch(0.75 0.13 168 / .28)",
        "stroke-dasharray": "4 4", rx: 6,
      })
    );
    kids.push(
      s("text", {
        x: L - 12, y: LANE_Y + LANE_H / 2 + 4, fill: "oklch(0.78 0.13 168)",
        "font-size": 11, "text-anchor": "end", "font-family": MONO, "letter-spacing": ".06em",
      }, "free")
    );
  }

  kids.push(
    s("text", {
      x: L, y: H - 8, fill: dim(".32"),
      "font-size": 10, "font-family": MONO, "letter-spacing": ".12em",
    }, "HOURS PLAYED")
  );
  kids.push(
    s("text", {
      x: 18, y: (T + PLOT_H) / 2, fill: dim(".32"),
      "font-size": 10, "font-family": MONO, "letter-spacing": ".12em",
      "text-anchor": "middle", transform: `rotate(-90 18 ${(T + PLOT_H) / 2})`,
    }, "PRICE PAID")
  );

  return s("svg", {
    viewBox: `0 0 ${W} ${H}`,
    style: { position: "absolute", inset: 0, width: "100%", height: "100%" },
  }, kids);
}

// The dot is drawn inside a zero-size anchor so the plot coordinate stays the
// dot's centre whatever its radius; the translate(-50%,-50%) keeps it there,
// and the hover scale composes onto that same transform.
const CENTRE = "translate(-50%,-50%)";
const HOVER_SCALE = 1.35;

function dot(game, { radius, key, atX, atY }) {
  const col = PLAT[game.pl].c;
  const price = game.p === 0 ? "free" : `$${game.p.toFixed(2)}`;
  const rate = game.h && game.p > 0 ? `$${(game.p / game.h).toFixed(2)}/h` : null;

  const mark = h("div", {
    style: {
      position: "absolute", left: 0, top: 0, transform: CENTRE,
      width: `${radius}px`, height: `${radius}px`, borderRadius: "99px",
      background: alpha(col, ".35"), border: `1.5px solid ${col}`,
      boxShadow: `0 0 16px ${alpha(col, ".45")}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      font: `700 10px/1 ${MONO}`, color: "#f2efea",
      cursor: "default",
      transition: "transform .13s ease, box-shadow .13s ease",
    },
  }, key ?? "");

  const anchor = h(
    "div",
    { style: { position: "absolute", left: pct(atX), top: pct(atY), width: 0, height: 0 } },
    mark
  );

  const rows = [["HOURS", `${game.h}h`], ["PRICE", price]];
  if (rate) rows.push(["PER HOUR", rate]);

  attachHoverCard(mark, game, rows, (on) => {
    mark.style.transform = on ? `${CENTRE} scale(${HOVER_SCALE})` : CENTRE;
    mark.style.boxShadow = on
      ? `0 0 22px ${alpha(col, ".75")}`
      : `0 0 16px ${alpha(col, ".45")}`;
    // Lift the hovered dot above its neighbours; the plot is dense enough that
    // a scaled dot would otherwise grow underneath the ones drawn after it.
    anchor.style.zIndex = on ? "5" : "";
  });

  return anchor;
}

export function scatter(games) {
  const priced = games.filter((g) => g.h && g.p > 0);
  const free = games.filter((g) => g.h && g.p === 0);
  const unplottable = games.length - priced.length - free.length;

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
        col: PLAT[game.pl].c,
      });
      key = String(outliers.length);
    }
    return dot(game, {
      radius: notable ? 20 : 7 + Math.min(13, game.h / 10),
      key,
      atX: fx(game.h),
      atY: fy(game.p),
    });
  });

  const freeDots = free.map((game) =>
    dot(game, { radius: 7 + Math.min(13, game.h / 10), key: null, atX: fx(game.h), atY: 0.5 })
  );

  const missing = unplottable
    ? ` ${unplottable} game${unplottable > 1 ? "s" : ""} with no recorded hours cannot be placed.`
    : "";

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "6px" } },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "5px" } },
      h("div", { style: { fontSize: "15px", fontWeight: 600 }, text: "Hours vs. price" }),
      h("div", {
        style: { fontSize: "12.5px", color: dim(".5"), maxWidth: "480px", lineHeight: 1.5 },
        text:
          "Log-log. Dashed diagonals are constant cost-per-hour; numbered points are the best and worst value of the year. " +
          "Free games sit in their own lane, since a log axis has no zero." +
          missing,
      })
    ),

    h(
      "div",
      { style: { position: "relative", width: "100%", aspectRatio: `${W} / ${H}`, marginTop: "10px" } },
      grid(free.length),
      // Priced dots, aligned to the plot box.
      h("div", {
        style: {
          position: "absolute",
          left: pct(L / W), right: pct(R / W),
          top: pct(T / H), bottom: pct((H - T - PLOT_H) / H),
        },
      }, pricedDots),
      // Free lane dots, aligned to the lane box.
      h("div", {
        style: {
          position: "absolute",
          left: pct(L / W), right: pct(R / W),
          top: pct(LANE_Y / H), height: pct(LANE_H / H),
        },
      }, freeDots)
    ),

    outliers.length
      ? h(
          "div",
          {
            style: {
              display: "flex", flexWrap: "wrap", gap: "10px 22px",
              paddingTop: "14px", borderTop: `1px solid ${line(".1")}`,
            },
          },
          outliers.map((o) =>
            h(
              "div",
              { style: { display: "flex", alignItems: "center", gap: "9px" } },
              h("div", {
                style: {
                  font: `700 10px/1 ${MONO}`, color: "#f2efea",
                  width: "20px", height: "20px", borderRadius: "99px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: alpha(o.col, ".35"), border: `1.5px solid ${o.col}`, flex: "none",
                },
                text: o.num,
              }),
              h(
                "div",
                { style: { display: "flex", flexDirection: "column", gap: "2px" } },
                h("div", { style: { font: `500 12px/1.2 ${SANS}`, color: INK }, text: o.title }),
                h("div", { style: { font: `400 10px/1 ${MONO}`, color: dim(".45") }, text: o.stat })
              )
            )
          )
        )
      : null
  );
}
