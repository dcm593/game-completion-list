import { h, clear } from "../ui/dom.js";
import { PLAT } from "../ui/theme.js";
import { cover } from "./cover.js";

// A small card that follows the cursor over the scatter and hour bands, or
// on a touch screen, appears where one was tapped.
//
// Deliberately outside the app's state: every interaction there triggers a
// full re-render, which is fine for a click but not for mousemove. This owns
// one element, mutates it directly, and never touches state.
//
// It lives on document.body rather than inside the plot so it can't be clipped
// by the band track's overflow or the plot's bounds, and is positioned fixed
// so it needs no scroll compensation.

const OFFSET = 16;
const EDGE = 10;

let card = null;

// What the card is showing for: the target, its onHover callback, and
// whether it was pinned by a tap rather than following a mouse.
let active = null;

function element() {
  if (card) return card;
  card = h("div", { class: "hovercard" });
  document.body.append(card);
  return card;
}

export function hideHoverCard() {
  card?.classList.remove("is-shown");
  active?.onHover?.(false);
  active = null;
}

// Touch has no hover, so a tap pins the card instead, and it stays until
// the next tap elsewhere. It is fixed in place, so a scroll would leave it
// floating away from its dot - put it away then too.
document.addEventListener("pointerdown", (event) => {
  if (active?.pinned && !active.target.contains(event.target)) hideHoverCard();
});

window.addEventListener(
  "scroll",
  () => {
    if (active?.pinned) hideHoverCard();
  },
  { passive: true }
);

function place(x, y) {
  const el = element();
  const width = el.offsetWidth || 212;
  const height = el.offsetHeight || 150;

  // Flip to the other side of the cursor rather than letting the card run off
  // screen - dots near the right edge of the plot would otherwise be unusable.
  let left = x + OFFSET;
  let top = y + OFFSET;
  if (left + width > window.innerWidth - EDGE) left = x - OFFSET - width;
  if (top + height > window.innerHeight - EDGE) top = y - OFFSET - height;

  el.style.left = `${Math.max(EDGE, left)}px`;
  el.style.top = `${Math.max(EDGE, top)}px`;
}

// `rows` is [[label, value], ...] shown under the title.
function content(game, rows) {
  return [
    cover(game),
    h(
      "div",
      { class: "hovercard-body" },
      h(
        "div",
        { class: "hovercard-top" },
        h("div", { class: "dot" }),
        h("div", { class: "hovercard-platform", text: PLAT[game.pl].short })
      ),
      h("div", { class: "hovercard-title", text: game.t }),
      rows.length
        ? h(
            "div",
            { class: "hovercard-rows" },
            rows.map(([label, value]) =>
              h(
                "div",
                { class: "hovercard-row" },
                h("div", { class: "hovercard-key", text: label }),
                h("div", { class: "hovercard-value", text: value })
              )
            )
          )
        : null
    ),
  ];
}

function show(target, game, rows, onHover, event, pinned) {
  if (active && active.target !== target) hideHoverCard();
  const el = element();
  clear(el);
  el.style.setProperty("--pc", PLAT[game.pl].c);
  for (const node of content(game, rows)) el.append(node);
  el.classList.add("is-shown");
  place(event.clientX, event.clientY);
  active = { target, onHover, pinned };
  onHover?.(true);
}

// Wires hover behaviour onto `target`. `onHover` toggles whatever visual
// change the target itself needs (a scale, a lighter fill), so each view keeps
// its own styling and this only owns the card.
//
// A mouse gets the card while it hovers, following the cursor. Touch and pen
// get it on tap: pointerup only fires for a tap, since a drag that turns into
// a scroll is cancelled instead. Tapping the same target again closes it.
export function attachHoverCard(target, game, rows, onHover) {
  const isMouse = (event) => event.pointerType === "mouse";

  target.addEventListener("pointerenter", (event) => {
    if (isMouse(event)) show(target, game, rows, onHover, event, false);
  });

  target.addEventListener("pointermove", (event) => {
    if (isMouse(event) && active?.target === target) place(event.clientX, event.clientY);
  });

  target.addEventListener("pointerleave", (event) => {
    if (isMouse(event)) hideHoverCard();
  });

  target.addEventListener("pointerup", (event) => {
    if (isMouse(event)) return;
    if (active?.target === target) hideHoverCard();
    else show(target, game, rows, onHover, event, true);
  });
}
