import { h, cx } from "../ui/dom.js";

// The landscape header art shared by the grid cards, the podium, the hover
// card and the note. The fade at its foot runs through the platform tint
// (--pc, inherited from the surrounding card) into the card surface, so the
// seam doesn't read as a hard edge.
//
// Entries with no art - an unranked podium placeholder, or a title the fetch
// couldn't resolve - get a diagonal hatch instead.
export function cover(game, { lazy = false } = {}) {
  return h(
    "div",
    { class: cx("cover", !game.art && "cover--empty") },
    game.art
      ? h("img", {
          src: game.art,
          alt: "",
          // 76 images on one page: the grid defers everything below the fold.
          loading: lazy ? "lazy" : null,
          decoding: "async",
        })
      : null,
    h("div", { class: "cover-fade" })
  );
}
