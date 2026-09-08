import { h } from "../ui/dom.js";
import { PLAT, MONO, SANS, INK, dim, line, alpha } from "../ui/theme.js";

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
  const col = PLAT[game.pl].c;

  return h(
    "div",
    {
      // Clicking the backdrop closes; the dialog below stops propagation so a
      // click inside doesn't bubble up to this.
      onclick: onClose,
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(6,6,9,.72)",
        backdropFilter: "blur(6px)",
      },
    },
    h(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": `Note for ${game.t}`,
        onclick: (event) => event.stopPropagation(),
        style: {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "min(520px, 100%)",
          maxHeight: "min(80vh, 640px)",
          overflow: "hidden",
          borderRadius: "16px",
          background: "#12121a",
          border: `1px solid ${alpha(col, ".4")}`,
          boxShadow: `0 0 0 1px ${line(".04")}, 0 30px 80px -20px rgba(0,0,0,.8), 0 0 60px -30px ${col}`,
        },
      },
      art(game, col),
      closeButton(onClose),
      body(game, col)
    )
  );
}

function art(game, col) {
  return h(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        aspectRatio: "2.6 / 1",
        flex: "none",
        overflow: "hidden",
        background: game.art ? "#0d0d14" : line(".04"),
      },
    },
    game.art
      ? h("img", {
          src: game.art,
          alt: "",
          decoding: "async",
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
        background: `linear-gradient(180deg, transparent 40%, ${alpha(col, ".3")} 78%, #12121a)`,
        pointerEvents: "none",
      },
    })
  );
}

function closeButton(onClose) {
  return h("button", {
    onclick: onClose,
    "aria-label": "Close",
    text: "×",
    style: {
      position: "absolute",
      top: "12px",
      right: "12px",
      width: "30px",
      height: "30px",
      borderRadius: "99px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      border: `1px solid ${line(".14")}`,
      background: "rgba(6,6,9,.6)",
      backdropFilter: "blur(4px)",
      color: INK,
      font: `400 18px/1 ${SANS}`,
      padding: 0,
    },
  });
}

function body(game, col) {
  const rate = game.h && game.p > 0 ? `$${(game.p / game.h).toFixed(2)}/h` : null;

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "4px 22px 24px",
        overflowY: "auto",
        minHeight: 0,
      },
    },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "8px" } },
      h("div", {
        style: {
          width: "7px",
          height: "7px",
          borderRadius: "99px",
          background: col,
          boxShadow: `0 0 10px ${col}`,
          flex: "none",
        },
      }),
      h("div", {
        style: { font: `500 8.5px/1 ${MONO}`, letterSpacing: ".12em", color: dim(".5") },
        text: PLAT[game.pl].short,
      }),
      h("div", { style: { flex: 1 } }),
      h("div", {
        style: { font: `500 9px/1 ${MONO}`, letterSpacing: ".12em", color: dim(".35") },
        text: String(game.y),
      })
    ),

    h("div", {
      style: {
        font: `600 20px/1.25 ${SANS}`,
        letterSpacing: "-.01em",
        textWrap: "pretty",
        color: INK,
      },
      text: game.t,
    }),

    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "baseline",
          gap: "14px",
          flexWrap: "wrap",
          paddingBottom: "14px",
          borderBottom: `1px solid ${line(".1")}`,
        },
      },
      h("div", {
        style: { font: `600 16px/1 ${SANS}`, letterSpacing: "-.02em" },
        text: game.h ? `${game.h} h` : "n/a",
      }),
      h("div", {
        style: { font: `500 11px/1 ${MONO}`, color: dim(".55") },
        text: game.p === 0 ? "free" : `$${game.p.toFixed(2)}`,
      }),
      h("div", { style: { flex: 1 } }),
      rate ? h("div", { style: { font: `500 10.5px/1 ${MONO}`, color: dim(".4") }, text: rate }) : null
    ),

    h("div", {
      style: { font: `500 8.5px/1 ${MONO}`, letterSpacing: ".14em", color: dim(".3") },
      text: "SHEET NOTE",
    }),
    h("div", {
      style: { font: `400 13.5px/1.65 ${SANS}`, color: dim(".78"), textWrap: "pretty" },
      text: game.note,
    })
  );
}
