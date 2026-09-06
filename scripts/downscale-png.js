// Box-filter downscaler for RGBA PNGs, with no dependencies.
//
//   node scripts/downscale-png.js <in.png> <out.png> <maxEdge>
//
// The completion badges arrived from the spreadsheet at 400x503 and 2048x2048
// but are drawn at 22px, so they carried ~812KB for icons that occupy well
// under a thousandth of the page's pixels. Adding sharp for two files means a
// native binary in the toolchain; Node already ships zlib, and PNG decoding is
// a header parse, an inflate, and five scanline filters.
//
// Alpha is premultiplied before averaging. Without that, transparent pixels
// contribute their (arbitrary) colour to the average and edges pick up a halo
// of whatever the encoder happened to leave in fully transparent regions.

import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ------------------------------------------------------------------ decode

function decode(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG");

  let width, height, bitDepth, colorType, interlace;
  const idat = [];

  let offset = 8;
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }

  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error("interlaced PNGs are not supported");
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`unsupported colour type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const pixels = unfilter(raw, width, height, channels);
  return { width, height, channels, pixels };
}

function unfilter(raw, width, height, channels) {
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? row[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      const v = line[x];

      switch (filter) {
        case 0: row[x] = v; break;
        case 1: row[x] = (v + a) & 0xff; break;
        case 2: row[x] = (v + b) & 0xff; break;
        case 3: row[x] = (v + ((a + b) >> 1)) & 0xff; break;
        case 4: row[x] = (v + paeth(a, b, c)) & 0xff; break;
        default: throw new Error(`unknown filter ${filter} on row ${y}`);
      }
    }
  }
  return out;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

// ------------------------------------------------------------------ resize

// Averages every source pixel that falls inside each destination pixel's box.
// For downscaling this is what you want: it considers all the input, so it
// does not alias the way nearest-neighbour or bilinear sampling does.
function resize(src, dstWidth, dstHeight) {
  const { width, height, channels, pixels } = src;
  const hasAlpha = channels === 4 || channels === 2;
  const out = Buffer.alloc(dstWidth * dstHeight * 4);

  for (let dy = 0; dy < dstHeight; dy += 1) {
    const y0 = Math.floor((dy * height) / dstHeight);
    const y1 = Math.max(y0 + 1, Math.floor(((dy + 1) * height) / dstHeight));

    for (let dx = 0; dx < dstWidth; dx += 1) {
      const x0 = Math.floor((dx * width) / dstWidth);
      const x1 = Math.max(x0 + 1, Math.floor(((dx + 1) * width) / dstWidth));

      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const i = (y * width + x) * channels;
          const alpha = hasAlpha ? pixels[i + channels - 1] / 255 : 1;
          if (channels >= 3) {
            r += pixels[i] * alpha;
            g += pixels[i + 1] * alpha;
            b += pixels[i + 2] * alpha;
          } else {
            r += pixels[i] * alpha;
            g += pixels[i] * alpha;
            b += pixels[i] * alpha;
          }
          a += alpha;
          n += 1;
        }
      }

      const o = (dy * dstWidth + dx) * 4;
      const alphaAvg = a / n;
      // Un-premultiply, guarding the fully transparent case.
      const scale = alphaAvg > 0 ? 1 / (alphaAvg * n) : 0;
      out[o] = Math.round(r * scale);
      out[o + 1] = Math.round(g * scale);
      out[o + 2] = Math.round(b * scale);
      out[o + 3] = Math.round(alphaAvg * 255);
    }
  }
  return out;
}

// ------------------------------------------------------------------ encode

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function encode(rgba, width, height) {
  const stride = width * 4;
  // Filter 0 on every row. These are small images and zlib does the work;
  // adaptive filtering would save a few hundred bytes for a lot of code.
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// -------------------------------------------------------------------- main

const [input, output, maxEdge] = process.argv.slice(2);
if (!input || !output || !maxEdge) {
  console.error("usage: node scripts/downscale-png.js <in.png> <out.png> <maxEdge>");
  process.exit(1);
}

const before = readFileSync(input);
const src = decode(before);
const scale = Number(maxEdge) / Math.max(src.width, src.height);

if (scale >= 1) {
  console.log(`${input} is already within ${maxEdge}px; copied unchanged`);
  writeFileSync(output, before);
} else {
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const after = encode(resize(src, w, h), w, h);
  writeFileSync(output, after);
  console.log(
    `${input}  ${src.width}x${src.height} ${(before.length / 1024).toFixed(0)}KB` +
      `  ->  ${w}x${h} ${(after.length / 1024).toFixed(1)}KB` +
      `  (${(100 - (after.length / before.length) * 100).toFixed(1)}% smaller)`
  );
}
