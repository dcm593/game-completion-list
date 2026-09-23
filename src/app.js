import { h, clear, cx } from "./ui/dom.js";
import { PLAT, ORDER, CHIPS, tint } from "./ui/theme.js";
import { GAMES, YEARS, TOP3 } from "./data/adapt.js";
import { card } from "./components/card.js";
import { noteModal } from "./components/note-modal.js";
import { hideHoverCard } from "./components/hover-card.js";
import { platinumIcon, perfectIcon } from "./ui/icons.js";
import { podium } from "./views/podium.js";
import { scatter } from "./views/scatter.js";
import { timeline } from "./views/timeline.js";

const VIEWS = [
  { key: "podium", label: "Podium", short: "Podium" },
  { key: "scatter", label: "Value scatter", short: "Scatter" },
  { key: "timeline", label: "Platform hours", short: "Hours" },
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

const openGame = () => GAMES.find((g) => `${g.y}:${g.t}` === state.open) ?? null;
const closeNote = () => set({ open: null });

// Bound once, not per render: render() rebuilds the whole tree on every state
// change, so a listener attached alongside the modal would stack up one copy
// per open.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.open) closeNote();
});

// Where it lands is the section's scroll-margin-top, which the stylesheet
// sets to clear whatever is pinned to the top at the current width.
function jump(year) {
  document.getElementById(`y${year}`)?.scrollIntoView({ behavior: "smooth" });
}

const platinumCount = () => GAMES.filter((g) => g.plat).length;
const hundredCount = () => GAMES.filter((g) => g.hundred).length;
const platformCount = (name) => GAMES.filter((g) => g.pl === name).length;

// ------------------------------------------------------------------- stats

function statTile(item) {
  return h(
    "div",
    { class: "stat" },
    h("div", { class: "label", text: item.label }),
    h(
      "div",
      { class: "stat-row" },
      h("div", { class: "stat-value", text: item.value }),
      item.unit ? h("div", { class: "stat-unit", text: item.unit }) : null,
      item.delta
        ? h("div", { class: cx("stat-delta", item.up ? "is-up" : "is-down"), text: item.delta })
        : null
    )
  );
}

// Games and hours stand alone; the two price figures share a pair, which the
// stylesheet turns into a single cell on narrow screens.
function stats([games, hours, ...price], extraClass) {
  return h(
    "div",
    { class: cx("stats", extraClass) },
    statTile(games),
    statTile(hours),
    h("div", { class: "stat-pair" }, price.map(statTile))
  );
}

// ------------------------------------------------------------------ header

function header() {
  const totalGames = YEARS.reduce((a, y) => a + y.games, 0);
  const totalHours = YEARS.reduce((a, y) => a + y.hours, 0);
  const totalSpend = YEARS.reduce((a, y) => a + y.spend, 0);

  return h(
    "div",
    { class: "header" },
    h(
      "div",
      { class: "header-inner" },
      h(
        "div",
        { class: "brand" },
        h("div", { class: "brand-name", text: "Games I Beat" }),
        h("div", { class: "brand-sub", text: "COMPLETION LOG" })
      ),
      stats([
        { label: "TOTAL GAMES", value: String(totalGames), unit: "beaten" },
        { label: "TOTAL HOURS", value: totalHours.toLocaleString(), unit: "played" },
        { label: "TOTAL SPEND", value: `$${totalSpend.toLocaleString()}`, unit: "CAD" },
        { label: "AVG COST / HOUR", value: `$${(totalSpend / totalHours).toFixed(2)}` },
      ])
    )
  );
}

// -------------------------------------------------------------------- rail

function rail() {
  return h(
    "div",
    { class: "rail" },
    h("div", { class: "label", text: "JUMP TO YEAR" }),
    h(
      "div",
      { class: "rail-years" },
      YEARS.map((y) =>
        h(
          "button",
          { class: "rail-year", onclick: () => jump(y.year) },
          h(
            "div",
            { class: "rail-year-head" },
            h("div", { class: "rail-year-num", text: String(y.year) }),
            yearTag(y, true)
          ),
          h("div", { class: "rail-year-sub", text: `${y.games} games - ${y.hoursLabel} h` })
        )
      )
    ),

    h(
      "div",
      { class: "rail-group" },
      h("div", { class: "label", text: "PLATFORMS" }),
      ORDER.map((name) =>
        h(
          "div",
          { class: "rail-row", style: tint(name) },
          h("div", { class: "dot" }),
          h("div", { class: "rail-name", text: PLAT[name].short }),
          h("div", { class: "rail-count", text: String(platformCount(name)) })
        )
      )
    ),

    h(
      "div",
      { class: "rail-group rail-group--marks" },
      h("div", { class: "label", text: "COMPLETION" }),
      counter(platinumIcon(), "PLATINUMS", platinumCount()),
      counter(perfectIcon(), "FULL CLEARS", hundredCount())
    )
  );
}

function counter(glyph, text, count) {
  return h(
    "div",
    { class: "rail-row" },
    h("div", { class: "rail-mark" }, glyph),
    h("div", { class: "rail-name", text }),
    h("div", { class: "rail-count", text: String(count) })
  );
}

// `short` gives the rail's done/live wording rather than the full tag.
function yearTag(year, short = false) {
  const done = year.tag === "complete";
  const text = short ? (done ? "done" : "live") : year.tag;
  return h("div", { class: cx("tag", done ? "tag--done" : "tag--live"), text });
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
    { id: `y${year.year}`, class: "year" },
    h(
      "div",
      { class: "year-head" },
      h("div", { class: "year-title", text: String(year.year) }),
      yearTag(year),
      h(
        "div",
        { class: "year-meta" },
        `${shown.length} of ${all.length} games - `,
        h("span", { class: "hover-only", text: "click" }),
        h("span", { class: "touch-only", text: "tap" }),
        " a card for its sheet note"
      )
    ),

    stats(
      [
        { label: "GAMES BEATEN", value: String(year.games), ...delta(year.games, prev?.games) },
        { label: "HOURS PLAYED", value: year.hoursLabel, ...delta(year.hours, prev?.hours) },
        { label: "SPEND (CAD)", value: year.spendLabel, ...delta(year.spend, prev?.spend) },
        { label: "AVG COST / HOUR", value: `$${(year.spend / year.hours).toFixed(2)}` },
      ],
      "year-stats"
    ),

    h(
      "div",
      { class: "panel" },
      h(
        "div",
        { class: "tabs" },
        VIEWS.map((v) =>
          h(
            "button",
            {
              class: cx("tab", view === v.key && "is-active"),
              onclick: () => set({ view: { ...state.view, [year.year]: v.key } }),
            },
            h("span", { class: "tab-long", text: v.label }),
            h("span", { class: "tab-short", text: v.short })
          )
        )
      ),
      view === "podium" ? podium(TOP3[year.year] ?? []) : null,
      view === "scatter" ? scatter(all) : null,
      view === "timeline" ? timeline(all) : null
    ),

    h(
      "div",
      { class: "chips" },
      CHIPS.map((c) =>
        h("button", {
          class: cx("chip", chip === c && "is-active"),
          onclick: () => set({ chip: { ...state.chip, [year.year]: c } }),
          text: c,
        })
      )
    ),

    h(
      "div",
      { class: "grid" },
      shown.map((game) =>
        card(game, { onOpenNote: () => set({ open: `${game.y}:${game.t}` }) })
      )
    )
  );
}

// ------------------------------------------------------------------ render

export function render() {
  const root = document.getElementById("app");
  const note = openGame();

  // Switching view or filter removes whatever is under the cursor, and a
  // removed element never fires mouseleave - so the card would hang around.
  hideHoverCard();

  document.body.classList.toggle("is-locked", Boolean(note));

  clear(root);
  root.append(
    h(
      "div",
      { class: "page" },
      header(),
      h(
        "div",
        { class: "layout" },
        rail(),
        h("div", { class: "main" }, YEARS.map((year, i) => yearSection(year, i)))
      )
    )
  );

  // Appended after the page so it stacks above it without the sticky header
  // or rail needing to know about it.
  if (note) root.append(noteModal(note, { onClose: closeNote }));
}
