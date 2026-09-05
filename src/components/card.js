import { h } from "../ui/dom.js";
import { PLAT, MONO, SANS, INK, dim, line, alpha, badge, GOOD, WARN } from "../ui/theme.js";
import { platinumIcon, perfectIcon } from "../ui/icons.js";

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

const MEDAL_SIZE = 22;

function medal(title, glyph) {
  return h(
    "div",
    {
      title,
      style: {
        width: `${MEDAL_SIZE}px`,
        height: `${MEDAL_SIZE}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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

  const body = h(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "14px 15px",
      },
    },
    // Platform tint bleeding down from the art above.
    h("div", {
      style: {
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, ${alpha(col, ".2")}, transparent 55%)`,
        pointerEvents: "none",
      },
    }),

    // Fixed height so a card without a completion mark lines up with one that
    // has it — the same drift the title and badge rows had.
    h(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minHeight: `${MEDAL_SIZE}px`,
        },
      },
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
      game.plat ? medal("Platinum trophy", platinumIcon(MEDAL_SIZE)) : null,
      game.hundred ? medal("100% achievements", perfectIcon(MEDAL_SIZE)) : null
    ),

    // Always two lines tall, whether or not the title wraps, so the rows
    // below start at the same height on every card. The longest title in the
    // list is 44 characters and its longest word is 11, so two lines is
    // enough at every column width; the clamp is a guard rather than an
    // expected truncation, and the tooltip keeps the full text reachable.
    h("div", {
      title: game.t,
      style: {
        position: "relative",
        font: `600 14px/1.3 ${SANS}`,
        letterSpacing: "-.01em",
        textWrap: "pretty",
        color: INK,
        minHeight: "2.6em",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 2,
        overflow: "hidden",
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

    // Rendered even when empty. 43 of 76 cards carry no badges, and letting
    // the row collapse was the largest source of misalignment across a grid.
    h(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          gap: "5px",
          flexWrap: "wrap",
          minHeight: "19px",
        },
      },
      badges.map(([text, c]) => h("div", { style: badge(c), text }))
    ),

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

  return h(
    "div",
    {
      style: {
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRadius: "13px",
        background: "#12121a",
        border: `1px solid ${line(".08")}`,
        cursor: game.note ? "pointer" : "default",
      },
      onclick: game.note ? onToggle : null,
    },
    art(game, col),
    body
  );
}

// 2:1 landscape header. The gradient at the foot of the image carries the
// artwork into the card body so the seam doesn't read as a hard edge.
function art(game, col) {
  return h(
    "div",
    {
      style: {
        position: "relative",
        width: "100%",
        aspectRatio: "2 / 1",
        overflow: "hidden",
        background: game.art
          ? "#0d0d14"
          : "repeating-linear-gradient(135deg, rgba(255,255,255,.055) 0 6px, rgba(255,255,255,.015) 6px 12px)",
      },
    },
    game.art
      ? h("img", {
          src: game.art,
          alt: "",
          // 76 images on one page: defer everything below the fold.
          loading: "lazy",
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
