// The stylesheet handles nearly every layout change on its own. The exception
// is the scatter, whose plot geometry is computed here in JS, so it needs to
// know which side of the phone breakpoint it is drawing for.
//
// Keep NARROW in step with the 720px breakpoint in src/styles/.

const NARROW = window.matchMedia("(max-width: 720px)");

export const isNarrow = () => NARROW.matches;

export function onNarrowChange(fn) {
  NARROW.addEventListener("change", fn);
}
