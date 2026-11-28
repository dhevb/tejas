/**
 * Safe UTR reservation recovery for e-book payments.
 *
 * Rules:
 * - Exact bank UTR only (never fabricate).
 * - A successfully claimed UTR is never released for reuse after a valid claim.
 * - Same owner (student:book) may retry and reclaim idempotently.
 * - Invalid UTRs are rejected before any registry write.
 * - Claim and entitlement write are not one DB transaction; recovery is idempotent retry.
 */

export type UtrPaymentPhase =
  | "precheck"
  | "claimed"
  | "entitlement_reported"
  | "entitlement_verified"
  | "noted"
  | "failed_after_claim"
  | "failed_after_report";

export type UtrPaymentRecoveryState = {
  phase: UtrPaymentPhase;
  studentId: string;
  bookId: string;
  /** Exact bank UTR as entered — never altered. */
  utr: string;
  owner: string;
  claimed: boolean;
  message: string;
};

export function ebookUtrOwner(studentId: string, bookId: string): string {
  return `ebook:${studentId}:${bookId}`;
}

/** Invalid or empty UTR must never enter the registry. */
export function utrIsClaimableFormat(utr: string): boolean {
  const key = utr.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z0-9-]{6,40}$/.test(key);
}

/**
 * Recovery guidance after a failure once a UTR was claimed for this student/book.
 * Deliberately does not recommend releasing the UTR (would allow reuse).
 */
export function recoveryAfterClaimFailure(input: {
  studentId: string;
  bookId: string;
  utr: string;
  stage: "after_claim" | "after_report" | "during_entitlement" | "transient";
}): UtrPaymentRecoveryState {
  const owner = ebookUtrOwner(input.studentId, input.bookId);
  const phase: UtrPaymentPhase =
    input.stage === "after_report" ? "failed_after_report" : "failed_after_claim";
  return {
    phase,
    studentId: input.studentId,
    bookId: input.bookId,
    utr: input.utr,
    owner,
    claimed: true,
    message:
      "The UTR remains reserved for this student and book. Retry the same UTR for the same stream. Do not submit a different UTR for this stream, and do not reuse this UTR for another payment.",
  };
}

export function shouldAcceptIdempotentRetry(input: {
  existingStatus: string;
  existingReference: string | null;
  incomingReference: string;
}): { ok: true; action: "noop_verified" | "noop_reported" | "continue" } | { ok: false; error: string } {
  const incoming = input.incomingReference.trim();
  if (input.existingStatus === "verified") {
    if (input.existingReference === incoming) return { ok: true, action: "noop_verified" };
    return { ok: false, error: "Payment is already verified." };
  }
  if (input.existingStatus === "reported" || input.existingStatus === "rejected") {
    if (input.existingReference === incoming) return { ok: true, action: "noop_reported" };
    if (input.existingReference && input.existingReference !== incoming) {
      return {
        ok: false,
        error: "A different UTR is already recorded for this stream. Contact TEJAS staff if you need a correction.",
      };
    }
  }
  return { ok: true, action: "continue" };
}
