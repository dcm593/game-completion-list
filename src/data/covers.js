import { COVERS } from "./covers.generated.js";
import { slugify } from "./cover-overrides.js";

// Resolves a sheet title to its bundled cover asset. Returns null when a
// title has no art yet, so callers can fall back rather than render a broken
// image; the generated map is rebuilt by `npm run covers`.
export function coverFor(title) {
  return COVERS[slugify(title)] ?? null;
}
