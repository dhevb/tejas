import { calculateFee } from "@/lib/registration/fee";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { readPaymentConfig } from "@/lib/registration/payment";
import { detectReceipt } from "@/lib/registration/receipt";
import { newReference } from "@/lib/registration/reference";
import { readSchoolForm, validateTransactionReference } from "@/lib/registration/school";
import { MAX_RECEIPT_BYTES, MAX_UPLOAD_BYTES } from "@/lib/registration/schema";
import { detectSheetKind, parseStudentSheet } from "@/lib/registration/sheet";
import { findIdempotent, payloadHash, readRegistration, saveRegistration, storeIdempotency, toPublicSummary, type PaymentStatus } from "@/lib/registration/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this form on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`submit:${clientKey(request)}`, 10, 60 * 60 * 1000)) {
    return noStore({ ok: false, formErrors: ["Too many submissions. Wait a while and try again."] }, 429);
  }
  const idempotencyKey = request.headers.get("x-idempotency-key") ?? "";
  if (!/^[A-Za-z0-9-]{16,80}$/.test(idempotencyKey)) {
    return noStore({ ok: false, formErrors: ["The submission could not be started. Reload the page and try again."] }, 400);
  }

  const form = await request.formData();
  const schoolResult = readSchoolForm(form);
  if (!schoolResult.value) return noStore({ ok: false, fieldErrors: schoolResult.errors, formErrors: [] }, 400);

  const file = form.get("file");
  if (!(file instanceof File)) return noStore({ ok: false, formErrors: ["Choose the student sheet."], fieldErrors: {} }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return noStore({ ok: false, formErrors: ["The file is larger than 10 MB."], fieldErrors: {} }, 413);
  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = detectSheetKind(file.name, bytes);
  if ("error" in detected) return noStore({ ok: false, formErrors: [detected.error], fieldErrors: {} }, 400);
  const kind = detected.kind;

  const parsed = parseStudentSheet(bytes, file.name, schoolResult.value.schoolName);
  if (parsed.formErrors.length || parsed.rowErrors.length || parsed.students.length === 0) {
    return noStore({ ok: false, formErrors: parsed.formErrors, rowErrors: parsed.rowErrors, fieldErrors: {} }, 400);
  }
  const fee = calculateFee(parsed.students.reduce((sum, student) => sum + student.streams.length, 0));
  const hash = payloadHash([bytes, Buffer.from(JSON.stringify(schoolResult.value))]);
  const prior = await findIdempotent(idempotencyKey, hash);
  if (prior === "conflict") return noStore({ ok: false, formErrors: ["This submission was already used for a different sheet."] }, 409);
  if (prior) {
    const existing = await readRegistration(prior);
    if (existing) return noStore({ ok: true, registration: toPublicSummary(existing) });
  }

  const payment = await readPaymentConfig();
  const transactionRaw = String(form.get("transactionReference") ?? "").trim();
  const receiptFile = form.get("receipt");
  const hasReceipt = receiptFile instanceof File && receiptFile.size > 0;
  if (!payment.activated && (transactionRaw || hasReceipt)) {
    return noStore({ ok: false, formErrors: ["Payment receipts are not accepted until official payment instructions are published."], fieldErrors: {} }, 400);
  }

  let status: PaymentStatus = payment.activated ? "awaiting_payment" : "pending_instructions";
  let transactionReference: string | null = null;
  let receipt: Buffer | null = null;
  let receiptExt: "pdf" | "jpg" | "png" | "webp" | null = null;
  if (payment.activated && (transactionRaw || hasReceipt)) {
    if (!transactionRaw || !hasReceipt || !(receiptFile instanceof File)) {
      return noStore({ ok: false, fieldErrors: { transactionReference: "Enter the transaction reference and upload the receipt together." }, formErrors: [] }, 400);
    }
    const reference = validateTransactionReference(transactionRaw);
    if (!reference) {
      return noStore({ ok: false, fieldErrors: { transactionReference: "Enter the reference from the bank or UPI app. This is not accepted as proof until TEJAS Olympiad verifies it." }, formErrors: [] }, 400);
    }
    if (receiptFile.size > MAX_RECEIPT_BYTES) return noStore({ ok: false, formErrors: ["The receipt is larger than 5 MB."], fieldErrors: {} }, 413);
    const receiptBytes = Buffer.from(await receiptFile.arrayBuffer());
    receiptExt = detectReceipt(receiptBytes, receiptFile.name);
    if (!receiptExt) return noStore({ ok: false, formErrors: ["Upload the receipt as a PDF, JPG, PNG, or WEBP file."], fieldErrors: {} }, 400);
    transactionReference = reference;
    receipt = receiptBytes;
    status = "reported";
  }

  const reference = newReference();
  const saved = await saveRegistration({
    reference,
    school: schoolResult.value,
    students: parsed.students,
    fee,
    status,
    transactionReference,
    upload: bytes,
    uploadExt: kind,
    receipt,
    receiptExt,
  });
  await storeIdempotency(idempotencyKey, reference, hash);
  return noStore({ ok: true, registration: toPublicSummary(saved) }, 201);
}
