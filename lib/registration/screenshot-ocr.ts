import { inflateSync, deflateSync } from "node:zlib";
import { existsSync } from "node:fs";
import path from "node:path";

/** 5×7 glyphs for deterministic test fixtures and synthetic screenshots. */
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
  ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00100", "00100"],
  ",": ["00000", "00000", "00000", "00000", "00100", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "₹": ["01111", "10000", "11110", "10000", "11110", "10000", "10000"],
};

/** Pixel scale for glyph fixtures. Real OCR tests use renderPaymentScreenshotPng with larger scale. */
const SCALE = 3;
const PAYMENT_SCREENSHOT_SCALE = 8;
const OCR_TIMEOUT_MS = 20_000;

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

function encodePng(width: number, height: number, raw: Buffer): Buffer {
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

function drawLine(raw: Buffer, width: number, line: string, originY: number, scale = SCALE): void {
  const upper = line.toUpperCase();
  const gap = Math.max(2, Math.floor(scale / 2));
  upper.split("").forEach((char, index) => {
    const glyph = FONT[char] ?? FONT[" "];
    const originX = scale + index * (5 * scale + gap);
    glyph.forEach((row, y) => {
      for (let x = 0; x < 5; x += 1) {
        if (row[x] !== "1") continue;
        for (let sy = 0; sy < scale; sy += 1) {
          for (let sx = 0; sx < scale; sx += 1) {
            const px = originX + x * scale + sx;
            const py = originY + y * scale + sy;
            const offset = py * (width * 3 + 1) + 1 + px * 3;
            if (offset + 2 >= raw.length) continue;
            raw[offset] = 0;
            raw[offset + 1] = 0;
            raw[offset + 2] = 0;
          }
        }
      }
    });
  });
}

/** Draw uppercase text into a PNG using the built-in glyph set (test fixtures). */
export function renderTextPng(text: string): Buffer {
  const upper = text.toUpperCase();
  if (![...upper].every((char) => FONT[char])) throw new Error("This renderer only draws supported characters.");
  const width = Math.max(1, upper.length) * (5 * SCALE + SCALE) + SCALE;
  const height = 7 * SCALE + SCALE * 2;
  const raw = Buffer.alloc((width * 3 + 1) * height, 255);
  for (let y = 0; y < height; y += 1) raw[y * (width * 3 + 1)] = 0;
  drawLine(raw, width, upper, SCALE);
  return encodePng(width, height, raw);
}

export function renderUtrPng(utr: string): Buffer {
  return renderTextPng(utr);
}

/** Synthetic multi-line payment screenshot for real OCR path testing (not auto-approve fixture). */
export function renderPaymentScreenshotPng(input: {
  statusLine: string;
  beneficiaryLine: string;
  amountLine: string;
  utrLine: string;
}): Buffer {
  const scale = PAYMENT_SCREENSHOT_SCALE;
  const gap = Math.max(2, Math.floor(scale / 2));
  const lines = [
    input.statusLine.toUpperCase(),
    input.beneficiaryLine.toUpperCase(),
    input.amountLine.toUpperCase(),
    input.utrLine.toUpperCase(),
  ];
  for (const line of lines) {
    if (![...line].every((char) => FONT[char])) {
      throw new Error(`Unsupported character in synthetic screenshot line: ${line}`);
    }
  }
  const maxChars = Math.max(...lines.map((line) => line.length), 1);
  const width = maxChars * (5 * scale + gap) + scale * 2;
  const lineHeight = 7 * scale + scale * 3;
  const height = lineHeight * lines.length + scale * 2;
  const raw = Buffer.alloc((width * 3 + 1) * height, 255);
  for (let y = 0; y < height; y += 1) raw[y * (width * 3 + 1)] = 0;
  lines.forEach((line, index) => drawLine(raw, width, line, scale + index * lineHeight, scale));
  return encodePng(width, height, raw);
}

export type ScreenshotOcrResult = {
  utr: string | null;
  beneficiary: string | null;
  amountInr: number | null;
  paymentStatus: "success" | "pending" | "failed" | "unknown";
  confidence: "high" | "low";
  /**
   * fixture = glyph-only unit helper (never sufficient for auto-approval).
   * tesseractjs = bundled WASM OCR used on Vercel Node runtimes.
   * none = OCR unavailable or unreadable.
   */
  source: "fixture" | "tesseractjs" | "none";
  /** Redacted length-only diagnostics; never log full payment text in routes. */
  rawTextLength: number;
  detail: string;
};

const UTR_RE = /\b(?:UTR|UPI\s*REF(?:ERENCE)?|REF(?:ERENCE)?(?:\s*NO)?|RRN|TXN(?:\s*ID)?)\s*[:#-]?\s*([A-Z0-9]{6,40})\b/i;
const BARE_UTR_RE = /\b([A-Z]{4}[A-Z0-9]{8,36})\b/;
const AMOUNT_RE = /(?:₹|INR|RS\.?)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|\d+(?:\.\d{1,2})?)/i;
/** Stop at line end or payment-field keywords so amount/UTR lines are not swallowed. */
const BENEFICIARY_RE =
  /(?:^|\n)\s*(?:to|beneficiary|paid\s+to|account\s+holder|a\/c\s*name|creditor)\s*[:-]?\s*([A-Za-z0-9.&'’\-]+(?:\s+[A-Za-z0-9.&'’\-]+){1,12})(?=\s*(?:\n|$|amount|inr|rs\.?|₹|utr|upi|ref|txn))/im;
const BENEFICIARY_STOP = /\b(?:amount|inr|rs\.?|₹|utr|upi|ref|txn|rrn)\b/i;

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

function extractBeneficiary(text: string): string | null {
  const match = text.match(BENEFICIARY_RE);
  if (!match?.[1]) return null;
  const cleaned = match[1]
    .split(/\n/)[0]
    .replace(BENEFICIARY_STOP, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length >= 3 ? cleaned : null;
}

/** Parse payment fields from OCR/plain text (deterministic rules for tests and OCR output). */
export function parsePaymentScreenshotText(text: string): Omit<ScreenshotOcrResult, "source" | "rawTextLength" | "detail" | "confidence"> & { confidence: "high" | "low" } {
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
  const beneficiary = extractBeneficiary(normalised);
  const paymentStatus = inferStatus(normalised);
  const confidence: "high" | "low" =
    utr && amountInr != null && beneficiary && paymentStatus === "success" ? "high" : "low";
  return { utr, beneficiary, amountInr, paymentStatus, confidence };
}

export type OcrRuntime = {
  available: boolean;
  engine: "tesseractjs" | "none";
  version: string | null;
  languages: string[];
  tessdataPath: string;
  engDataPresent: boolean;
  detail: string;
  executionEnvironment: string;
};

export function tessdataDirectory(): string {
  return path.join(process.cwd(), "vendor", "tessdata");
}

export function engTrainedDataPath(): string {
  return path.join(tessdataDirectory(), "eng.traineddata.gz");
}

/**
 * OCR executes inside Next.js Node.js API routes (Vercel serverless functions).
 * System tesseract binaries are not available there; bundled tesseract.js + vendor eng data is required.
 */
export function probeOcrRuntime(): OcrRuntime {
  const tessdataPath = tessdataDirectory();
  const engGz = engTrainedDataPath();
  const engDataPresent = existsSync(engGz);
  const executionEnvironment =
    process.env.VERCEL === "1"
      ? "vercel-node-serverless"
      : process.env.NODE_ENV === "production"
        ? "node-production"
        : "node-local";
  if (!engDataPresent) {
    return {
      available: false,
      engine: "none",
      version: null,
      languages: [],
      tessdataPath,
      engDataPresent: false,
      detail: "vendor/tessdata/eng.traineddata.gz is missing; screenshot OCR cannot run.",
      executionEnvironment,
    };
  }
  try {
    // Resolve package presence without executing OCR yet.
    require.resolve("tesseract.js");
    return {
      available: true,
      engine: "tesseractjs",
      version: "tesseract.js",
      languages: ["eng"],
      tessdataPath,
      engDataPresent: true,
      detail: "Bundled tesseract.js with local eng.traineddata.gz is ready for Node/Vercel OCR.",
      executionEnvironment,
    };
  } catch {
    return {
      available: false,
      engine: "none",
      version: null,
      languages: [],
      tessdataPath,
      engDataPresent,
      detail: "tesseract.js package is not installed.",
      executionEnvironment,
    };
  }
}

/** @deprecated Use probeOcrRuntime — system tesseract is not the deployment path. */
export function probeTesseractRuntime(): {
  available: boolean;
  version: string | null;
  languages: string[];
  detail: string;
} {
  const runtime = probeOcrRuntime();
  return {
    available: runtime.available,
    version: runtime.version,
    languages: runtime.languages,
    detail: runtime.detail,
  };
}

type WorkerLike = {
  recognize: (image: Buffer) => Promise<{ data: { text: string } }>;
  setParameters: (params: Record<string, string>) => Promise<void>;
  terminate: () => Promise<void>;
};

let workerPromise: Promise<WorkerLike> | null = null;

async function getTesseractWorker(): Promise<WorkerLike> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      // Plain filesystem path (not file://). tesseract.js Node adapter reads
      // local traineddata via fs; file:// URLs go through fetch and fail.
      const langPath = tessdataDirectory();
      const worker = await createWorker("eng", 1, {
        langPath,
        gzip: true,
        cacheMethod: "readOnly",
        logger: () => undefined,
      });
      const typed = worker as unknown as WorkerLike;
      await typed.setParameters({
        // Assume a uniform block of text (payment receipt screenshot).
        tessedit_pageseg_mode: "6",
      });
      return typed;
    })();
  }
  try {
    return await workerPromise;
  } catch (error) {
    workerPromise = null;
    throw error;
  }
}

/** Release the cached OCR worker (tests / process shutdown). */
export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return;
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } catch {
    // ignore terminate failures
  } finally {
    workerPromise = null;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(label)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readTesseractJsText(bytes: Buffer): Promise<{ text: string } | { error: string }> {
  const runtime = probeOcrRuntime();
  if (!runtime.available) return { error: runtime.detail };
  try {
    const worker = await withTimeout(getTesseractWorker(), OCR_TIMEOUT_MS, "OCR worker startup timed out.");
    const result = await withTimeout(worker.recognize(bytes), OCR_TIMEOUT_MS, "OCR recognition timed out.");
    const text = result.data.text ?? "";
    if (!text.trim()) return { error: "OCR returned empty text." };
    return { text };
  } catch (error) {
    workerPromise = null;
    const message = error instanceof Error ? error.message : "OCR failed.";
    return { error: message };
  }
}

/**
 * Synchronous fixture/helper path only.
 * Never sufficient for payment auto-approval (confidence stays low; source=fixture).
 */
export function extractPaymentScreenshot(bytes: Buffer): ScreenshotOcrResult {
  if (bytes.length < 32) {
    return {
      utr: null,
      beneficiary: null,
      amountInr: null,
      paymentStatus: "unknown",
      confidence: "low",
      source: "none",
      rawTextLength: 0,
      detail: "Image too small.",
    };
  }
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
        rawTextLength: drawn.length,
        detail: "Glyph fixture only; not used for automatic approval.",
      };
    }
  } catch {
    // continue
  }
  return {
    utr: null,
    beneficiary: null,
    amountInr: null,
    paymentStatus: "unknown",
    confidence: "low",
    source: "none",
    rawTextLength: 0,
    detail: "Use extractPaymentScreenshotAsync for real OCR.",
  };
}

/**
 * Production OCR path for payment API routes.
 * Uses bundled tesseract.js + vendor eng.traineddata.gz (Vercel Node compatible).
 */
export async function extractPaymentScreenshotAsync(bytes: Buffer): Promise<ScreenshotOcrResult> {
  if (bytes.length < 32) {
    return {
      utr: null,
      beneficiary: null,
      amountInr: null,
      paymentStatus: "unknown",
      confidence: "low",
      source: "none",
      rawTextLength: 0,
      detail: "Image too small.",
    };
  }

  // Never treat glyph fixtures as live OCR success.
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
        rawTextLength: drawn.length,
        detail: "Glyph fixture detected; automatic approval is blocked.",
      };
    }
  } catch {
    // continue to real OCR
  }

  const ocr = await readTesseractJsText(bytes);
  if ("error" in ocr) {
    return {
      utr: null,
      beneficiary: null,
      amountInr: null,
      paymentStatus: "unknown",
      confidence: "low",
      source: "none",
      rawTextLength: 0,
      detail: ocr.error,
    };
  }
  const parsed = parsePaymentScreenshotText(ocr.text);
  return {
    ...parsed,
    source: "tesseractjs",
    rawTextLength: ocr.text.length,
    detail: "OCR completed with bundled tesseract.js.",
  };
}

/** Back-compat helper used by older tests and call sites. */
export function extractUtr(bytes: Buffer): { utr: string | null; source: "image" | "tesseract" | "none" } {
  const result = extractPaymentScreenshot(bytes);
  const source = result.source === "fixture" ? "image" : result.source === "tesseractjs" ? "tesseract" : "none";
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
    if (char === " " || char.length !== 1) continue;
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
  // Multi-line synthetic screenshots are taller than a single glyph row — skip fixture path.
  if (image.height > 7 * SCALE + SCALE * 4) return null;
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
