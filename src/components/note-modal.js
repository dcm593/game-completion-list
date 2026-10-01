import { h } from "../ui/dom.js";
import { platformOf, tint } from "../ui/theme.js";
import { cover } from "./cover.js";
import { gameStats } from "./game-stats.js";

// The sheet note, shown over the page rather than inside the card.
//
// Expanding a note in place pushed every card after it down and changed the
// height of its own row, so reading one note rearranged the grid around it.
// An overlay leaves the layout untouched.
//
// Closes on the backdrop, the close button, and Escape. Escape and the focus
// handling live in app.js, which opens and closes this.
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
        // Focusable so it can take focus on open without putting a focus ring
        // on the close button for mouse users.
        tabindex: "-1",
        "aria-label": `Note for ${game.title}`,
        onclick: (event) => event.stopPropagation(),
        class: "note",
        style: tint(game.platform),
      },
      cover(game),
      h("button", { onclick: onClose, "aria-label": "Close", class: "note-close", text: "×" }),
      h(
        "div",
        { class: "note-body" },
        h(
          "div",
          { class: "note-top" },
          h("div", { class: "dot" }),
          h("div", { class: "note-platform", text: platformOf(game.platform).short }),
          h("div", { class: "note-year", text: String(game.year) })
        ),
        h("div", { class: "note-title", text: game.title }),
        gameStats(game),
        h("div", { class: "note-label", text: "SHEET NOTE" }),
        h("div", { class: "note-text", text: game.note })
      )
    )
  );
}
