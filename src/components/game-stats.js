import { h, cx } from "../ui/dom.js";
import {
  formatHours, formatPrice, formatRate, costPerHour, RATE_GOOD, RATE_POOR,
} from "../ui/format.js";

// The hours / price / cost-per-hour row shared by the grid card and the note.
// `graded` colours the rate by value, as the card does; the note leaves it
// neutral.
export function gameStats(game, { graded = false } = {}) {
  const rate = costPerHour(game);

  return h(
    "div",
    { class: "game-stats" },
    h("div", { class: "game-hours", text: formatHours(game.hours, { missing: "n/a", spaced: true }) }),
    h("div", { class: "game-price", text: formatPrice(game.price) }),
    rate == null
      ? null
      : h("div", {
          class: cx(
            "game-rate",
            graded && rate < RATE_GOOD && "is-good",
            graded && rate > RATE_POOR && "is-poor"
          ),
          text: formatRate(rate),
        })
  );
}
