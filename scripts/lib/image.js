// The one resize-and-encode step every cover goes through, shared by
// fetch-covers.js and optimize-manual.js so both halves of the set are
// stored alike.

import sharp from "sharp";

// The largest place a cover is drawn is the podium's first-place art, about
// 430 CSS px wide, so 1000px keeps it sharp on a 2x display.
export const COVER_WIDTH = 1000;

// Grid cards draw at roughly 230-360 CSS px and the hover card at 212, so a
// 600px copy serves them on most screens at well under half the bytes; the
// browser picks between the two through srcset (src/components/cover.js).
export const SMALL_WIDTH = 600;

export const QUALITY = 82;

// Resize to at most `width` wide (never enlarging) and encode as WebP.
export function toWebp(input, width = COVER_WIDTH) {
  return sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
}

// The image's format as sharp names it ("jpeg", "png", "webp", ...). Throws
// on bytes that aren't a decodable image.
export async function formatOf(input) {
  return (await sharp(input).metadata()).format;
}

export async function widthOf(input) {
  return (await sharp(input).metadata()).width;
}
