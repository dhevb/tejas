import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { readPaymentConfig } from "@/lib/registration/payment";
import { detectReceipt } from "@/lib/registration/receipt";
import { referenceIsValid } from "@/lib/registration/reference";
import { readPaymentSubmission } from "@/lib/registration/school";
import { MAX_RECEIPT_BYTES } from "@/lib/registration/schema";
import { attachReceipt, readRegistration, toPublicSummary, transactionSeenBefore } from "@/lib/registration/store";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this page on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`receipt:${clientKey(request)}`, 8, 60 * 60 * 1000)) return noStore({ ok: false, formErrors: ["Too many attempts. Wait and try again."] }, 429);
  const { reference } = await context.params;
  if (!referenceIsValid(reference)) return noStore({ ok: false, formErrors: ["Registration not found."] }, 404);
  const payment = await readPaymentConfig();
  if (!payment.activated) {
    return noStore({ ok: false, formErrors: ["Payment receipts are not accepted until official payment instructions are published."] }, 400);
  }
  const record = await readRegistration(reference);
  if (!record) return noStore({ ok: false, formErrors: ["Registration not found."] }, 404);
  if (record.payment.status === "confirmed" || record.payment.status === "reported" || record.payment.status === "refund_pending") {
    return noStore({ ok: false, formErrors: ["A payment update is already on file for this reference."] }, 409);
  }
  const form = await request.formData();
  const amountDue = record.fee.amountDue ?? record.fee.payableToTejas;
  const paid = readPaymentSubmission(form, amountDue);
  const receiptFile = form.get("receipt");
  if (!paid.value || !(receiptFile instanceof File)) {
    return noStore({ ok: false, fieldErrors: paid.errors, formErrors: ["Enter the payment details and upload the proof. This does not by itself confirm payment."] }, 400);
  }
  if (await transactionSeenBefore(paid.value.transactionReference)) {
    return noStore({ ok: false, formErrors: ["This transaction reference is already recorded."] }, 409);
  }
  if (receiptFile.size > MAX_RECEIPT_BYTES) return noStore({ ok: false, formErrors: ["The receipt is larger than 5 MB."] }, 413);
  const bytes = Buffer.from(await receiptFile.arrayBuffer());
  const ext = detectReceipt(bytes, receiptFile.name);
  if (!ext) return noStore({ ok: false, formErrors: ["Upload the receipt as a PDF, JPG, PNG, or WEBP file."] }, 400);
  const updated = await attachReceipt(reference, paid.value.transactionReference, bytes, ext, {
    mode: paid.value.mode,
    paidOn: paid.value.paidOn,
    payerName: paid.value.payerName,
  });
  if (!updated) return noStore({ ok: false, formErrors: ["The receipt could not be saved."] }, 409);
  return noStore({ ok: true, registration: toPublicSummary(updated) });
}
