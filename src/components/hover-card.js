import { h, clear } from "../ui/dom.js";
import { PLAT, MONO, SANS, INK, dim, line, alpha } from "../ui/theme.js";

// A small card that follows the cursor over the scatter and hour bands.
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

function element() {
  if (card) return card;
  card = h("div", {
    style: {
      position: "fixed",
      top: "0",
      left: "0",
      zIndex: 200,
      width: "212px",
      pointerEvents: "none",
      visibility: "hidden",
      opacity: "0",
      transform: "translateZ(0)",
      transition: "opacity .12s ease",
      overflow: "hidden",
      borderRadius: "11px",
      background: "#12121a",
      border: `1px solid ${line(".12")}`,
      boxShadow: "0 18px 40px -12px rgba(0,0,0,.85)",
    },
  });
  document.body.append(card);
  return card;
}

export function hideHoverCard() {
  if (!card) return;
  card.style.opacity = "0";
  card.style.visibility = "hidden";
}

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
  const col = PLAT[game.pl].c;

  return [
    h(
      "div",
      {
        style: {
          position: "relative",
          width: "100%",
          aspectRatio: "2 / 1",
          overflow: "hidden",
          background: game.art ? "#0d0d14" : line(".05"),
        },
      },
      game.art
        ? h("img", {
            src: game.art,
            alt: "",
            style: {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            },
          })
        : null,
      h("div", {
        style: {
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 45%, ${alpha(col, ".25")} 82%, #12121a)`,
        },
      })
    ),

    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: "7px",
          padding: "2px 12px 12px",
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "7px" } },
        h("div", {
          style: {
            width: "6px",
            height: "6px",
            borderRadius: "99px",
            background: col,
            boxShadow: `0 0 8px ${col}`,
            flex: "none",
          },
        }),
        h("div", {
          style: { font: `500 8px/1 ${MONO}`, letterSpacing: ".12em", color: dim(".5") },
          text: PLAT[game.pl].short,
        })
      ),
      h("div", {
        style: {
          font: `600 13px/1.3 ${SANS}`,
          letterSpacing: "-.01em",
          textWrap: "pretty",
          color: INK,
        },
        text: game.t,
      }),
      rows.length
        ? h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                paddingTop: "7px",
                borderTop: `1px solid ${line(".1")}`,
              },
            },
            rows.map(([label, value]) =>
              h(
                "div",
                { style: { display: "flex", alignItems: "baseline", gap: "8px" } },
                h("div", {
                  style: { font: `500 8px/1.4 ${MONO}`, letterSpacing: ".1em", color: dim(".35") },
                  text: label,
                }),
                h("div", { style: { flex: 1 } }),
                h("div", { style: { font: `500 11px/1.4 ${MONO}`, color: dim(".75") }, text: value })
              )
            )
          )
        : null
    ),
  ];
}

// Wires hover behaviour onto `target`. `onHover` toggles whatever visual
// change the target itself needs (a scale, a lighter fill), so each view keeps
// its own styling and this only owns the card.
export function attachHoverCard(target, game, rows, onHover) {
  target.addEventListener("mouseenter", (event) => {
    const el = element();
    clear(el);
    for (const node of content(game, rows)) el.append(node);
    el.style.visibility = "visible";
    el.style.opacity = "1";
    place(event.clientX, event.clientY);
    onHover?.(true);
  });

  target.addEventListener("mousemove", (event) => place(event.clientX, event.clientY));

  target.addEventListener("mouseleave", () => {
    hideHoverCard();
    onHover?.(false);
  });
}
