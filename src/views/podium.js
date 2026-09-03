import { h } from "../ui/dom.js";
import { PLAT, MEDAL, MONO, SANS, INK, dim, line, alpha } from "../ui/theme.js";

// Rendered 2nd - 1st - 3rd so the winner sits raised in the middle.
const ARRANGEMENT = [1, 0, 2];

export function podium(entries) {
  return h(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1.24fr 1fr",
        gap: "18px",
        alignItems: "end",
      },
    },
    ARRANGEMENT.map((rank) => entries[rank] && place(entries[rank], rank))
  );
}

function place(game, rank) {
  const col = PLAT[game.pl].c;
  const first = rank === 0;
  const known = game.h != null && game.p != null;
  const rate = !known ? "—" : game.p > 0 ? `$${(game.p / game.h).toFixed(2)}/h` : "free";

  return h(
    "div",
    {
      style: {
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: first ? "20px 20px 18px" : "16px 17px 15px",
        borderRadius: "14px",
        background: "#12121a",
        border: `1px solid ${alpha(col, first ? ".5" : ".3")}`,
        boxShadow: `0 0 0 1px ${line(".03")}, 0 18px 44px -18px ${alpha(col, first ? ".75" : ".4")}`,
        minHeight: first ? "330px" : "288px",
      },
    },
    h("div", {
      style: {
        position: "absolute",
        left: "50%",
        top: "-70px",
        transform: "translateX(-50%)",
        width: "120%",
        height: "190px",
        background: `radial-gradient(closest-side, ${alpha(col, first ? ".4" : ".24")}, transparent)`,
        pointerEvents: "none",
      },
    }),

    h(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        },
      },
      h("div", {
        style: {
          font: `700 ${first ? "15px" : "13px"}/1 ${MONO}`,
          letterSpacing: ".02em",
          color: MEDAL[rank],
        },
        text: `#${rank + 1}`,
      }),
      h("div", {
        style: {
          font: `500 8.5px/1 ${MONO}`,
          letterSpacing: ".1em",
          padding: "5px 7px",
          borderRadius: "4px",
          color: col,
          background: alpha(col, ".14"),
          border: `1px solid ${alpha(col, ".32")}`,
          whiteSpace: "nowrap",
          flex: "none",
        },
        text: first ? PLAT[game.pl].short : PLAT[game.pl].abbr,
      })
    ),

    h("div", {
      style: {
        position: "relative",
        flex: 1,
        minHeight: first ? "120px" : "96px",
        borderRadius: "10px",
        border: `1px solid ${line(".08")}`,
        background:
          "repeating-linear-gradient(135deg, rgba(255,255,255,.055) 0 6px, rgba(255,255,255,.015) 6px 12px)",
      },
    }),

    // Titles read exactly as written in the sheet's Top 3 block, rather than
    // borrowing the longer row title from the games table.
    h("div", {
      style: {
        position: "relative",
        font: `600 ${first ? "19px" : "15px"}/1.2 ${SANS}`,
        letterSpacing: "-.01em",
        textWrap: "pretty",
        color: game.placeholder ? dim(".4") : INK,
      },
      text: game.t,
    }),
    h("div", {
      style: { position: "relative", font: `500 9px/1 ${MONO}`, letterSpacing: ".1em", color: dim(".35") },
      text: game.placeholder ? "NOT YET RANKED" : PLAT[game.pl].short,
    }),

    h(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "baseline",
          gap: "16px",
          flexWrap: "wrap",
          paddingTop: "12px",
          borderTop: `1px solid ${line(".1")}`,
        },
      },
      h("div", {
        style: { font: `600 ${first ? "26px" : "21px"}/1 ${SANS}`, letterSpacing: "-.02em" },
        text: game.h == null ? "—" : `${game.h}h`,
      }),
      h("div", {
        style: {
          font: `600 ${first ? "26px" : "21px"}/1 ${SANS}`,
          letterSpacing: "-.02em",
          color: dim(".62"),
        },
        text: game.p == null ? "—" : game.p === 0 ? "free" : `$${game.p.toFixed(0)}`,
      }),
      h("div", { style: { flex: 1 } }),
      h("div", { style: { font: `500 10.5px/1 ${MONO}`, color: dim(".4") }, text: rate })
    )
  );
}
