import { h, cx } from "./ui/dom.js";
import { platformOf, ORDER, CHIPS, chipLabel, tint } from "./ui/theme.js";
import { YEARS, TOTALS, COUNTS } from "./data/adapt.js";
import { card } from "./components/card.js";
import { noteModal } from "./components/note-modal.js";
import { hideHoverCard } from "./components/hover-card.js";
import { platinumIcon, perfectIcon } from "./ui/icons.js";
import { onNarrowChange } from "./ui/media.js";
import { podium } from "./views/podium.js";
import { scatter } from "./views/scatter.js";
import { timeline } from "./views/timeline.js";

// How the page updates: the header, year bar and rail never change, so they
// are built once. Each year section owns its tab and filter, and a click
// swaps out only the part it affects - the view inside the panel, or the card
// grid - so the buttons themselves persist and keep keyboard focus. The note
// renders into a container of its own. No diffing layer is needed for that.

const VIEWS = [
  { key: "podium", label: "Podium", short: "Podium", render: (year, index) => podium(year.top3, { lazy: index > 0 }) },
  { key: "scatter", label: "Value scatter", short: "Scatter", render: (year) => scatter(year.games) },
  { key: "timeline", label: "Platform hours", short: "Hours", render: (year) => timeline(year.games) },
];

// Where it lands is the section's scroll-margin-top, which the stylesheet
// sets to clear whatever is pinned to the top at the current width.
function jump(year) {
  document.getElementById(`y${year}`)?.scrollIntoView({ behavior: "smooth" });
}

// ------------------------------------------------------------ current year

// The year being read is marked in the rail and the year bar. It changes as
// the page scrolls, so this toggles a class on the buttons on each frame that
// scrolled rather than rebuilding anything.

// How far past its landing point a year's top can sit and still count as
// being read - so the next year takes over as its heading nears the top,
// rather than only once it is pinned there.
const READ_SLACK = 80;

function currentYear() {
  const sections = YEARS.map((y) => document.getElementById(`y${y.year}`)).filter(Boolean);
  if (!sections.length) return null;

  // A last year shorter than the screen can never reach the top, so at the
  // very bottom of the page it wins regardless.
  const root = document.documentElement;
  if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) return sections.at(-1).id;

  const line = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) + READ_SLACK;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= line) current = section;
  }
  return current.id;
}

function markCurrentYear() {
  const id = currentYear();
  for (const button of document.querySelectorAll("[data-year]")) {
    button.classList.toggle("is-current", `y${button.dataset.year}` === id);
  }
}

let markQueued = false;
function queueMark() {
  if (markQueued) return;
  markQueued = true;
  requestAnimationFrame(() => {
    markQueued = false;
    markCurrentYear();
  });
}

window.addEventListener("scroll", queueMark, { passive: true });
window.addEventListener("resize", queueMark);

// -------------------------------------------------------------------- note

const noteRoot = h("div");
let returnFocus = null;

function openNote(game) {
  hideHoverCard();
  // Whatever opened the note gets focus back when it closes, so a keyboard
  // user lands where they left off.
  returnFocus = document.activeElement;
  const modal = noteModal(game, { onClose: closeNote });
  noteRoot.replaceChildren(modal);
  document.body.classList.add("is-locked");
  modal.querySelector("[role=dialog]").focus();
}

function closeNote() {
  if (!noteRoot.firstChild) return;
  noteRoot.replaceChildren();
  document.body.classList.remove("is-locked");
  returnFocus?.focus?.();
  returnFocus = null;
}

// Escape closes the note. The close button is the dialog's only control, so
// Tab stays on it rather than wandering into the page behind.
document.addEventListener("keydown", (event) => {
  if (!noteRoot.firstChild) return;
  if (event.key === "Escape") closeNote();
  if (event.key === "Tab") {
    event.preventDefault();
    noteRoot.querySelector(".note-close").focus();
  }
});

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
        { label: "TOTAL GAMES", value: String(TOTALS.games), unit: "beaten" },
        { label: "TOTAL HOURS", value: TOTALS.hours.toLocaleString(), unit: "played" },
        { label: "TOTAL SPEND", value: `$${TOTALS.spend.toLocaleString()}`, unit: "CAD" },
        { label: "AVG COST / HOUR", value: `$${(TOTALS.spend / TOTALS.hours).toFixed(2)}` },
      ]),
      summary()
    )
  );
}

// ----------------------------------------------------------------- summary

const platformCount = (slug) => COUNTS.platform[slug] ?? 0;

// The rail's platform and completion counts, carried in the header on screens
// too narrow for the rail (the stylesheet hides it otherwise). Platforms sit
// left of a divider and completion marks right of it, each a name with its
// count centred underneath.
function summaryItem(name, marker, count, style) {
  return h(
    "div",
    { class: "summary-item", style },
    h("div", { class: "summary-name", text: name }),
    h("div", { class: "summary-count" }, marker, String(count))
  );
}

function summary() {
  const mark = (glyph) => h("div", { class: "summary-mark" }, glyph);

  return h(
    "div",
    { class: "summary" },
    h(
      "div",
      { class: "summary-side" },
      ORDER.map((slug) =>
        summaryItem(platformOf(slug).short, h("div", { class: "dot" }), platformCount(slug), tint(slug))
      )
    ),
    h("div", { class: "summary-divider" }),
    h(
      "div",
      { class: "summary-side" },
      summaryItem("PLATINUMS", mark(platinumIcon()), COUNTS.platinum),
      summaryItem("FULL CLEARS", mark(perfectIcon()), COUNTS.fullClear)
    )
  );
}

// ---------------------------------------------------------------- year bar

// The rail's year buttons, pinned under the header where the rail doesn't
// fit (the stylesheet hides it otherwise).
function yearBar() {
  return h(
    "nav",
    { class: "yearbar", "aria-label": "Jump to year" },
    h(
      "div",
      { class: "yearbar-inner" },
      YEARS.map((y) =>
        h(
          "button",
          { class: "yearbar-btn", "data-year": y.year, onclick: () => jump(y.year) },
          h("span", { class: "yearbar-year", text: String(y.year) }),
          yearTag(y, { short: true })
        )
      )
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
      "nav",
      { class: "rail-years", "aria-label": "Jump to year" },
      YEARS.map((y) =>
        h(
          "button",
          { class: "rail-year", "data-year": y.year, onclick: () => jump(y.year) },
          h(
            "div",
            { class: "rail-year-head" },
            h("div", { class: "rail-year-num", text: String(y.year) }),
            yearTag(y, { short: true })
          ),
          h("div", { class: "rail-year-sub", text: `${y.count} games - ${y.hoursLabel} h` })
        )
      )
    ),

    h(
      "div",
      { class: "rail-group" },
      h("div", { class: "label", text: "PLATFORMS" }),
      ORDER.map((slug) =>
        h(
          "div",
          { class: "rail-row", style: tint(slug) },
          h("div", { class: "dot" }),
          h("div", { class: "rail-name", text: platformOf(slug).short }),
          h("div", { class: "rail-count", text: String(platformCount(slug)) })
        )
      )
    ),

    h(
      "div",
      { class: "rail-group rail-group--marks" },
      h("div", { class: "label", text: "COMPLETION" }),
      counter(platinumIcon(), "PLATINUMS", COUNTS.platinum),
      counter(perfectIcon(), "FULL CLEARS", COUNTS.fullClear)
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

// `short` gives the rail and year bar's done/live wording rather than the
// full tag.
function yearTag(year, { short = false } = {}) {
  const done = year.tag === "complete";
  const text = short ? (done ? "done" : "live") : year.tag;
  return h("div", { class: cx("tag", done ? "tag--done" : "tag--live"), text });
}

// ----------------------------------------------------------------- section

// Change against the previous year, as "+12%".
function delta(current, before) {
  if (!before) return {};
  const d = Math.round(((current - before) / before) * 100);
  return { delta: `${d >= 0 ? "+" : ""}${d}%`, up: d >= 0 };
}

// Swaps `node` for `next` in the page and returns `next`, so a section can
// keep a reference to whatever currently fills a slot.
function swap(node, next) {
  node.replaceWith(next);
  return next;
}

function yearSection(year, index) {
  const prev = YEARS[index - 1];
  let view = VIEWS[0];
  let chip = CHIPS[0];

  const tabs = VIEWS.map((v) =>
    h(
      "button",
      { class: "tab", onclick: () => showView(v) },
      h("span", { class: "tab-long", text: v.label }),
      h("span", { class: "tab-short", text: v.short })
    )
  );

  const chips = CHIPS.map((c) =>
    h("button", { class: "chip", onclick: () => filter(c), text: chipLabel(c) })
  );

  // Placeholders until the first showView() / filter() below fills them.
  const meta = h("div", { class: "year-meta" });
  let viewNode = h("div");
  let gridNode = h("div");

  // Leaving a view removes whatever is under the cursor, and a removed element
  // never fires pointerleave - so its hover card would hang around.
  function showView(next) {
    view = next;
    hideHoverCard();
    tabs.forEach((tab, i) => markActive(tab, VIEWS[i] === view));
    viewNode = swap(viewNode, view.render(year, index));
  }

  function filter(next) {
    chip = next;
    chips.forEach((button, i) => markActive(button, CHIPS[i] === chip));
    const shown = year.games.filter((g) => chip === "all" || g.platform === chip);
    meta.replaceChildren(
      `${shown.length} of ${year.count} games - `,
      h("span", { class: "hover-only", text: "click" }),
      h("span", { class: "touch-only", text: "tap" }),
      " a card for its sheet note"
    );
    gridNode = swap(gridNode, h("div", { class: "grid" }, shown.map((game) => card(game, { onOpenNote: () => openNote(game) }))));
  }

  const node = h(
    "div",
    { id: `y${year.year}`, class: "year" },
    h(
      "div",
      { class: "year-head" },
      h("div", { class: "year-title", text: String(year.year) }),
      yearTag(year),
      meta
    ),

    stats(
      [
        { label: "GAMES BEATEN", value: String(year.count), ...delta(year.count, prev?.count) },
        { label: "HOURS PLAYED", value: year.hoursLabel, ...delta(year.hours, prev?.hours) },
        { label: "SPEND (CAD)", value: year.spendLabel, ...delta(year.spend, prev?.spend) },
        { label: "AVG COST / HOUR", value: `$${(year.spend / year.hours).toFixed(2)}` },
      ],
      "year-stats"
    ),

    h("div", { class: "panel" }, h("div", { class: "tabs" }, tabs), viewNode),
    h("div", { class: "chips" }, chips),
    gridNode
  );

  showView(view);
  filter(chip);

  return {
    node,
    // The scatter's geometry is computed in JS, so it is the one view that
    // needs redrawing when the phone breakpoint is crossed.
    redrawScatter: () => view.key === "scatter" && showView(view),
  };
}

function markActive(button, active) {
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-pressed", String(active));
}

// ------------------------------------------------------------------- mount

export function mount() {
  const sections = YEARS.map((year, i) => yearSection(year, i));

  document.getElementById("app").replaceChildren(
    h(
      "div",
      { class: "page" },
      header(),
      yearBar(),
      h(
        "div",
        { class: "layout" },
        rail(),
        h("div", { class: "main" }, sections.map((s) => s.node))
      )
    ),
    // After the page, so the note stacks above it without the sticky header
    // or rail needing to know about it.
    noteRoot
  );

  onNarrowChange(() => sections.forEach((s) => s.redrawScatter()));
  markCurrentYear();
}
