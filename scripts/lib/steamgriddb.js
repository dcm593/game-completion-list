// SteamGridDB client, build-time only. Chosen over Steam's own CDN because
// the list spans PlayStation and Nintendo titles too, and over IGDB because
// it carries community art for mods and obscure releases.

const BASE = "https://www.steamgriddb.com/api/v2";

// Landscape art to match the 2:1 card header. Both tiers are the same aspect;
// 460x215 is still 2x for a 232px card, and the 920x430 PNGs run 700KB+ each,
// so the smaller tier is preferred and the larger one is the fallback.
const DIMENSIONS = "460x215,920x430";

function headers() {
  const key = process.env.STEAMGRIDDB;
  if (!key) {
    throw new Error(
      "Missing STEAMGRIDDB in .env. Run via `npm run covers` so --env-file is applied."
    );
  }
  return { Authorization: `Bearer ${key}` };
}

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) {
    throw new Error(`SteamGridDB ${res.status} on ${path}: ${(await res.text()).slice(0, 200)}`);
  }
  const body = await res.json();
  if (!body.success) throw new Error(`SteamGridDB returned success:false on ${path}`);
  return body.data;
}

export async function search(term) {
  return api(`/search/autocomplete/${encodeURIComponent(term)}`);
}

export async function grids(gameId) {
  return api(`/grids/game/${gameId}?dimensions=${DIMENSIONS}&types=static&nsfw=false&humor=false`);
}

// Community uploads vary wildly in quality. Rank by net votes first, then
// prefer the lighter file: the smaller tier, and a compressed format over a
// lossless one. A 920x430 PNG is typically 10x the bytes of the equivalent
// JPEG for art that renders at 232px wide.
const STYLE_RANK = { alternate: 3, material: 2, no_logo: 1, white_logo: 0, blurred: 0 };
const MIME_RANK = { "image/webp": 2, "image/jpeg": 1, "image/png": 0 };

export function pickBest(list) {
  return [...list].sort((a, b) => {
    const votes = (g) => (g.upvotes ?? 0) - (g.downvotes ?? 0);
    return (
      votes(b) - votes(a) ||
      a.width - b.width ||
      (MIME_RANK[b.mime] ?? 0) - (MIME_RANK[a.mime] ?? 0) ||
      (STYLE_RANK[b.style] ?? 0) - (STYLE_RANK[a.style] ?? 0)
    );
  })[0];
}

// The search endpoint is fuzzy and returns near-misses, so prefer an exact
// case-insensitive name match before falling back to the first result.
export function pickGame(results, term) {
  if (!results.length) return null;
  const wanted = term.trim().toLowerCase();
  return (
    results.find((r) => r.name.trim().toLowerCase() === wanted) ??
    results.find((r) => r.name.trim().toLowerCase().startsWith(wanted)) ??
    results[0]
  );
}

export const EXT_BY_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
