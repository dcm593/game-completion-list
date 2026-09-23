import { h } from "../ui/dom.js";
import { PLAT, tint } from "../ui/theme.js";
import { cover } from "./cover.js";

// The sheet note, shown over the page rather than inside the card.
//
// Expanding a note in place pushed every card after it down and changed the
// height of its own row, so reading one note rearranged the grid around it.
// An overlay leaves the layout untouched.
//
// Closes on the backdrop, the close button, and Escape. The Escape handler
// lives in app.js, since render() rebuilds this element on every state change
// and a listener added here would stack up.
export function noteModal(game, { onClose }) {
  return h(
    "div",
    {
      // Clicking the backdrop closes; the dialog below stops propagation so a
      // click inside doesn't bubble up to this.
      onclick: onClose,
      class: "note-backdrop",
    },
    h(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": `Note for ${game.t}`,
        onclick: (event) => event.stopPropagation(),
        class: "note",
        style: tint(game.pl),
      },
      cover(game),
      h("button", { onclick: onClose, "aria-label": "Close", class: "note-close", text: "×" }),
      body(game)
    )
  );
}

function body(game) {
  const rate = game.h && game.p > 0 ? `$${(game.p / game.h).toFixed(2)}/h` : null;

  return h(
    "div",
    { class: "note-body" },
    h(
      "div",
      { class: "note-top" },
      h("div", { class: "dot" }),
      h("div", { class: "note-platform", text: PLAT[game.pl].short }),
      h("div", { class: "note-year", text: String(game.y) })
    ),

    h("div", { class: "note-title", text: game.t }),

    h(
      "div",
      { class: "note-stats" },
      h("div", { class: "note-hours", text: game.h ? `${game.h} h` : "n/a" }),
      h("div", { class: "note-price", text: game.p === 0 ? "free" : `$${game.p.toFixed(2)}` }),
      rate ? h("div", { class: "note-rate", text: rate }) : null
    ),

    h("div", { class: "note-label", text: "SHEET NOTE" }),
    h("div", { class: "note-text", text: game.note })
  );
}
