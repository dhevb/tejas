import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { decideScreenshotPayment } from "@/lib/registration/payment-decision";
import {
  extractPaymentScreenshot,
  extractPaymentScreenshotAsync,
  parsePaymentScreenshotText,
  probeOcrRuntime,
  renderUtrPng,
  terminateOcrWorker,
} from "@/lib/registration/screenshot-ocr";

function fixture(name: string): Buffer {
  return readFileSync(path.join(process.cwd(), "lib", "registration", "fixtures", name));
}

test.after(async () => {
  await terminateOcrWorker();
});

test("OCR runtime probe finds bundled tesseract.js and eng.traineddata.gz", () => {
  const runtime = probeOcrRuntime();
  assert.ok(runtime.executionEnvironment.includes("node") || runtime.executionEnvironment.includes("vercel"));
  assert.equal(runtime.engDataPresent, true);
  assert.equal(runtime.available, true);
  assert.equal(runtime.engine, "tesseractjs");
  assert.match(runtime.detail, /tesseract\.js/i);
});

test("glyph fixture UTR never becomes high-confidence live OCR", () => {
  const png = renderUtrPng("AXISCN101010");
  const extracted = extractPaymentScreenshot(png);
  assert.equal(extracted.utr, "AXISCN101010");
  assert.equal(extracted.source, "fixture");
  assert.equal(extracted.confidence, "low");
  const decision = decideScreenshotPayment({
    enteredUtr: "AXISCN101010",
    extractedUtr: extracted.utr,
    extractedBeneficiary: "Vidya Bharti Institute of Training and Research Trust",
    extractedAmount: 49,
    paymentStatus: "success",
    expectedAmount: 49,
    ocrConfidence: "high",
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: extracted.source,
  });
  assert.equal(decision.outcome, "exception");
});

test("OCR failures stay safe when the image is unreadable", async () => {
  const garbage = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 0, 1, 2, 3, 4, 5]);
  const result = await extractPaymentScreenshotAsync(garbage);
  assert.equal(result.confidence, "low");
  assert.ok(result.source === "none" || result.source === "tesseractjs");
});

test("payment text parser supports successful screenshot fields for auto-approval inputs", () => {
  const parsed = parsePaymentScreenshotText(
    "Payment Successful\nPaid to: Vidya Bharti Institute of Training and Research Trust\nAmount INR 49\nUTR AXISCN101010",
  );
  assert.equal(parsed.utr, "AXISCN101010");
  assert.equal(parsed.amountInr, 49);
  assert.equal(parsed.paymentStatus, "success");
  assert.equal(parsed.beneficiary, "Vidya Bharti Institute of Training and Research Trust");
  assert.equal(parsed.confidence, "high");
});

test("bundled tesseract.js reads a synthetic payment screenshot", async () => {
  const ocr = await extractPaymentScreenshotAsync(fixture("payment-success-49.png"));
  assert.equal(ocr.source, "tesseractjs", ocr.detail);
  assert.equal(ocr.utr, "AXISCN777001", `detail=${ocr.detail}`);
  assert.equal(ocr.amountInr, 49);
  assert.equal(ocr.paymentStatus, "success");
  assert.ok(ocr.beneficiary);
  assert.match(ocr.beneficiary.toUpperCase(), /VIDYA BHARTI INSTITUTE OF TRAINING AND RESEARCH TRUST/);
  assert.equal(ocr.confidence, "high");

  const decision = decideScreenshotPayment({
    enteredUtr: "AXISCN777001",
    extractedUtr: ocr.utr,
    extractedBeneficiary: ocr.beneficiary,
    extractedAmount: ocr.amountInr,
    paymentStatus: ocr.paymentStatus,
    expectedAmount: 49,
    ocrConfidence: ocr.confidence,
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: ocr.source,
  });
  assert.equal(decision.outcome, "automatic");
  assert.equal(decision.verificationLabel, "screenshot_ocr_match");
});

test("bundled OCR rejects wrong UTR and truncated-but-allowlisted beneficiary still matches", async () => {
  const ocr = await extractPaymentScreenshotAsync(fixture("payment-success-120-truncated.png"));
  assert.equal(ocr.source, "tesseractjs", ocr.detail);
  assert.equal(ocr.utr, "AXISCN777002");
  assert.equal(ocr.amountInr, 120);
  assert.ok(ocr.beneficiary);
  assert.match(ocr.beneficiary.toUpperCase(), /VIDYA BHARTI INSTITUTE OF TRAINING AND RESEARCH/);

  const mismatch = decideScreenshotPayment({
    enteredUtr: "AXISCN999999",
    extractedUtr: ocr.utr,
    extractedBeneficiary: ocr.beneficiary,
    extractedAmount: ocr.amountInr,
    paymentStatus: ocr.paymentStatus,
    expectedAmount: 120,
    ocrConfidence: ocr.confidence,
    purpose: "registration",
    utrAlreadyUsed: false,
    ocrSource: ocr.source,
  });
  assert.equal(mismatch.outcome, "exception");
  assert.equal(mismatch.checks.utr, "mismatch");

  const match = decideScreenshotPayment({
    enteredUtr: "AXISCN777002",
    extractedUtr: ocr.utr,
    extractedBeneficiary: ocr.beneficiary,
    extractedAmount: 120,
    paymentStatus: "success",
    expectedAmount: 120,
    ocrConfidence: "high",
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: "tesseractjs",
  });
  assert.equal(match.outcome, "automatic");
});

test("pending screenshot status does not auto-approve even with matching UTR text", async () => {
  const ocr = await extractPaymentScreenshotAsync(fixture("payment-pending-49.png"));
  assert.equal(ocr.source, "tesseractjs", ocr.detail);
  assert.equal(ocr.paymentStatus, "pending");
  const decision = decideScreenshotPayment({
    enteredUtr: "AXISCN777003",
    extractedUtr: ocr.utr,
    extractedBeneficiary: ocr.beneficiary,
    extractedAmount: ocr.amountInr,
    paymentStatus: ocr.paymentStatus,
    expectedAmount: 49,
    ocrConfidence: ocr.confidence === "high" ? "high" : "low",
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: ocr.source,
  });
  assert.equal(decision.outcome, "exception");
});

test("unreadable screenshot stays exception and never auto-approves", async () => {
  const ocr = await extractPaymentScreenshotAsync(fixture("payment-unreadable.png"));
  assert.notEqual(ocr.confidence, "high");
  const decision = decideScreenshotPayment({
    enteredUtr: "AXISCN777001",
    extractedUtr: ocr.utr,
    extractedBeneficiary: ocr.beneficiary,
    extractedAmount: ocr.amountInr,
    paymentStatus: ocr.paymentStatus,
    expectedAmount: 49,
    ocrConfidence: ocr.confidence,
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: ocr.source,
  });
  assert.equal(decision.outcome, "exception");
});
