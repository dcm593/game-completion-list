import { h, clear } from "./ui/dom.js";
import {
  PLAT, ORDER, CHIPS, MONO, SANS, INK, dim, line, tagStyle, label, GOOD, WARN,
} from "./ui/theme.js";
import { GAMES, YEARS, TOP3 } from "./data/adapt.js";
import { card } from "./components/card.js";
import { platinumIcon, perfectIcon } from "./ui/icons.js";
import { podium } from "./views/podium.js";
import { scatter } from "./views/scatter.js";
import { timeline } from "./views/timeline.js";

const VIEWS = [
  { key: "podium", label: "Podium" },
  { key: "scatter", label: "Value scatter" },
  { key: "timeline", label: "Platform hours" },
];

// Whole-page re-render on interaction. The dataset is 76 rows and every view
// is pure, so this stays well under a frame and avoids a diffing layer.
const state = { view: {}, chip: {}, open: null };

function set(patch) {
  Object.assign(state, patch);
  render();
}

const viewOf = (year) => state.view[year] ?? "podium";
const chipOf = (year) => state.chip[year] ?? "All";

function jump(year) {
  const el = document.getElementById(`y${year}`);
  if (!el) return;
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.pageYOffset - 116,
    behavior: "smooth",
  });
}

// ------------------------------------------------------------------ header

function statTile(item, opts = {}) {
  return h(
    "div",
    {
      style: {
        display: "flex", flexDirection: "column", gap: "5px",
        padding: "0 26px",
        borderLeft: opts.plain ? "none" : `1px solid ${line(".08")}`,
      },
    },
    h("div", { style: label({ letterSpacing: ".13em", fontSize: "9px" }), text: item.label }),
    h(
      "div",
      { style: { display: "flex", alignItems: "baseline", gap: "5px" } },
      h("div", {
        style: { fontSize: "23px", fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1 },
        text: item.value,
      }),
      item.unit
        ? h("div", { style: { font: `400 10px/1 ${MONO}`, color: dim(".35") }, text: item.unit })
        : null,
      item.delta
        ? h("div", {
            style: { font: `500 10.5px/1 ${MONO}`, color: item.up ? GOOD : WARN },
            text: item.delta,
          })
        : null
    )
  );
}

function header() {
  const totalGames = YEARS.reduce((a, y) => a + y.games, 0);
  const totalHours = YEARS.reduce((a, y) => a + y.hours, 0);
  const totalSpend = YEARS.reduce((a, y) => a + y.spend, 0);

  return h(
    "div",
    {
      style: {
        position: "sticky", top: 0, zIndex: 30,
        backdropFilter: "blur(14px)",
        background: "rgba(11,11,15,.86)",
        borderBottom: `1px solid ${line(".07")}`,
      },
    },
    h(
      "div",
      {
        style: {
          maxWidth: "1560px", margin: "0 auto", padding: "16px 40px",
          display: "flex", alignItems: "center", gap: "36px",
        },
      },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "3px", flex: "none" } },
        h("div", {
          style: { fontSize: "17px", fontWeight: 600, letterSpacing: "-.01em" },
          text: "Games I Beat",
        }),
        h("div", {
          style: { font: `400 10.5px/1 ${MONO}`, color: dim(".42"), letterSpacing: ".04em" },
          text: "COMPLETION LOG",
        })
      ),
      h("div", { style: { flex: 1 } }),
      h(
        "div",
        { style: { display: "flex", alignItems: "stretch" } },
        [
          { label: "TOTAL GAMES", value: String(totalGames), unit: "beaten" },
          { label: "TOTAL HOURS", value: totalHours.toLocaleString(), unit: "played" },
          { label: "TOTAL SPEND", value: `$${totalSpend.toLocaleString()}`, unit: "CAD" },
          { label: "AVG COST / HOUR", value: `$${(totalSpend / totalHours).toFixed(2)}`, unit: "" },
        ].map((item) => statTile(item))
      )
    )
  );
}

// -------------------------------------------------------------------- rail

function rail() {
  const platinums = GAMES.filter((g) => g.plat).length;
  const hundreds = GAMES.filter((g) => g.hundred).length;

  return h(
    "div",
    {
      style: {
        position: "sticky", top: "104px", padding: "34px 0 40px",
        display: "flex", flexDirection: "column", gap: "26px",
      },
    },
    h("div", { style: label(), text: "JUMP TO YEAR" }),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "6px" } },
      YEARS.map((y) =>
        h(
          "button",
          {
            onclick: () => jump(y.year),
            style: {
              display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start",
              padding: "12px 14px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
              border: `1px solid ${line(".09")}`, background: line(".03"), color: INK,
            },
          },
          h(
            "div",
            { style: { display: "flex", alignItems: "baseline", gap: "9px" } },
            h("div", {
              style: { font: `700 19px/1 ${MONO}`, letterSpacing: "-.02em" },
              text: String(y.year),
            }),
            h("div", {
              style: tagStyle(y.tag === "complete"),
              text: y.tag === "complete" ? "done" : "live",
            })
          ),
          h("div", {
            style: { font: `400 10px/1 ${MONO}`, color: dim(".42") },
            text: `${y.games} games - ${y.hoursLabel} h`,
          })
        )
      )
    ),

    h(
      "div",
      {
        style: {
          display: "flex", flexDirection: "column", gap: "12px",
          paddingTop: "22px", borderTop: `1px solid ${line(".08")}`,
        },
      },
      h("div", { style: label(), text: "PLATFORMS" }),
      ORDER.map((name) =>
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "9px" } },
          h("div", {
            style: {
              width: "9px", height: "9px", borderRadius: "99px",
              background: PLAT[name].c, boxShadow: `0 0 10px ${PLAT[name].c}`, flex: "none",
            },
          }),
          h("div", {
            style: { font: `400 10.5px/1 ${MONO}`, color: dim(".55"), letterSpacing: ".04em" },
            text: PLAT[name].short,
          }),
          h("div", { style: { flex: 1 } }),
          h("div", {
            style: { font: `400 10.5px/1 ${MONO}`, color: dim(".35") },
            text: String(GAMES.filter((g) => g.pl === name).length),
          })
        )
      )
    ),

    h(
      "div",
      {
        style: {
          display: "flex", flexDirection: "column", gap: "10px",
          paddingTop: "22px", borderTop: `1px solid ${line(".08")}`,
        },
      },
      h("div", { style: label(), text: "COMPLETION" }),
      counter(platinumIcon(20), "PLATINUMS", platinums),
      counter(perfectIcon(20), "FULL CLEARS", hundreds)
    )
  );
}

function counter(glyph, text, count) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "9px" } },
    h(
      "div",
      {
        style: {
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        },
      },
      glyph
    ),
    h("div", { style: { font: `400 10.5px/1 ${MONO}`, color: dim(".55") }, text }),
    h("div", { style: { flex: 1 } }),
    h("div", { style: { font: `400 10.5px/1 ${MONO}`, color: dim(".35") }, text: String(count) })
  );
}

// ----------------------------------------------------------------- section

function yearSection(year, index) {
  const view = viewOf(year.year);
  const chip = chipOf(year.year);
  const all = GAMES.filter((g) => g.y === year.year);
  const shown = all.filter((g) => chip === "All" || g.pl === chip);
  const prev = YEARS[index - 1];

  const delta = (current, before) => {
    if (!before) return {};
    const d = Math.round(((current - before) / before) * 100);
    return { delta: `${d >= 0 ? "+" : ""}${d}%`, up: d >= 0 };
  };

  return h(
    "div",
    {
      id: `y${year.year}`,
      style: {
        scrollMarginTop: "120px", display: "flex", flexDirection: "column", gap: "20px",
      },
    },
    h(
      "div",
      { style: { display: "flex", alignItems: "flex-end", gap: "16px" } },
      h("div", {
        style: { font: `700 34px/1 ${MONO}`, letterSpacing: "-.03em" },
        text: String(year.year),
      }),
      h("div", { style: tagStyle(year.tag === "complete"), text: year.tag }),
      h("div", { style: { flex: 1 } }),
      h("div", {
        style: { font: `400 10.5px/1 ${MONO}`, color: dim(".38") },
        text: `${shown.length} of ${all.length} rows - click a card for its sheet note`,
      })
    ),

    h(
      "div",
      {
        style: {
          display: "flex", flexWrap: "wrap", gap: "10px 0",
          padding: "18px 0", borderTop: `1px solid ${line(".08")}`,
          borderBottom: `1px solid ${line(".08")}`,
        },
      },
      [
        { label: "GAMES BEATEN", value: String(year.games), ...delta(year.games, prev?.games) },
        { label: "HOURS PLAYED", value: year.hoursLabel, ...delta(year.hours, prev?.hours) },
        { label: "SPEND (CAD)", value: year.spendLabel, ...delta(year.spend, prev?.spend) },
        { label: "AVG COST / HOUR", value: `$${(year.spend / year.hours).toFixed(2)}` },
      ].map((item, i) => statTile(item, { plain: i === 0 }))
    ),

    h(
      "div",
      {
        style: {
          position: "relative", overflow: "hidden",
          border: `1px solid ${line(".09")}`, borderRadius: "18px",
          background: `linear-gradient(160deg, ${line(".035")}, ${line(".01")})`,
          padding: "26px 26px 28px",
          display: "flex", flexDirection: "column", gap: "22px",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
            padding: "4px", borderRadius: "999px", background: line(".04"),
            alignSelf: "flex-start",
          },
        },
        VIEWS.map((v) =>
          h("button", {
            onclick: () => set({ view: { ...state.view, [year.year]: v.key } }),
            style: {
              font: `500 12px/1 ${SANS}`, padding: "8px 16px", borderRadius: "999px",
              border: "none", cursor: "pointer",
              background: view === v.key ? "#f2efea" : "transparent",
              color: view === v.key ? "#101014" : dim(".6"),
            },
            text: v.label,
          })
        )
      ),
      view === "podium" ? podium(TOP3[year.year] ?? []) : null,
      view === "scatter" ? scatter(all) : null,
      view === "timeline" ? timeline(all) : null
    ),

    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } },
      CHIPS.map((c) =>
        h("button", {
          onclick: () => set({ chip: { ...state.chip, [year.year]: c } }),
          style: chipStyleFor(chip === c),
          text: c,
        })
      )
    ),

    h(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))",
          gap: "14px",
        },
      },
      shown.map((game) => {
        const key = `${game.y}:${game.t}`;
        return card(game, {
          isOpen: state.open === key,
          onToggle: () => set({ open: state.open === key ? null : key }),
        });
      })
    )
  );
}

function chipStyleFor(active) {
  return {
    font: `500 11.5px/1 ${MONO}`, letterSpacing: ".06em",
    padding: "8px 13px", borderRadius: "999px", cursor: "pointer",
    border: `1px solid ${line(active ? ".28" : ".1")}`,
    background: active ? line(".1") : "transparent",
    color: active ? "#f4f2ef" : dim(".55"),
  };
}

// ------------------------------------------------------------------ render

export function render() {
  const root = document.getElementById("app");
  clear(root);
  root.append(
    h(
      "div",
      {
        style: {
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 600px at 78% -10%, oklch(0.30 0.06 254 / .32), transparent 60%), #0b0b0f",
        },
      },
      header(),
      h(
        "div",
        {
          style: {
            maxWidth: "1560px", margin: "0 auto", padding: "0 40px",
            display: "grid", gridTemplateColumns: "212px 1fr", gap: "44px",
            alignItems: "start",
          },
        },
        rail(),
        h(
          "div",
          {
            style: {
              padding: "34px 0 110px", display: "flex", flexDirection: "column",
              gap: "62px", minWidth: 0,
            },
          },
          YEARS.map((year, i) => yearSection(year, i))
        )
      )
    )
  );
}
