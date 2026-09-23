import { h, cx } from "../ui/dom.js";
import { PLAT, tint } from "../ui/theme.js";
import { platinumIcon, perfectIcon } from "../ui/icons.js";
import { cover } from "./cover.js";

// Three ways a completion figure can be absent, and they are not the same:
// a bar at 100%, a partial bar, or no bar at all — either because the game
// has no achievement system ("N/A") or because it isn't filled in yet ("—").
function completionParts(game) {
  const done = game.plat || game.hundred;
  const pct = done ? 100 : game.pct;
  const tone =
    pct == null ? "none" : pct === 100 ? (game.hundred ? "hundred" : "trophy") : "partial";

  const text =
    pct != null
      ? `${pct}%`
      : game.pctState === "not-applicable"
        ? "N/A"
        : "—";

  return { pct, tone, text };
}

function medal(title, glyph) {
  return h("div", { title, class: "medal" }, glyph);
}

// Cards with a note are clickable and open it in an overlay; the note is not
// rendered here, so a card's height never depends on whether it is open.
export function card(game, { onOpenNote }) {
  const { pct, tone, text } = completionParts(game);
  const rate = game.h && game.p > 0 ? game.p / game.h : null;

  const badges = [];
  if (game.coop) badges.push(["CO-OP", "coop"]);
  if (game.replay) badges.push(["REPLAY", "replay"]);
  if (game.note) badges.push(["NOTE", "note"]);

  const body = h(
    "div",
    { class: "card-body" },

    h(
      "div",
      { class: "card-top" },
      h("div", { class: "dot" }),
      h("div", { class: "card-platform", text: PLAT[game.pl].short }),
      game.plat || game.hundred
        ? h(
            "div",
            { class: "card-medals" },
            game.plat ? medal("Platinum trophy", platinumIcon()) : null,
            game.hundred ? medal("100% achievements", perfectIcon()) : null
          )
        : null
    ),

    h("div", { title: game.t, class: "card-title", text: game.t }),

    // Completion bar. Title carries the raw fraction so the exact counts stay
    // reachable without cluttering the card.
    h(
      "div",
      { class: `completion completion--${tone}` },
      h(
        "div",
        { class: "completion-head" },
        h("div", { class: "completion-label", text: "COMPLETION" }),
        h("div", {
          title: game.pctDetail ?? "",
          class: "completion-value",
          text: game.pctDetail && pct !== 100 ? `${game.pctDetail} · ${text}` : text,
        })
      ),
      h(
        "div",
        { class: "completion-track" },
        h("div", { class: "completion-fill", style: { width: `${pct || 0}%` } })
      )
    ),

    h(
      "div",
      { class: "card-stats" },
      h("div", { class: "card-hours", text: game.h ? `${game.h} h` : "n/a" }),
      h("div", { class: "card-price", text: game.p === 0 ? "free" : `$${game.p.toFixed(2)}` }),
      rate
        ? h("div", {
            class: cx("card-rate", rate < 1 && "is-good", rate > 5 && "is-warn"),
            text: `$${rate.toFixed(2)}/h`,
          })
        : null
    ),

    h(
      "div",
      { class: "card-badges" },
      badges.map(([label, kind]) => h("div", { class: `badge badge--${kind}`, text: label }))
    )
  );

  return h(
    "div",
    {
      class: cx("card", game.note && "card--note"),
      style: tint(game.pl),
      onclick: game.note ? onOpenNote : null,
    },
    cover(game, { lazy: true }),
    body
  );
}
