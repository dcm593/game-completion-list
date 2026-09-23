import { h } from "../ui/dom.js";
import { PLAT, ORDER, tint } from "../ui/theme.js";
import { attachHoverCard } from "../components/hover-card.js";

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
    { class: "chart" },
    h(
      "div",
      { class: "chart-intro" },
      h("div", { class: "chart-title", text: "Hours by platform" }),
      h("div", {
        class: "chart-desc",
        text: "Each band is one platform's total for the year, split into its games longest-first.",
      })
    ),

    h("div", { class: "bands" }, ORDER.map((name) => band(name, games, max))),

    h(
      "div",
      { class: "axis band-indent" },
      ticks.map((t, i) =>
        h(
          "div",
          { class: "axis-tick", style: { left: `${(t / max) * 100}%` } },
          h("div", { class: "axis-label", text: i === 0 ? "" : String(t) })
        )
      )
    )
  );
}

function segment(game, index) {
  const bar = h("div", {
    class: "segment",
    style: { flex: game.h },
    text: game.h >= 20 ? String(index + 1) : "",
  });

  attachHoverCard(bar, game, [["HOURS", `${game.h}h`]], (on) => {
    bar.classList.toggle("is-hot", on);
  });

  return bar;
}

function band(name, games, max) {
  const list = games.filter((g) => g.pl === name && g.h).sort((a, b) => b.h - a.h);
  const sum = list.reduce((a, g) => a + g.h, 0);

  return h(
    "div",
    { class: "band", style: tint(name) },
    h(
      "div",
      { class: "band-head" },
      h("div", { class: "dot" }),
      h("div", { class: "band-abbr", text: PLAT[name].abbr }),
      h("div", { class: "band-name", text: PLAT[name].short }),
      h("div", { class: "band-sum", text: `${sum.toFixed(0)}h` })
    ),

    h(
      "div",
      { class: "band-track band-indent" },
      h(
        "div",
        { class: "band-fill", style: { width: `${Math.max(2, (sum / max) * 100)}%` } },
        list.map((g, i) => segment(g, i))
      )
    ),

    list.length
      ? h(
          "div",
          { class: "band-legend band-indent" },
          list.map((g, i) =>
            h(
              "div",
              { class: "legend-item" },
              h("div", { class: "legend-num", text: String(i + 1) }),
              h("div", { class: "legend-title", text: g.t.split(" (")[0] }),
              h("div", { class: "legend-hours", text: `${g.h}h` })
            )
          )
        )
      : null
  );
}
