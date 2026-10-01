import { h, cx } from "../ui/dom.js";
import { platformOf, tint } from "../ui/theme.js";
import { formatHours, formatPrice, formatRate, costPerHour } from "../ui/format.js";
import { cover, COVER_SIZES } from "../components/cover.js";

// Rendered 2nd - 1st - 3rd so the winner sits raised in the middle.
const ARRANGEMENT = [1, 0, 2];

// `lazy` defers the art for podiums below the fold - every year but the
// first.
export function podium(entries, { lazy = false } = {}) {
  return h(
    "div",
    { class: "podium" },
    ARRANGEMENT.map((rank) => entries[rank] && place(entries[rank], rank, lazy))
  );
}

// Unlike the stat row, the podium always shows a rate: a dash when either
// figure is missing, "free" for a game that cost nothing.
function rateText(game) {
  if (game.hours == null || game.price == null) return "—";
  if (game.price === 0) return "free";
  const rate = costPerHour(game);
  return rate == null ? "—" : formatRate(rate);
}

function place(game, rank, lazy) {
  return h(
    "div",
    {
      class: cx("podium-place", rank === 0 ? "podium-place--first" : "podium-place--runner"),
      "data-rank": rank + 1,
      style: tint(game.platform),
    },
    h(
      "div",
      { class: "podium-card" },
      h("div", { class: "podium-glow" }),
      // Full-bleed 2:1 header, matching the grid cards. The wider first-place
      // column therefore gets taller art, which keeps the winner visually
      // raised.
      cover(game, { lazy, sizes: rank === 0 ? COVER_SIZES.podiumFirst : COVER_SIZES.podiumRunner }),
      body(game)
    ),
    h("div", { class: "podium-rank", text: `#${rank + 1}` })
  );
}

function body(game) {
  return h(
    "div",
    { class: "podium-body" },
    // Titles read exactly as written in the sheet's Top 3 block, rather than
    // borrowing the longer row title from the games table.
    h("div", { class: cx("podium-title", game.placeholder && "is-placeholder"), text: game.title }),
    // The platform is named here, so the badge that used to sit in the card's
    // top corner would only have repeated it.
    h("div", {
      class: "podium-platform",
      text: game.placeholder ? "" : platformOf(game.platform).short,
    }),

    h("div", { class: "podium-spacer" }),

    h(
      "div",
      { class: "podium-stats" },
      h("div", { class: "podium-stat", text: formatHours(game.hours) }),
      h("div", {
        class: "podium-stat podium-stat--price",
        text: formatPrice(game.price, { whole: true }),
      }),
      h("div", { class: "podium-rate", text: rateText(game) })
    )
  );
}
