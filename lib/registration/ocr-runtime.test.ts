import assert from "node:assert/strict";
import test from "node:test";
import { extractPaymentScreenshot, parsePaymentScreenshotText, probeTesseractRuntime, renderUtrPng } from "@/lib/registration/screenshot-ocr";

test("Tesseract runtime probe reports availability honestly", () => {
  const runtime = probeTesseractRuntime();
  assert.equal(typeof runtime.available, "boolean");
  assert.equal(typeof runtime.detail, "string");
  assert.ok(runtime.detail.length > 10);
  // This development host currently has no tesseract on PATH. Document that gap;
  // do not claim production OCR readiness from fixtures alone.
  if (!runtime.available) {
    assert.match(runtime.detail, /not found|failed|missing/i);
  } else {
    assert.ok(runtime.version);
    assert.ok(runtime.languages.includes("eng") || runtime.languages.some((item) => item.startsWith("eng")));
  }
});

test("OCR failures stay safe when tesseract cannot read a screenshot", () => {
  const garbage = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 0, 1, 2, 3, 4, 5]);
  const result = extractPaymentScreenshot(garbage);
  assert.equal(result.confidence, "low");
  assert.ok(result.source === "none" || result.source === "tesseract" || result.source === "fixture");
  if (result.source !== "fixture") {
    assert.equal(result.utr == null || result.confidence === "low", true);
  }
});

test("deterministic fixture UTR still works without tesseract", () => {
  const png = renderUtrPng("AXISCN101010");
  const extracted = extractPaymentScreenshot(png);
  assert.equal(extracted.utr, "AXISCN101010");
  assert.equal(extracted.source, "fixture");
  assert.equal(extracted.confidence, "low");
});

test("payment text parser supports successful screenshot fields for auto-approval inputs", () => {
  const parsed = parsePaymentScreenshotText(
    "Payment Successful\nPaid to: Vidya Bharti Institute of Training and Research Trust\nAmount INR 49\nUTR AXISCN101010",
  );
  assert.equal(parsed.utr, "AXISCN101010");
  assert.equal(parsed.amountInr, 49);
  assert.equal(parsed.paymentStatus, "success");
  assert.equal(parsed.confidence, "high");
});
