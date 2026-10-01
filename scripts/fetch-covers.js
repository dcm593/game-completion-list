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
//
// Each cover is stored twice: full size (COVER_WIDTH) for the podium and the
// note, and a small copy (SMALL_WIDTH) under covers/small/ for the grid and
// the hover card. Small copies are rebuilt whenever they are missing or older
// than their full-size file, so hand-supplied art picks one up on the next run.

import {
  readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, unlinkSync, statSync,
} from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import {
  search, grids, heroes, pickBest, pickGame, download, PREFERRED_STYLE,
} from "./lib/steamgriddb.js";
import { toWebp, formatOf, widthOf, SMALL_WIDTH } from "./lib/image.js";
import { COVER_OVERRIDES } from "../src/data/cover-overrides.js";
import { normalizeTitle, slugify } from "../src/data/titles.js";

const ROOT = new URL("..", import.meta.url);
const COVER_DIR = new URL("src/assets/covers/", ROOT);
const MANUAL_DIR = new URL("src/assets/covers/manual/", ROOT);
const SMALL_DIR = new URL("src/assets/covers/small/", ROOT);
const GENERATED = new URL("src/data/covers.generated.js", ROOT);

const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry");

// SteamGridDB replaces a taken-down asset with a notice image rather than
// removing the grid or returning 404, so it arrives as a perfectly valid
// download. These are the notice's bytes in each format it is served as.
const TAKEDOWN_HASHES = new Set([
  "1ab8729afaf358324310103f70a18af4fab2d1400c8609e9b8614aac3fd8e327",
  "b5ff23579789605a4413f2c742dcfac7f8b70f723d82e15c608c1674bb7d67cd",
]);

const isTakedown = (buffer) =>
  TAKEDOWN_HASHES.has(createHash("sha256").update(buffer).digest("hex"));

// Hero art is served at 1920x620 and averages ~700KB, which is roughly 8x more
// pixels than the largest place it is ever drawn. Its thumbnail is 849x274
// JPEG at ~67KB - still 3.6x oversampled for a 232px card and 2x for the
// podium - so heroes are taken from the thumbnail. Grids are already small
// enough to use as-is.
const assetUrl = (candidate, source) =>
  source === "hero" && candidate.thumb ? candidate.thumb : candidate.url;

// sharp names formats by their type, not their usual extension.
const EXTENSION_OF_FORMAT = { jpeg: ["jpg", "jpeg"], heif: ["avif", "heic"] };
const extensionOf = (file) => file.match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase() ?? null;

const report = { failures: [], takedowns: [], badFiles: [], mislabelled: [], fetched: 0 };

// ------------------------------------------------------------- resolving

// Webpack copies whatever bytes it is given, so a hand-supplied file that
// isn't actually an image builds cleanly and only fails in the browser, as a
// silently broken <img>. Decoding it here turns that into an error instead. A
// wrong extension is harmless - browsers sniff content too - but it is worth
// reporting so the tree stays honest.
async function resolveManual(title, file) {
  const path = new URL(file, MANUAL_DIR);
  if (!existsSync(path)) {
    report.badFiles.push({ title, file, reason: "file not found" });
  } else {
    try {
      const format = await formatOf(readFileSync(path));
      const ext = extensionOf(file);
      if (!(EXTENSION_OF_FORMAT[format] ?? [format]).includes(ext)) {
        report.mislabelled.push({ file, format });
      }
    } catch {
      report.badFiles.push({ title, file, reason: "not a decodable image" });
    }
  }
  return { file: `manual/${file}`, via: "manual" };
}

// Text-free art first, in descending order of how reliably it is clean:
// hero banners, then grids explicitly tagged no_logo, then anything.
async function findArt(gameId) {
  const options = [
    ["hero", () => heroes(gameId)],
    ["no_logo grid", () => grids(gameId, PREFERRED_STYLE)],
    ["grid (has logo)", () => grids(gameId)],
  ];
  for (const [source, fetch] of options) {
    const art = await fetch();
    if (art.length) return { art, source };
  }
  return { art: [], source: null };
}

// A grid whose asset has been taken down still appears in the listing; the
// CDN just serves a notice image instead. That only shows up in the bytes, so
// download, check, and fall through to the next candidate.
async function downloadBest(title, art, source) {
  const rejected = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = pickBest(art, { exclude: rejected });
    if (!candidate) return null;
    if (dryRun) return { candidate, bytes: null };
    const bytes = await download(assetUrl(candidate, source));
    if (!isTakedown(bytes)) return { candidate, bytes };
    rejected.push(candidate.id);
    report.takedowns.push({ title, gridId: candidate.id });
    await sleep(140);
  }
  return null;
}

async function resolveRemote(title, slug, override) {
  const term = override.search ?? normalizeTitle(title);
  const fail = (reason) => {
    report.failures.push({ title, term, reason });
    return null;
  };

  try {
    let gameId = override.id;
    let matchedName = override.id ? `id:${override.id}` : null;

    if (!gameId) {
      const game = pickGame(await search(term), term);
      if (!game) return fail("no search result");
      gameId = game.id;
      matchedName = game.name;
    }

    const { art, source } = await findArt(gameId);
    if (!art.length) return fail(`no landscape art (matched "${matchedName}")`);

    const best = await downloadBest(title, art, source);
    if (!best) return fail(`all candidates taken down (matched "${matchedName}")`);

    // Stored as WebP at the same cap as the manual art, so both halves of the
    // set are consistent. The small copy is cut from the original download
    // rather than from the already-compressed full-size file.
    const file = `${slug}.webp`;
    if (!dryRun) {
      writeFileSync(new URL(file, COVER_DIR), await toWebp(best.bytes));
      writeFileSync(new URL(file, SMALL_DIR), await toWebp(best.bytes, SMALL_WIDTH));
      report.fetched += 1;
    }

    const flag = matchedName.toLowerCase() === term.toLowerCase() ? " " : "~";
    console.log(`${flag} ${title.padEnd(46)} -> ${matchedName}`);

    // The API is generous but this is a background chore; stay polite.
    await sleep(140);
    return { file, via: matchedName, textFree: source !== "grid (has logo)", source };
  } catch (err) {
    return fail(err.message);
  }
}

// ------------------------------------------------------------- writing

// Makes sure every resolved cover has an up-to-date small copy, and returns
// each one's full-size width for the srcset descriptors.
async function ensureSmallCopies(resolved) {
  const widths = new Map();
  for (const [slug, r] of resolved) {
    const large = new URL(r.file, COVER_DIR);
    const small = new URL(r.file, SMALL_DIR);
    if (!existsSync(large)) continue;
    if (!existsSync(small) || statSync(small).mtimeMs < statSync(large).mtimeMs) {
      mkdirSync(dirname(fileURLToPath(small)), { recursive: true });
      writeFileSync(small, await toWebp(readFileSync(large), SMALL_WIDTH));
    }
    widths.set(slug, await widthOf(readFileSync(large)));
  }
  return widths;
}

// Explicit imports rather than require.context, so the module graph stays
// statically analysable and webpack hashes each asset normally.
function writeMap(resolved, widths) {
  const entries = [...resolved.entries()].sort(([a], [b]) => a.localeCompare(b));
  const lines = [
    "// GENERATED by scripts/fetch-covers.js - do not edit.",
    "// Regenerate with `npm run covers`.",
    "",
    ...entries.flatMap(([, r], i) => [
      `import c${i} from "../assets/covers/${r.file}";`,
      `import c${i}s from "../assets/covers/small/${r.file}";`,
    ]),
    "",
    `export const SMALL_WIDTH = ${SMALL_WIDTH};`,
    "",
    "// slug -> { large, small, width }; width is the full-size file's.",
    "export const COVERS = {",
    ...entries.map(([slug], i) => `  ${JSON.stringify(slug)}: { large: c${i}, small: c${i}s, width: ${widths.get(slug)} },`),
    "};",
    "",
  ];
  writeFileSync(GENERATED, lines.join("\n"));
}

// A title that switches to hand-picked art leaves its old download behind,
// and those accumulate - 52 files and 5.3MB at one point. Nothing outside the
// generated map is referenced, and every file here is re-fetchable.
function pruneOrphans(resolved) {
  const used = new Set([...resolved.values()].map((r) => r.file));
  const unused = (dir, prefix = "") =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isFile() && !used.has(prefix + e.name))
          .map((e) => new URL(e.name, dir))
      : [];

  const orphans = [
    ...unused(COVER_DIR),
    ...unused(SMALL_DIR),
    ...unused(new URL("manual/", SMALL_DIR), "manual/"),
  ];
  for (const path of orphans) unlinkSync(path);
  if (orphans.length) console.log(`pruned ${orphans.length} unreferenced cover(s)`);
}

// ------------------------------------------------------------- run

const games = JSON.parse(readFileSync(new URL("src/data/games.json", ROOT), "utf8"));

// One row per distinct title; DELTARUNE's three chapters share one lookup.
const titles = [...new Set(games.years.flatMap((y) => y.games.map((g) => g.title)))];

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

for (const dir of [COVER_DIR, MANUAL_DIR, SMALL_DIR, new URL("manual/", SMALL_DIR)]) {
  mkdirSync(dir, { recursive: true });
}

const cached = new Map(
  readdirSync(COVER_DIR, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => [e.name.replace(/\.[^.]+$/, ""), e.name])
);

const resolved = new Map();
for (const title of titles) {
  const slug = slugify(title);
  const override = COVER_OVERRIDES[title] ?? {};

  let result;
  if (override.file) result = await resolveManual(title, override.file);
  else if (!force && cached.has(slug)) result = { file: cached.get(slug), via: "cached" };
  else result = await resolveRemote(title, slug, override);

  if (result) resolved.set(slug, result);
}

if (!dryRun) {
  writeMap(resolved, await ensureSmallCopies(resolved));
  pruneOrphans(resolved);
}

console.log(
  `\nresolved ${resolved.size} of ${titles.length} titles` +
    (dryRun ? " (dry run)" : `, downloaded ${report.fetched}`)
);

const withText = [...resolved.values()].filter((r) => r.textFree === false);
if (withText.length) {
  console.log(`${withText.length} titles had no text-free art and fell back to logo art.`);
}

if (report.takedowns.length) {
  console.warn(`\nskipped ${report.takedowns.length} taken-down asset(s):`);
  for (const t of report.takedowns) console.warn(`  ${t.title}  [grid ${t.gridId}]`);
}

if (report.mislabelled.length) {
  console.warn(`\n${report.mislabelled.length} manual file(s) with a misleading extension (harmless, browsers sniff):`);
  for (const m of report.mislabelled) console.warn(`  ${m.file}  is actually ${m.format.toUpperCase()}`);
}

if (report.badFiles.length) {
  console.error(`\n${report.badFiles.length} manual file(s) will render as a broken image:`);
  for (const b of report.badFiles) console.error(`  ${b.title}  ->  manual/${b.file}  (${b.reason})`);
  process.exitCode = 1;
}

if (report.failures.length) {
  console.warn(`\n${report.failures.length} unresolved - add an override in src/data/cover-overrides.js:`);
  for (const f of report.failures) console.warn(`  ${f.title}  [searched "${f.term}"]  ${f.reason}`);
}
