import { h, cx } from "../ui/dom.js";
import { platformOf, tint } from "../ui/theme.js";
import { platinumIcon, perfectIcon } from "../ui/icons.js";
import { cover } from "./cover.js";
import { gameStats } from "./game-stats.js";

// Three ways a completion figure can be absent, and they are not the same:
// a bar at 100%, a partial bar, or no bar at all — either because the game
// has no achievement system ("N/A") or because it isn't filled in yet ("—").
function completionParts(game) {
  const { completion } = game;
  const percent = game.platinum || game.fullClear ? 100 : completion.percent;
  const tone =
    percent == null ? "none" : percent === 100 ? (game.fullClear ? "hundred" : "trophy") : "partial";

  const text =
    percent != null
      ? `${percent}%`
      : completion.state === "not-applicable"
        ? "N/A"
        : "—";

  return { percent, tone, text };
}

function medal(title, glyph) {
  return h("div", { title, class: "medal" }, glyph);
}

// Cards with a note are clickable and open it in an overlay; the note is not
// rendered here, so a card's height never depends on whether it is open.
// They are reachable by keyboard too: focusable, and opened by Enter or Space
// like the button they act as.
export function card(game, { onOpenNote }) {
  const { percent, tone, text } = completionParts(game);
  const { detail } = game.completion;

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
      h("div", { class: "card-platform", text: platformOf(game.platform).short }),
      game.platinum || game.fullClear
        ? h(
            "div",
            { class: "card-medals" },
            game.platinum ? medal("Platinum trophy", platinumIcon()) : null,
            game.fullClear ? medal("100% achievements", perfectIcon()) : null
          )
        : null
    ),

    h("div", { title: game.title, class: "card-title", text: game.title }),

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
          title: detail ?? "",
          class: "completion-value",
          text: detail && percent !== 100 ? `${detail} · ${text}` : text,
        })
      ),
      h(
        "div",
        { class: "completion-track" },
        h("div", { class: "completion-fill", style: { width: `${percent || 0}%` } })
      )
    ),

    gameStats(game, { graded: true }),

    h(
      "div",
      { class: "card-badges" },
      badges.map(([label, kind]) => h("div", { class: `badge badge--${kind}`, text: label }))
    )
  );

  const opensNote = game.note
    ? {
        role: "button",
        tabindex: "0",
        "aria-haspopup": "dialog",
        onclick: onOpenNote,
        onkeydown: (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          onOpenNote();
        },
      }
    : {};

  return h(
    "div",
    { class: cx("card", game.note && "card--note"), style: tint(game.platform), ...opensNote },
    cover(game, { lazy: true }),
    body
  );
}
