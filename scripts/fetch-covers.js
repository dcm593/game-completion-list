// Build-time cover art fetch: SteamGridDB -> src/assets/covers/ (committed).
//
//   npm run covers            resolve anything not already downloaded
//   npm run covers -- --force re-resolve everything
//   npm run covers -- --dry   report resolutions without downloading
//
// Downloading rather than hotlinking keeps the deployed page static and self
// contained: no third-party request at view time, and art can't vanish when
// someone reorganises a CDN.
//
// Every resolution is printed with the name SteamGridDB actually matched, so a
// wrong match is visible immediately and can be corrected by adding an entry
// to src/data/cover-overrides.js.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import {
  search, grids, heroes, pickBest, pickGame, download, EXT_BY_MIME, PREFERRED_STYLE,
} from "./lib/steamgriddb.js";
import { COVER_OVERRIDES, normalizeTitle, slugify } from "../src/data/cover-overrides.js";

const ROOT = new URL("..", import.meta.url);
const COVER_DIR = new URL("src/assets/covers/", ROOT);
const MANUAL_DIR = new URL("src/assets/covers/manual/", ROOT);
const GENERATED = new URL("src/data/covers.generated.js", ROOT);

const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry");

const games = JSON.parse(readFileSync(new URL("src/data/games.json", ROOT), "utf8"));

mkdirSync(COVER_DIR, { recursive: true });
mkdirSync(MANUAL_DIR, { recursive: true });

const existing = new Map(
  readdirSync(COVER_DIR, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => [e.name.replace(/\.[^.]+$/, ""), e.name])
);

// One row per distinct title; DELTARUNE's three chapters share one lookup.
const titles = [...new Set(games.games.map((g) => g.title))];

// An override is keyed by the exact sheet title, so correcting a spelling in
// the sheet silently orphans its entry: the row quietly falls back to a search
// and the hand-picked art is bypassed with nothing in the output to say so.
// Catch that here rather than noticing the wrong cover on the page.
const staleKeys = Object.keys(COVER_OVERRIDES).filter((k) => !titles.includes(k));
if (staleKeys.length) {
  console.warn(`${staleKeys.length} override key(s) match no sheet title - the row will fall back to a search:`);
  for (const key of staleKeys) console.warn(`  ${JSON.stringify(key)}`);
  console.warn("");
}

// SteamGridDB replaces a taken-down asset with a notice image rather than
// removing the grid or returning 404, so it arrives as a perfectly valid
// download. These are the notice's bytes in each format it is served as.
const TAKEDOWN_HASHES = new Set([
  "1ab8729afaf358324310103f70a18af4fab2d1400c8609e9b8614aac3fd8e327",
  "b5ff23579789605a4413f2c742dcfac7f8b70f723d82e15c608c1674bb7d67cd",
]);

function isTakedown(buffer) {
  return TAKEDOWN_HASHES.has(createHash("sha256").update(buffer).digest("hex"));
}

// Hero art is served at 1920x620 and averages ~700KB, which is roughly 8x more
// pixels than the largest place it is ever drawn. Its thumbnail is 849x274
// JPEG at ~67KB - still 3.6x oversampled for a 232px card and 2x for the
// podium - so heroes are taken from the thumbnail. Grids are already small
// enough to use as-is.
function assetUrl(candidate, source) {
  return source === "hero" && candidate.thumb ? candidate.thumb : candidate.url;
}

function extensionOf(url) {
  const match = url.split("?")[0].match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : null;
}

// Webpack copies whatever bytes it is given, so a hand-supplied file that
// isn't actually an image builds cleanly and only fails in the browser, as a
// silently broken <img>. Sniffing the magic number turns that into a warning
// here instead. A wrong extension is harmless - browsers sniff content too -
// but it is worth reporting so the tree stays honest.
const SIGNATURES = [
  ["jpg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["png", (b) => b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG"],
  ["gif", (b) => b.toString("ascii", 0, 3) === "GIF"],
  ["webp", (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP"],
  ["avif", (b) => b.toString("ascii", 4, 8) === "ftyp" && /avif|heic|mif1/.test(b.toString("ascii", 8, 12))],
  ["svg", (b) => /^\s*(<\?xml|<svg)/.test(b.toString("utf8", 0, 64))],
];

function sniffImage(buffer) {
  if (buffer.length < 16) return null;
  return SIGNATURES.find(([, test]) => test(buffer))?.[0] ?? null;
}

const resolved = new Map();
const failures = [];
const takedowns = [];
const badFiles = [];
const mislabelled = [];
let fetched = 0;

for (const title of titles) {
  const slug = slugify(title);
  const override = COVER_OVERRIDES[title] ?? {};

  if (override.file) {
    const path = new URL(override.file, MANUAL_DIR);
    if (!existsSync(path)) {
      badFiles.push({ title, file: override.file, reason: "file not found" });
    } else {
      const kind = sniffImage(readFileSync(path));
      const ext = extensionOf(override.file);
      if (!kind) {
        badFiles.push({ title, file: override.file, reason: "not a recognisable image" });
      } else if (kind !== ext && !(kind === "jpg" && ext === "jpeg")) {
        mislabelled.push({ file: override.file, ext, kind });
      }
    }
    resolved.set(slug, { file: `manual/${override.file}`, via: "manual" });
    continue;
  }

  if (!force && existing.has(slug)) {
    resolved.set(slug, { file: existing.get(slug), via: "cached" });
    continue;
  }

  const term = override.search ?? normalizeTitle(title);

  try {
    let gameId = override.id;
    let matchedName = override.id ? `id:${override.id}` : null;

    if (!gameId) {
      const hits = await search(term);
      const game = pickGame(hits, term);
      if (!game) {
        failures.push({ title, term, reason: "no search result" });
        continue;
      }
      gameId = game.id;
      matchedName = game.name;
    }

    // Text-free art first, in descending order of how reliably it is clean:
    // hero banners, then grids explicitly tagged no_logo, then anything.
    let art = await heroes(gameId);
    let source = "hero";

    if (!art.length) {
      art = await grids(gameId, PREFERRED_STYLE);
      source = "no_logo grid";
    }
    if (!art.length) {
      art = await grids(gameId);
      source = "grid (has logo)";
    }

    const textFree = source !== "grid (has logo)";

    if (!art.length) {
      failures.push({ title, term, reason: `no landscape art (matched "${matchedName}")` });
      continue;
    }

    // A grid whose asset has been taken down still appears in the listing;
    // the CDN just serves a notice image instead. That only shows up in the
    // bytes, so download, check, and fall through to the next candidate.
    const rejected = [];
    let best = null;
    let bytes = null;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = pickBest(art, { exclude: rejected });
      if (!candidate) break;
      if (dryRun) {
        best = candidate;
        break;
      }
      const buf = await download(assetUrl(candidate, source));
      if (isTakedown(buf)) {
        rejected.push(candidate.id);
        takedowns.push({ title, gridId: candidate.id });
        await sleep(140);
        continue;
      }
      best = candidate;
      bytes = buf;
      break;
    }

    if (!best) {
      failures.push({ title, term, reason: `all candidates taken down (matched "${matchedName}")` });
      continue;
    }

    // The thumbnail is always JPEG regardless of the original's mime, so read
    // the extension off the URL actually downloaded.
    const chosenUrl = assetUrl(best, source);
    const ext = extensionOf(chosenUrl) ?? EXT_BY_MIME[best.mime] ?? "png";
    const file = `${slug}.${ext}`;

    if (!dryRun) {
      writeFileSync(new URL(file, COVER_DIR), bytes);
      fetched++;
    }

    resolved.set(slug, { file, via: matchedName, textFree, source });
    const flag = matchedName.toLowerCase() === term.toLowerCase() ? " " : "~";
    console.log(`${flag} ${title.padEnd(46)} -> ${matchedName}`);

    // The API is generous but this is a background chore; stay polite.
    await sleep(140);
  } catch (err) {
    failures.push({ title, term, reason: err.message });
  }
}

// Emit explicit imports rather than relying on require.context, so the module
// graph stays statically analysable and webpack hashes each asset normally.
if (!dryRun) {
  const entries = [...resolved.entries()].sort(([a], [b]) => a.localeCompare(b));
  const lines = [
    "// GENERATED by scripts/fetch-covers.js - do not edit.",
    "// Regenerate with `npm run covers`.",
    "",
    ...entries.map(([slug, r], i) => `import c${i} from "../assets/covers/${r.file}";`),
    "",
    "export const COVERS = {",
    ...entries.map(([slug], i) => `  ${JSON.stringify(slug)}: c${i},`),
    "};",
    "",
  ];
  writeFileSync(GENERATED, lines.join("\n"));
}

console.log(`\nresolved ${resolved.size} of ${titles.length} titles` + (dryRun ? " (dry run)" : `, downloaded ${fetched}`));

const withText = [...resolved.values()].filter((r) => r.textFree === false);
if (withText.length) {
  console.log(`${withText.length} titles had no text-free art and fell back to logo art.`);
}

if (takedowns.length) {
  console.warn(`\nskipped ${takedowns.length} taken-down asset(s):`);
  for (const t of takedowns) console.warn(`  ${t.title}  [grid ${t.gridId}]`);
}

if (mislabelled.length) {
  console.warn(`
${mislabelled.length} manual file(s) with a misleading extension (harmless, browsers sniff):`);
  for (const m of mislabelled) console.warn(`  ${m.file}  is actually ${m.kind.toUpperCase()}`);
}

if (badFiles.length) {
  console.error(`
${badFiles.length} manual file(s) will render as a broken image:`);
  for (const b of badFiles) console.error(`  ${b.title}  ->  manual/${b.file}  (${b.reason})`);
  process.exitCode = 1;
}

if (failures.length) {
  console.warn(`\n${failures.length} unresolved - add an override in src/data/cover-overrides.js:`);
  for (const f of failures) console.warn(`  ${f.title}  [searched "${f.term}"]  ${f.reason}`);
}
