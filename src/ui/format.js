// How hours, prices and value read on the page, in one place so a game reads
// the same wherever it appears, plus the thresholds that grade value.

// "14.5h". The card and note stat rows set the unit apart ("14.5 h") with
// `spaced`. `missing` is what a game with no recorded hours shows instead.
export function formatHours(hours, { missing = "—", spaced = false } = {}) {
  if (hours == null) return missing;
  return spaced ? `${hours} h` : `${hours}h`;
}

// "$26.79", or "free" for a game that cost nothing. `whole` rounds to the
// dollar, as the podium does. A blank price cell parses to null, which reads
// as a dash here rather than throwing in the middle of a render.
export function formatPrice(price, { whole = false } = {}) {
  if (price == null) return "—";
  if (price === 0) return "free";
  return `$${price.toFixed(whole ? 0 : 2)}`;
}

// Dollars per hour played, or null when there is nothing to divide: no
// recorded hours, or a game that cost nothing.
export const costPerHour = ({ hours, price }) => (hours > 0 && price > 0 ? price / hours : null);

export const formatRate = (rate) => `$${rate.toFixed(2)}/h`;

// Card colouring: under a dollar an hour reads as good value, over five as
// poor value, and anything between is left neutral.
export const RATE_GOOD = 1;
export const RATE_POOR = 5;

// Scatter callouts: points this far out either way get a numbered key. They
// are fixed thresholds, so a year can have none or several.
export const RATE_BARGAIN = 0.2;
export const RATE_STEEP = 4.5;
