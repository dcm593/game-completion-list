import { h, cx } from "../ui/dom.js";
import { SMALL_WIDTH } from "../data/covers.generated.js";

// The landscape header art shared by the grid cards, the podium, the hover
// card and the note. The fade at its foot runs through the platform tint
// (--pc, inherited from the surrounding card) into the card surface, so the
// seam doesn't read as a hard edge.
//
// Every cover comes in two sizes (see scripts/fetch-covers.js). `sizes` says
// how wide this particular use draws it, and the browser picks whichever file
// covers that at the screen's pixel density - so a grid card usually gets the
// small copy and the podium's winner the full one.
//
// Entries with no art - an unranked podium placeholder, or a title the fetch
// couldn't resolve - get a diagonal hatch instead.
export function cover(game, { lazy = false, sizes } = {}) {
  const { art } = game;
  const srcset =
    art && art.width > SMALL_WIDTH ? `${art.small} ${SMALL_WIDTH}w, ${art.large} ${art.width}w` : null;

  return h(
    "div",
    { class: cx("cover", !art && "cover--empty") },
    art
      ? h("img", {
          src: art.large,
          srcset,
          sizes: srcset ? sizes : null,
          alt: "",
          // Every game's art is on one page, so anything below the fold is
          // deferred.
          loading: lazy ? "lazy" : null,
          decoding: "async",
        })
      : null,
    h("div", { class: "cover-fade" })
  );
}

// How wide each use draws a cover, in CSS px, for `sizes`. Kept beside each
// other so a layout change that widens one is easy to carry over here.
export const COVER_SIZES = {
  // 2 columns on a phone, and up to ~355px between the two breakpoints. The
  // desktop grid draws ~230-315px; 300 lets a 2x screen take the 600px copy,
  // a few percent soft only at the widest three-column point.
  grid: "(max-width: 720px) 50vw, (max-width: 1100px) 360px, 300px",
  hover: "212px",
  podiumFirst: "(max-width: 720px) 100vw, 440px",
  podiumRunner: "(max-width: 720px) 160px, 360px",
  note: "(max-width: 720px) 100vw, 520px",
};
