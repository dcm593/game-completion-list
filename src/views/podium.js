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

  const card = h(
    "div",
    {
      style: {
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRadius: "14px",
        background: "#12121a",
        border: `1px solid ${alpha(col, first ? ".5" : ".3")}`,
        boxShadow: `0 0 0 1px ${line(".03")}, 0 18px 44px -18px ${alpha(col, first ? ".75" : ".4")}`,
        minHeight: first ? "310px" : "268px",
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
        zIndex: 1,
      },
    }),
    art(game, col),
    body(game, col, first, rate)
  );

  // The rank sits under the card rather than inside it, so the artwork can run
  // edge to edge the way it does on the grid cards.
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 } },
    card,
    h("div", {
      style: {
        font: `700 ${first ? "15px" : "13px"}/1 ${MONO}`,
        letterSpacing: ".04em",
        color: MEDAL[rank],
        textAlign: "center",
      },
      text: `#${rank + 1}`,
    })
  );
}

// Full-bleed 2:1 header, matching the grid cards. The wider first-place column
// therefore gets taller art, which keeps the winner visually raised.
function art(game, col) {
  return h(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        aspectRatio: "2 / 1",
        overflow: "hidden",
        // The diagonal hatch is the backdrop for entries with no art: an
        // unranked placeholder, or a title the fetch couldn't resolve.
        background: game.art
          ? "#0d0d14"
          : "repeating-linear-gradient(135deg, rgba(255,255,255,.055) 0 6px, rgba(255,255,255,.015) 6px 12px)",
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
        background: `linear-gradient(180deg, transparent 45%, ${alpha(col, ".25")} 80%, #12121a)`,
        pointerEvents: "none",
      },
    })
  );
}

function body(game, col, first, rate) {
  return h(
    "div",
    {
      style: {
        position: "relative",
        zIndex: 2,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: first ? "16px 18px 16px" : "14px 15px 14px",
      },
    },
    // Titles read exactly as written in the sheet's Top 3 block, rather than
    // borrowing the longer row title from the games table.
    h("div", {
      style: {
        font: `600 ${first ? "19px" : "15px"}/1.2 ${SANS}`,
        letterSpacing: "-.01em",
        textWrap: "pretty",
        color: game.placeholder ? dim(".4") : INK,
      },
      text: game.t,
    }),
    // The platform is named here, so the badge that used to sit in the card's
    // top corner would only have repeated it.
    h("div", {
      style: { font: `500 9px/1 ${MONO}`, letterSpacing: ".1em", color: dim(".45") },
      text: game.placeholder ? "" : PLAT[game.pl].short,
    }),

    h("div", { style: { flex: 1, minHeight: "8px" } }),

    h(
      "div",
      {
        style: {
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
