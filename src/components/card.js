import { h } from "../ui/dom.js";
import { PLAT, MONO, SANS, INK, dim, line, alpha, badge, GOOD, WARN } from "../ui/theme.js";

const TROPHY = "oklch(0.80 0.11 254)";
const HUNDRED = "oklch(0.80 0.13 168)";

// Three ways a completion figure can be absent, and they are not the same:
// a bar at 100%, a partial bar, or no bar at all — either because the game
// has no achievement system ("N/A") or because it isn't filled in yet ("—").
function completionParts(game, platformColor) {
  const done = game.plat || game.hundred;
  const pct = done ? 100 : game.pct;
  const color =
    pct == null ? dim(".3") : pct === 100 ? (game.hundred ? HUNDRED : TROPHY) : platformColor;

  const text =
    pct != null
      ? `${pct}%`
      : game.pctState === "not-applicable"
        ? "N/A"
        : "—";

  return { pct, color, text };
}

function medal(color, glyph, title) {
  return h(
    "div",
    {
      title,
      style: {
        width: "22px",
        height: "22px",
        borderRadius: "99px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: alpha(color, ".18"),
        border: `1px solid ${alpha(color, ".45")}`,
        font: `700 9px/1 ${MONO}`,
        color,
        flex: "none",
      },
    },
    glyph
  );
}

export function card(game, { isOpen, onToggle }) {
  const col = PLAT[game.pl].c;
  const { pct, color, text } = completionParts(game, col);
  const rate = game.h && game.p > 0 ? game.p / game.h : null;

  const badges = [];
  if (game.coop) badges.push(["CO-OP", "oklch(0.70 0.13 25)"]);
  if (game.replay) badges.push(["REPLAY", "oklch(0.70 0.13 300)"]);
  if (game.note) badges.push(["NOTE", "oklch(0.70 0.13 85)"]);

  return h(
    "div",
    {
      style: {
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "14px 15px",
        borderRadius: "13px",
        background: "#12121a",
        border: `1px solid ${line(".08")}`,
        cursor: game.note ? "pointer" : "default",
      },
      onclick: game.note ? onToggle : null,
    },
    // Platform tint bleeding down from the top edge.
    h("div", {
      style: {
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, ${alpha(col, ".2")}, transparent 55%)`,
        pointerEvents: "none",
      },
    }),

    h(
      "div",
      { style: { position: "relative", display: "flex", alignItems: "center", gap: "8px" } },
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
      game.plat ? medal(TROPHY, "PS", "Platinum trophy") : null,
      game.hundred ? medal(HUNDRED, "100", "100% achievements") : null
    ),

    h("div", {
      style: {
        position: "relative",
        font: `600 14px/1.3 ${SANS}`,
        letterSpacing: "-.01em",
        textWrap: "pretty",
        color: INK,
      },
      text: game.t,
    }),

    // Completion bar. Title carries the raw fraction so the exact counts stay
    // reachable without cluttering the card.
    h(
      "div",
      { style: { position: "relative", display: "flex", flexDirection: "column", gap: "5px" } },
      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between" } },
        h("div", {
          style: { font: `500 8.5px/1 ${MONO}`, letterSpacing: ".12em", color: dim(".35") },
          text: "COMPLETION",
        }),
        h("div", {
          title: game.pctDetail ?? "",
          style: { font: `500 10px/1 ${MONO}`, letterSpacing: ".06em", color },
          text: game.pctDetail && pct !== 100 ? `${game.pctDetail} · ${text}` : text,
        })
      ),
      h(
        "div",
        { style: { height: "4px", borderRadius: "2px", background: line(".07"), overflow: "hidden" } },
        h("div", {
          style: {
            height: "100%",
            width: `${pct || 0}%`,
            borderRadius: "2px",
            background: color,
            boxShadow: pct === 100 ? `0 0 10px ${color}` : "none",
          },
        })
      )
    ),

    h(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "baseline",
          gap: "10px",
          flexWrap: "wrap",
        },
      },
      h("div", {
        style: { font: `600 15px/1 ${SANS}`, letterSpacing: "-.02em" },
        text: game.h ? `${game.h} h` : "n/a",
      }),
      h("div", {
        style: { font: `500 11px/1 ${MONO}`, color: dim(".55") },
        text: game.p === 0 ? "free" : `$${game.p.toFixed(2)}`,
      }),
      h("div", { style: { flex: 1 } }),
      rate
        ? h("div", {
            style: {
              font: `500 10.5px/1 ${MONO}`,
              color: rate < 1 ? GOOD : rate > 5 ? WARN : dim(".4"),
            },
            text: `$${rate.toFixed(2)}/h`,
          })
        : null
    ),

    badges.length
      ? h(
          "div",
          { style: { position: "relative", display: "flex", gap: "5px", flexWrap: "wrap" } },
          badges.map(([text, c]) => h("div", { style: badge(c), text }))
        )
      : null,

    isOpen && game.note
      ? h("div", {
          style: {
            position: "relative",
            font: `400 11.5px/1.55 ${SANS}`,
            color: dim(".62"),
            padding: "10px 11px",
            borderRadius: "8px",
            background: line(".04"),
            border: `1px solid ${line(".07")}`,
          },
          text: game.note,
        })
      : null
  );
}
