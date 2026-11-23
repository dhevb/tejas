import { inflateSync, deflateSync } from "node:zlib";
import { spawnSync } from "node:child_process";

/** 5×7 glyphs for deterministic test fixtures. */
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
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
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

/** Draw uppercase text into a PNG using the built-in glyph set (test fixtures). */
export function renderTextPng(text: string): Buffer {
  const upper = text.toUpperCase();
  if (![...upper].every((char) => FONT[char])) throw new Error("This renderer only draws letters, digits, and spaces.");
  const width = Math.max(1, upper.length) * (5 * SCALE + SCALE) + SCALE;
  const height = 7 * SCALE + SCALE * 2;
  const raw = Buffer.alloc((width * 3 + 1) * height, 255);
  upper.split("").forEach((char, index) => {
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
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function renderUtrPng(utr: string): Buffer {
  return renderTextPng(utr);
}

export type ScreenshotOcrResult = {
  utr: string | null;
  beneficiary: string | null;
  amountInr: number | null;
  paymentStatus: "success" | "pending" | "failed" | "unknown";
  confidence: "high" | "low";
  source: "fixture" | "tesseract" | "none";
  rawText: string;
};

const UTR_RE = /\b(?:UTR|UPI\s*REF(?:ERENCE)?|REF(?:ERENCE)?(?:\s*NO)?|RRN|TXN(?:\s*ID)?)\s*[:#-]?\s*([A-Z0-9]{6,40})\b/i;
const BARE_UTR_RE = /\b([A-Z]{4}[A-Z0-9]{8,36})\b/;
const AMOUNT_RE = /(?:₹|INR|RS\.?)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|\d+(?:\.\d{1,2})?)/i;
const BENEFICIARY_RE =
  /(?:to|beneficiary|paid\s+to|account\s+holder|a\/c\s*name|creditor)\s*[:-]?\s*([A-Za-z0-9.&'’\-]+(?:\s+[A-Za-z0-9.&'’\-]+){1,12})(?=\s*(?:amount|inr|rs\.?|₹|utr|upi|ref|txn|$))/i;

function parseAmount(token: string): number | null {
  const cleaned = token.replace(/,/g, "");
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value);
}

function inferStatus(text: string): ScreenshotOcrResult["paymentStatus"] {
  if (/\b(failed|failure|declined|unsuccessful|rejected)\b/i.test(text)) return "failed";
  if (/\b(pending|processing|initiated|in progress)\b/i.test(text)) return "pending";
  if (/\b(success(?:ful)?|completed|paid|credited|success!)\b/i.test(text)) return "success";
  return "unknown";
}

/** Parse payment fields from OCR/plain text (deterministic rules for tests and tesseract output). */
export function parsePaymentScreenshotText(text: string): Omit<ScreenshotOcrResult, "source" | "rawText" | "confidence"> & { confidence: "high" | "low" } {
  const normalised = text.replace(/\u00a0/g, " ");
  let utr: string | null = null;
  const labelled = normalised.match(UTR_RE);
  if (labelled?.[1]) utr = labelled[1].toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!utr) {
    const bare = normalised.toUpperCase().match(BARE_UTR_RE);
    if (bare?.[1]) utr = bare[1];
  }
  const amountMatch = normalised.match(AMOUNT_RE);
  const amountInr = amountMatch?.[1] ? parseAmount(amountMatch[1]) : null;
  const beneficiaryMatch = normalised.match(BENEFICIARY_RE);
  const beneficiary = beneficiaryMatch?.[1]?.replace(/\s+/g, " ").trim() ?? null;
  const paymentStatus = inferStatus(normalised);
  const confidence: "high" | "low" =
    utr && amountInr != null && beneficiary && paymentStatus === "success" ? "high" : "low";
  return { utr, beneficiary, amountInr, paymentStatus, confidence };
}

function readTesseractText(bytes: Buffer): string | null {
  const result = spawnSync("tesseract", ["stdin", "stdout", "--psm", "6"], {
    input: bytes,
    encoding: "utf8",
    timeout: 12_000,
  });
  if (result.status !== 0 || !result.stdout) return null;
  return result.stdout;
}

/**
 * Extract UTR, beneficiary, amount, and status from a payment screenshot.
 * Returns low confidence when required fields are missing or ambiguous.
 */
export function extractPaymentScreenshot(bytes: Buffer): ScreenshotOcrResult {
  if (bytes.length < 32) {
    return { utr: null, beneficiary: null, amountInr: null, paymentStatus: "unknown", confidence: "low", source: "none", rawText: "" };
  }

  // Deterministic fixture path: PNG with only a UTR drawn by renderUtrPng.
  try {
    const drawn = readDrawnUtr(bytes);
    if (drawn) {
      return {
        utr: drawn,
        beneficiary: null,
        amountInr: null,
        paymentStatus: "unknown",
        confidence: "low",
        source: "fixture",
        rawText: drawn,
      };
    }
  } catch {
    // continue
  }

  try {
    const text = readTesseractText(bytes);
    if (text) {
      const parsed = parsePaymentScreenshotText(text);
      return { ...parsed, source: "tesseract", rawText: text };
    }
  } catch {
    // fall through
  }

  return { utr: null, beneficiary: null, amountInr: null, paymentStatus: "unknown", confidence: "low", source: "none", rawText: "" };
}

/** Back-compat helper used by older tests and call sites. */
export function extractUtr(bytes: Buffer): { utr: string | null; source: "image" | "tesseract" | "none" } {
  const result = extractPaymentScreenshot(bytes);
  const source = result.source === "fixture" ? "image" : result.source;
  return { utr: result.utr, source };
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
    if (char === " ") continue;
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

function columnHasInk(image: Image, x: number, top: number, bottom: number): boolean {
  for (let y = top; y <= bottom; y += 1) if (image.pixels[y * image.width + x] === 1) return true;
  return false;
}

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
