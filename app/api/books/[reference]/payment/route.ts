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
  const extracted = extractUtr(bytes);
  const decision = decidePayment({
    enteredUtr: paid.value.transactionReference,
    extractedUtr: extracted.utr,
    expectedAmount: order.charge.payableToTejas,
    expectedAccount: receivingAccount(order.channel),
    bank: lookupTrustedTransaction(paid.value.transactionReference),
  });
  const saved = await attachBookProof(reference, order, bytes, ext, decision, paid.value.transactionReference, extracted.utr);
  if (!saved) return noStore({ ok: false, formErrors: ["A payment update is already on file for this order."] }, 409);
  return noStore({
    ok: true,
    paymentStatus: saved.payment.status,
    verified: saved.payment.status === "confirmed",
  });
}
