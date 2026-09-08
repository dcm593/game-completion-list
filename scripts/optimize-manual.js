// Resize and convert hand-supplied cover art in place.
//
//   npm run optimize
//
// Manual covers arrive at whatever size they were downloaded at - some were
// 3840x1240 for a card drawn around 253px wide, which is roughly 58x the
// pixels any screen will show. Worse, a browser decodes every image to
// width * height * 4 bytes of RAM regardless of its display size, so the
// oversized set decoded to ~154MB.
//
// Each file is capped at MAX_WIDTH (2x the largest place art is drawn, so
// retina displays still get full detail) and re-encoded as WebP, which runs
// roughly 30% under JPEG at matched quality. Originals are replaced; they
// remain in git history if one is ever needed back.
//
// Idempotent: files already WebP and within the cap are left alone, so this
// can be re-run after dropping new art into the folder.

import { readFileSync, writeFileSync, readdirSync, unlinkSync, statSync } from "node:fs";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url);
const MANUAL_DIR = new URL("src/assets/covers/manual/", ROOT);
const OVERRIDES = new URL("src/data/cover-overrides.js", ROOT);

// The podium's first-place art is the largest draw at roughly 430px wide.
const MAX_WIDTH = 1000;
const QUALITY = 82;

const files = readdirSync(MANUAL_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

let before = 0;
let after = 0;
const renames = new Map();

for (const file of files) {
  const path = new URL(file, MANUAL_DIR);
  const original = readFileSync(path);
  before += original.length;

  const image = sharp(original);
  const meta = await image.metadata();

  const alreadyOptimal = meta.format === "webp" && meta.width <= MAX_WIDTH;
  if (alreadyOptimal) {
    after += original.length;
    continue;
  }

  const output = await image
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();

  const target = file.replace(/\.[^.]+$/, ".webp");
  writeFileSync(new URL(target, MANUAL_DIR), output);
  after += output.length;

  if (target !== file) {
    unlinkSync(path);
    renames.set(file, target);
  }

  const scaled = meta.width > MAX_WIDTH ? `${meta.width}->${MAX_WIDTH}px` : `${meta.width}px`;
  console.log(
    `  ${file.padEnd(42)}${scaled.padEnd(14)}` +
      `${(original.length / 1024).toFixed(0)}KB -> ${(output.length / 1024).toFixed(0)}KB`
  );
}

// Overrides name their file explicitly, so the extension change has to follow.
if (renames.size) {
  let src = readFileSync(OVERRIDES, "utf8");
  for (const [from, to] of renames) {
    src = src.replaceAll(`"${from}"`, `"${to}"`);
  }
  writeFileSync(OVERRIDES, src);
  console.log(`\nrewrote ${renames.size} file reference(s) in cover-overrides.js`);
}

console.log(
  `\n${files.length} files: ${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(1)}MB` +
    ` (${(100 - (after / before) * 100).toFixed(1)}% smaller)`
);
