import { lookupTrustedTransaction } from "@/lib/registration/bank-reconciliation";
import { attachBookProof, bookTransactionSeen, readBookOrder } from "@/lib/registration/cases";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { decidePayment, receivingAccount } from "@/lib/registration/payment-decision";
import { detectScreenshot } from "@/lib/registration/receipt";
import { referenceIsValid } from "@/lib/registration/reference";
import { MAX_RECEIPT_BYTES } from "@/lib/registration/schema";
import { readPaymentSubmission } from "@/lib/registration/school";
import { extractUtr } from "@/lib/registration/screenshot-ocr";
import { transactionSeenBefore } from "@/lib/registration/store";
import { claimUtr, noteUtr, releaseUtr, utrOwner } from "@/lib/registration/utr-claim";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this page on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`book-proof:${clientKey(request)}`, 8, 60 * 60 * 1000)) return noStore({ ok: false, formErrors: ["Too many attempts. Wait and try again."] }, 429);
  const { reference } = await context.params;
  if (!referenceIsValid(reference)) return noStore({ ok: false, formErrors: ["Order not found."] }, 404);
  const order = await readBookOrder(reference);
  if (!order) return noStore({ ok: false, formErrors: ["Order not found."] }, 404);
  const form = await request.formData();
  const paid = readPaymentSubmission(form, order.charge.payableToTejas);
  const file = form.get("receipt");
  if (!paid.value || !(file instanceof File) || file.size === 0) {
    return noStore({ ok: false, fieldErrors: paid.errors, formErrors: ["Please upload your payment screenshot and enter the UTR number. Both are mandatory for payment verification."] }, 400);
  }
  if (file.size > MAX_RECEIPT_BYTES) return noStore({ ok: false, formErrors: ["The screenshot is larger than 5 MB."] }, 413);
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = detectScreenshot(bytes, file.name);
  if (!ext) return noStore({ ok: false, formErrors: ["Upload the payment screenshot as a JPEG, PNG, or WebP image."] }, 400);
  if (await transactionSeenBefore(paid.value.transactionReference) || await bookTransactionSeen(paid.value.transactionReference)) {
    return noStore({ ok: false, formErrors: ["This transaction reference is already recorded."] }, 409);
  }
  const owner = utrOwner(order.channel, reference);
  const claim = await claimUtr(paid.value.transactionReference, order.channel, owner);
  if (!claim.ok && claim.error === "duplicate") return noStore({ ok: false, formErrors: ["This transaction reference is already recorded."] }, 409);
  if (!claim.ok) return noStore({ ok: false, formErrors: ["The payment could not be checked for a duplicate reference. It was not marked as verified."] }, claim.error === "invalid" ? 400 : 503);
  const extracted = extractUtr(bytes);
  const decision = decidePayment({
    enteredUtr: paid.value.transactionReference,
    extractedUtr: extracted.utr,
    expectedAmount: order.charge.payableToTejas,
    expectedAccount: receivingAccount(order.channel),
    bank: lookupTrustedTransaction(paid.value.transactionReference),
  });
  try {
    const saved = await attachBookProof(reference, order, bytes, ext, decision, paid.value.transactionReference, extracted.utr);
    if (!saved) {
      if (!claim.reused) await releaseUtr(paid.value.transactionReference, owner);
      return noStore({ ok: false, formErrors: ["A payment update is already on file for this order."] }, 409);
    }
    await noteUtr(paid.value.transactionReference, owner, {
      extractedUtr: extracted.utr,
      bankResult: decision.bankResult,
      reviewReason: decision.outcome === "automatic" ? null : decision.reason,
      proofExt: ext,
      amountDue: order.charge.payableToTejas,
      paymentStatus: saved.payment.status,
    }).catch(() => undefined);
    return noStore({
      ok: true,
      paymentStatus: saved.payment.status,
      verified: saved.payment.status === "confirmed",
    });
  } catch {
    if (!claim.reused) await releaseUtr(paid.value.transactionReference, owner).catch(() => undefined);
    console.error("book payment proof save failed");
    return noStore({ ok: false, formErrors: ["The payment proof could not be saved. The payment was not marked as verified."] }, 503);
  }
}
