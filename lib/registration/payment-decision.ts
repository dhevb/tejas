import { matchBeneficiary, type BeneficiaryPurpose } from "@/lib/registration/beneficiary-match";

export type PaymentCategory =
  | "school-registration"
  | "individual-registration"
  | "ebook";

export type ScreenshotPaymentSignals = {
  /** UTR typed by the user. */
  enteredUtr: string;
  /** UTR extracted from the screenshot OCR. */
  extractedUtr: string | null;
  /** Beneficiary / account name extracted from the screenshot. */
  extractedBeneficiary: string | null;
  /** Amount extracted from the screenshot in whole rupees, or null if unreadable. */
  extractedAmount: number | null;
  /** Payment status inferred from the screenshot. */
  paymentStatus: "success" | "pending" | "failed" | "unknown";
  /** Server-calculated amount due for this transaction. */
  expectedAmount: number;
  /** Whether OCR confidence is high enough to trust the fields. */
  ocrConfidence: "high" | "low";
  /** Which published beneficiary allowlist to apply. */
  purpose: BeneficiaryPurpose;
  /** True when this UTR is already claimed by another owner. */
  utrAlreadyUsed: boolean;
  /**
   * OCR engine source. Fixture/glyph helpers and missing OCR must never auto-approve.
   */
  ocrSource?: "fixture" | "tesseractjs" | "none";
};

export type PaymentDecision = {
  outcome: "automatic" | "exception";
  approvalMethod: "screenshot_ocr_automatic" | "pending_exception";
  reason: string;
  checks: {
    utr: "match" | "mismatch" | "missing" | "unreadable";
    beneficiary: "match" | "missing" | "ambiguous" | "unrelated";
    amount: "match" | "mismatch" | "missing";
    status: "success" | "pending" | "failed" | "unknown";
    duplicate: "ok" | "duplicate";
    confidence: "high" | "low";
  };
  /**
   * Transparent note: screenshot OCR matching is not bank-statement confirmation.
   */
  verificationLabel: "screenshot_ocr_match" | "screenshot_ocr_exception";
};

function normaliseUtr(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function utrsMatch(entered: string, extracted: string | null): boolean {
  if (!extracted) return false;
  const a = normaliseUtr(entered);
  const b = normaliseUtr(extracted);
  return a.length > 0 && a === b;
}

/**
 * Owner-approved screenshot automatic approval.
 * Approves only when UTR, beneficiary, amount, success status, uniqueness,
 * and OCR confidence all pass. Does not require a bank API credit lookup.
 * Does not label the result as bank-verified.
 */
export function decideScreenshotPayment(input: ScreenshotPaymentSignals): PaymentDecision {
  const checks: PaymentDecision["checks"] = {
    utr: "missing",
    beneficiary: "missing",
    amount: "missing",
    status: input.paymentStatus,
    duplicate: input.utrAlreadyUsed ? "duplicate" : "ok",
    confidence: input.ocrConfidence,
  };

  const fail = (reason: string, patch: Partial<PaymentDecision["checks"]>): PaymentDecision => ({
    outcome: "exception",
    approvalMethod: "pending_exception",
    reason,
    checks: { ...checks, ...patch },
    verificationLabel: "screenshot_ocr_exception",
  });

  if (input.ocrSource === "fixture" || input.ocrSource === "none") {
    return fail(
      input.ocrSource === "fixture"
        ? "Fixture OCR output cannot auto-approve a payment."
        : "Screenshot OCR is unavailable or returned no usable text.",
      { confidence: "low" },
    );
  }
  if (input.ocrConfidence === "low") {
    return fail("OCR confidence is too low to auto-approve this screenshot.", { confidence: "low" });
  }
  if (!input.extractedUtr) {
    return fail("The UTR could not be read from the screenshot.", { utr: "unreadable" });
  }
  if (!utrsMatch(input.enteredUtr, input.extractedUtr)) {
    return fail("The entered UTR does not match the UTR read from the screenshot.", { utr: "mismatch" });
  }
  checks.utr = "match";

  const beneficiary = matchBeneficiary(input.extractedBeneficiary, input.purpose);
  if (!beneficiary.ok) {
    return fail(
      beneficiary.reason === "missing"
        ? "The beneficiary name could not be read from the screenshot."
        : beneficiary.reason === "ambiguous"
          ? "The beneficiary name on the screenshot is ambiguous."
          : "The beneficiary name on the screenshot does not match the official account holder.",
      { beneficiary: beneficiary.reason },
    );
  }
  checks.beneficiary = "match";

  if (input.extractedAmount == null) {
    return fail("The payment amount could not be read from the screenshot.", { amount: "missing" });
  }
  if (input.extractedAmount !== input.expectedAmount) {
    return fail("The amount on the screenshot does not match the amount due.", { amount: "mismatch" });
  }
  checks.amount = "match";

  if (input.paymentStatus === "pending") {
    return fail("The screenshot shows a pending payment, not a completed credit.", { status: "pending" });
  }
  if (input.paymentStatus === "failed") {
    return fail("The screenshot shows a failed payment.", { status: "failed" });
  }
  if (input.paymentStatus !== "success") {
    return fail("The screenshot does not clearly show a successful payment.", { status: "unknown" });
  }

  if (input.utrAlreadyUsed) {
    return fail("This UTR is already used for another payment.", { duplicate: "duplicate" });
  }

  return {
    outcome: "automatic",
    approvalMethod: "screenshot_ocr_automatic",
    reason:
      "Screenshot OCR matched the entered UTR, official beneficiary, amount due, and success status. This is screenshot-based automatic approval, not bank-statement confirmation.",
    checks,
    verificationLabel: "screenshot_ocr_match",
  };
}
