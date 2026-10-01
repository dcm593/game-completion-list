// Downscale a PNG so its longest edge is at most <maxEdge> pixels.
//
//   node scripts/downscale-png.js <in.png> <out.png> <maxEdge>
//
// The completion badges arrived from the spreadsheet at 400x503 and 2048x2048
// but are drawn at 22px, so they carried ~812KB for icons that occupy well
// under a thousandth of the page's pixels. sharp premultiplies alpha while
// resizing, so transparent pixels don't bleed their (arbitrary) colour into
// the edges as a halo.

import sharp from "sharp";

const [input, output, maxEdge] = process.argv.slice(2);
const max = Number(maxEdge);
if (!input || !output || !Number.isInteger(max) || max <= 0) {
  console.error("usage: node scripts/downscale-png.js <in.png> <out.png> <maxEdge>");
  process.exit(1);
}

const { width, height } = await sharp(input)
  .resize(max, max, { fit: "inside", withoutEnlargement: true })
  .png()
  .toFile(output);

console.log(`${input} -> ${output}  ${width}x${height}`);
