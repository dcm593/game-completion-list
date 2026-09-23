import { h, cx } from "../ui/dom.js";
import { PLAT, tint } from "../ui/theme.js";
import { cover } from "../components/cover.js";

// Rendered 2nd - 1st - 3rd so the winner sits raised in the middle.
const ARRANGEMENT = [1, 0, 2];

export function podium(entries) {
  return h(
    "div",
    { class: "podium" },
    ARRANGEMENT.map((rank) => entries[rank] && place(entries[rank], rank))
  );
}

function place(game, rank) {
  const known = game.h != null && game.p != null;
  const rate = !known ? "—" : game.p > 0 ? `$${(game.p / game.h).toFixed(2)}/h` : "free";

  return h(
    "div",
    {
      class: cx("podium-place", rank === 0 ? "podium-place--first" : "podium-place--runner"),
      "data-rank": rank + 1,
      style: tint(game.pl),
    },
    h(
      "div",
      { class: "podium-card" },
      h("div", { class: "podium-glow" }),
      // Full-bleed 2:1 header, matching the grid cards. The wider first-place
      // column therefore gets taller art, which keeps the winner visually
      // raised.
      cover(game),
      body(game, rate)
    ),
    h("div", { class: "podium-rank", text: `#${rank + 1}` })
  );
}

function body(game, rate) {
  return h(
    "div",
    { class: "podium-body" },
    // Titles read exactly as written in the sheet's Top 3 block, rather than
    // borrowing the longer row title from the games table.
    h("div", { class: cx("podium-title", game.placeholder && "is-placeholder"), text: game.t }),
    // The platform is named here, so the badge that used to sit in the card's
    // top corner would only have repeated it.
    h("div", {
      class: "podium-platform",
      text: game.placeholder ? "" : PLAT[game.pl].short,
    }),

    h("div", { class: "podium-spacer" }),

    h(
      "div",
      { class: "podium-stats" },
      h("div", { class: "podium-stat", text: game.h == null ? "—" : `${game.h}h` }),
      h("div", {
        class: "podium-stat podium-stat--price",
        text: game.p == null ? "—" : game.p === 0 ? "free" : `$${game.p.toFixed(0)}`,
      }),
      h("div", { class: "podium-rate", text: rate })
    )
  );
}
