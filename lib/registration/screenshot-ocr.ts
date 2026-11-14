import { inflateSync, deflateSync } from "node:zlib";
import { spawnSync } from "node:child_process";

/** 5×7 glyphs. Each row is five bits. */
const FONT: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};

const SCALE = 3;

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const value of bytes) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (~crc) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

/** Draw an uppercase UTR into a PNG using the built-in glyph set. */
export function renderUtrPng(utr: string): Buffer {
  const text = utr.toUpperCase();
  if (![...text].every((char) => FONT[char])) throw new Error("This renderer only draws letters and digits.");
  const width = text.length * (5 * SCALE + SCALE) + SCALE;
  const height = 7 * SCALE + SCALE * 2;
  const raw = Buffer.alloc((width * 3 + 1) * height, 255);
  text.split("").forEach((char, index) => {
    const glyph = FONT[char];
    const originX = SCALE + index * (5 * SCALE + SCALE);
    glyph.forEach((row, y) => {
      for (let x = 0; x < 5; x += 1) {
        if (row[x] !== "1") continue;
        for (let sy = 0; sy < SCALE; sy += 1) {
          for (let sx = 0; sx < SCALE; sx += 1) {
            const px = originX + x * SCALE + sx;
            const py = SCALE + y * SCALE + sy;
            const offset = py * (width * 3 + 1) + 1 + px * 3;
            raw[offset] = 0;
            raw[offset + 1] = 0;
            raw[offset + 2] = 0;
          }
        }
      }
    });
  });
  for (let y = 0; y < height; y += 1) raw[y * (width * 3 + 1)] = 0;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

type Image = { width: number; height: number; pixels: Uint8Array };

function readPng(bytes: Buffer): Image | null {
  if (bytes.length < 8 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;
  let width = 0;
  let height = 0;
  let colour = 0;
  const idat: Buffer[] = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colour = data[9];
    }
    if (type === "IDAT") idat.push(data);
    if (type === "IEND") break;
    offset += 12 + length;
  }
  if (!width || !height || colour !== 2 || !idat.length) return null;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = new Uint8Array(width * height);
  const stride = width * 3 + 1;
  if (raw.length < stride * height) return null;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * stride + 1 + x * 3;
      pixels[y * width + x] = raw[index] < 128 ? 1 : 0;
    }
  }
  return { width, height, pixels };
}

function readGlyph(image: Image, left: number, right: number, top: number, bottom: number): string | null {
  const width = right - left + 1;
  const height = bottom - top + 1;
  let best = "";
  let bestScore = Number.POSITIVE_INFINITY;
  for (const [char, rows] of Object.entries(FONT)) {
    let score = 0;
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const sx = left + Math.min(width - 1, Math.floor(((x + 0.5) * width) / 5));
        const sy = top + Math.min(height - 1, Math.floor(((y + 0.5) * height) / 7));
        const ink = image.pixels[sy * image.width + sx] === 1;
        if (ink !== (rows[y][x] === "1")) score += 1;
      }
    }
    if (score < bestScore) {
      bestScore = score;
      best = char;
    }
  }
  return bestScore <= 4 ? best : null;
}

export type OcrResult = { utr: string | null; source: "image" | "tesseract" | "none" };

function readDrawnUtr(bytes: Buffer): string | null {
  const image = readPng(bytes);
  if (!image) return null;
  let top = image.height;
  let bottom = -1;
  let left = image.width;
  let right = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.pixels[y * image.width + x] !== 1) continue;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  }
  if (bottom < top) return null;
  const glyphs: string[] = [];
  let cursor = left;
  while (cursor <= right) {
    while (cursor <= right && !columnHasInk(image, cursor, top, bottom)) cursor += 1;
    if (cursor > right) break;
    const start = cursor;
    while (cursor <= right && columnHasInk(image, cursor, top, bottom)) cursor += 1;
    const char = readGlyph(image, start, cursor - 1, top, bottom);
    if (!char) return null;
    glyphs.push(char);
  }
  const text = glyphs.join("");
  return text.length >= 6 ? text : null;
}

function columnHasInk(image: Image, x: number, top: number, bottom: number): boolean {
  for (let y = top; y <= bottom; y += 1) if (image.pixels[y * image.width + x] === 1) return true;
  return false;
}

function readTesseract(bytes: Buffer): string | null {
  const result = spawnSync("tesseract", ["stdin", "stdout", "--psm", "7", "-c", "tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"], {
    input: bytes,
    encoding: "utf8",
    timeout: 8000,
  });
  if (result.status !== 0 || !result.stdout) return null;
  const token = result.stdout.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return token.length >= 6 ? token : null;
}

/** Read a UTR painted in the image. A photo that cannot be read returns null. */
export function extractUtr(bytes: Buffer): OcrResult {
  const drawn = readDrawnUtr(bytes);
  if (drawn) return { utr: drawn, source: "image" };
  try {
    const tess = readTesseract(bytes);
    if (tess) return { utr: tess, source: "tesseract" };
  } catch {
    return { utr: null, source: "none" };
  }
  return { utr: null, source: "none" };
}
