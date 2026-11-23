import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { decideScreenshotPayment } from "@/lib/registration/payment-decision";
import { detectReceipt } from "@/lib/registration/receipt";
import { MAX_RECEIPT_BYTES } from "@/lib/registration/schema";
import {
  extractPaymentScreenshotAsync,
  probeOcrRuntime,
} from "@/lib/registration/screenshot-ocr";
import type { BeneficiaryPurpose } from "@/lib/registration/beneficiary-match";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Preview/dev-only OCR acceptance probe.
 * Runs serverless OCR and decision checks without writing registrations,
 * entitlements, UTR claims, or payment proofs. Hard-disabled on Production.
 */
function probeAllowed(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "preview") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export async function GET() {
  if (!probeAllowed()) return noStore({ ok: false, error: "Not found." }, 404);
  const runtimeInfo = probeOcrRuntime();
  return noStore({
    ok: true,
    probe: "ocr-preview",
    writesData: false,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    executionEnvironment: runtimeInfo.executionEnvironment,
    ocr: {
      available: runtimeInfo.available,
      engine: runtimeInfo.engine,
      engDataPresent: runtimeInfo.engDataPresent,
      tessdataPath: runtimeInfo.tessdataPath,
      detail: runtimeInfo.detail,
      languages: runtimeInfo.languages,
    },
  });
}

export async function POST(request: Request) {
  if (!probeAllowed()) return noStore({ ok: false, error: "Not found." }, 404);
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this probe on the Preview host." }, 403);
  if (!rateLimit(`ocr-probe:${clientKey(request)}`, 20, 60 * 60 * 1000)) {
    return noStore({ ok: false, error: "Too many probe attempts." }, 429);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return noStore({ ok: false, error: "Upload a JPG or PNG screenshot as multipart form data." }, 400);
  }

  const form = await request.formData();
  const receiptFile = form.get("receipt");
  const enteredUtr = String(form.get("enteredUtr") ?? "").trim();
  const expectedAmountRaw = String(form.get("expectedAmount") ?? "").trim();
  const purposeRaw = String(form.get("purpose") ?? "ebook").trim().toLowerCase();
  const utrAlreadyUsed = String(form.get("utrAlreadyUsed") ?? "") === "true";
  const purpose: BeneficiaryPurpose = purposeRaw === "registration" ? "registration" : "ebook";
  const expectedAmount = Number(expectedAmountRaw);

  if (!(receiptFile instanceof File)) {
    return noStore({ ok: false, error: "Upload a JPG or PNG payment screenshot." }, 400);
  }
  if (receiptFile.size > MAX_RECEIPT_BYTES) {
    return noStore({ ok: false, error: "The receipt is larger than 5 MB." }, 413);
  }
  if (!enteredUtr || enteredUtr.length < 6 || enteredUtr.length > 40) {
    return noStore({ ok: false, error: "Enter a synthetic UTR for the probe decision." }, 400);
  }
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 || expectedAmount > 1_000_000) {
    return noStore({ ok: false, error: "Enter a positive expectedAmount for the probe decision." }, 400);
  }

  const bytes = Buffer.from(await receiptFile.arrayBuffer());
  const ext = detectReceipt(bytes, receiptFile.name);
  if (!ext || ext === "pdf" || ext === "webp") {
    return noStore({ ok: false, error: "Upload a JPG or PNG payment screenshot." }, 400);
  }

  const runtimeInfo = probeOcrRuntime();
  const started = Date.now();
  const ocr = await extractPaymentScreenshotAsync(bytes);
  const elapsedMs = Date.now() - started;
  const decision = decideScreenshotPayment({
    enteredUtr,
    extractedUtr: ocr.utr,
    extractedBeneficiary: ocr.beneficiary,
    extractedAmount: ocr.amountInr,
    paymentStatus: ocr.paymentStatus,
    expectedAmount,
    ocrConfidence: ocr.confidence,
    purpose,
    utrAlreadyUsed,
    ocrSource: ocr.source,
  });

  return noStore({
    ok: true,
    probe: "ocr-preview",
    writesData: false,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    elapsedMs,
    runtime: {
      available: runtimeInfo.available,
      engine: runtimeInfo.engine,
      engDataPresent: runtimeInfo.engDataPresent,
      tessdataPath: runtimeInfo.tessdataPath,
      detail: runtimeInfo.detail,
      executionEnvironment: runtimeInfo.executionEnvironment,
    },
    ocr: {
      source: ocr.source,
      confidence: ocr.confidence,
      utr: ocr.utr,
      beneficiary: ocr.beneficiary,
      amountInr: ocr.amountInr,
      paymentStatus: ocr.paymentStatus,
      rawTextLength: ocr.rawTextLength,
      detail: ocr.detail,
    },
    decision: {
      outcome: decision.outcome,
      approvalMethod: decision.approvalMethod,
      verificationLabel: decision.verificationLabel,
      reason: decision.reason,
      checks: decision.checks,
    },
  });
}
