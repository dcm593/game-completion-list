import { h } from "../ui/dom.js";
import { PLAT, ORDER, MONO, SANS, INK, dim, line, alpha } from "../ui/theme.js";

// Hours per platform as a single proportional band each, subdivided into one
// segment per game (longest first) so a year reads as both a total and a
// distribution.
export function timeline(games) {
  const sums = ORDER.map((name) =>
    games.filter((g) => g.pl === name && g.h).reduce((a, g) => a + g.h, 0)
  );
  const peak = Math.max(1, ...sums);
  const step = peak > 400 ? 100 : peak > 160 ? 50 : peak > 60 ? 20 : 10;
  const max = Math.ceil(peak / step) * step;

  const ticks = [];
  for (let t = 0; t <= max; t += step) ticks.push(t);

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "6px" } },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "5px" } },
      h("div", { style: { fontSize: "15px", fontWeight: 600 }, text: "Hours by platform" }),
      h("div", {
        style: { fontSize: "12.5px", color: dim(".5"), maxWidth: "480px", lineHeight: 1.5 },
        text: "Each band is one platform's total for the year, split into its games longest-first.",
      })
    ),

    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "26px", marginTop: "14px" } },
      ORDER.map((name) => band(name, games, max))
    ),

    // Axis.
    h(
      "div",
      { style: { position: "relative", height: "28px", marginTop: "4px", marginLeft: "54px" } },
      ticks.map((t, i) =>
        h(
          "div",
          {
            style: {
              position: "absolute",
              left: `${(t / max) * 100}%`,
              top: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              transform: "translateX(-50%)",
            },
          },
          h("div", { style: { width: "1px", height: "6px", background: line(".14") } }),
          h("div", {
            style: { font: `400 10px/1 ${MONO}`, color: dim(".4") },
            text: i === 0 ? "" : String(t),
          })
        )
      )
    )
  );
}

function band(name, games, max) {
  const col = PLAT[name].c;
  const list = games.filter((g) => g.pl === name && g.h).sort((a, b) => b.h - a.h);
  const sum = list.reduce((a, g) => a + g.h, 0);

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "9px" } },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "9px" } },
      h("div", {
        style: {
          width: "8px", height: "8px", borderRadius: "99px",
          background: col, boxShadow: `0 0 10px ${col}`, flex: "none",
        },
      }),
      h("div", {
        style: { font: `700 15px/1 ${MONO}`, color: col, letterSpacing: ".02em" },
        text: PLAT[name].abbr,
      }),
      h("div", {
        style: { font: `500 10.5px/1 ${MONO}`, color: dim(".5"), letterSpacing: ".08em" },
        text: PLAT[name].short,
      }),
      h("div", { style: { flex: 1 } }),
      h("div", {
        style: { font: `600 13px/1 ${SANS}`, color: dim(".7") },
        text: `${sum.toFixed(0)}h`,
      })
    ),

    h(
      "div",
      { style: { position: "relative", height: "42px", marginLeft: "54px" } },
      h(
        "div",
        {
          style: {
            position: "absolute", left: 0, top: 0, height: "100%",
            width: `${Math.max(2, (sum / max) * 100)}%`,
            display: "flex", gap: "2px", padding: "3px",
            borderRadius: "8px", border: `1px solid ${alpha(col, ".55")}`,
            background: alpha(col, ".1"),
            boxShadow: `0 0 26px -6px ${alpha(col, ".5")}`,
            overflow: "hidden",
          },
        },
        list.map((g, i) =>
          h("div", {
            title: `${g.t} - ${g.h}h`,
            style: {
              flex: g.h, minWidth: "3px", borderRadius: "5px",
              background: alpha(col, (0.68 - (i % 3) * 0.16).toFixed(2)),
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              font: `700 10px/1 ${MONO}`, color: "rgba(11,11,15,.72)",
            },
            text: g.h >= 20 ? String(i + 1) : "",
          })
        )
      )
    ),

    list.length
      ? h(
          "div",
          {
            style: {
              display: "flex", flexWrap: "wrap", gap: "6px 18px", marginLeft: "54px",
            },
          },
          list.map((g, i) =>
            h(
              "div",
              { style: { display: "flex", alignItems: "baseline", gap: "6px" } },
              h("div", {
                style: { font: `700 9.5px/1 ${MONO}`, color: dim(".35") },
                text: String(i + 1),
              }),
              h("div", {
                style: { font: `400 11px/1.3 ${SANS}`, color: INK },
                text: g.t.split(" (")[0],
              }),
              h("div", {
                style: { font: `400 10px/1 ${MONO}`, color: dim(".4") },
                text: `${g.h}h`,
              })
            )
          )
        )
      : null
  );
}
