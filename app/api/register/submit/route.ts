import { calculateFee } from "@/lib/registration/fee";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { readPaymentConfig } from "@/lib/registration/payment";
import { detectReceipt } from "@/lib/registration/receipt";
import { newReference } from "@/lib/registration/reference";
import { readPaymentSubmission, readSchoolForm } from "@/lib/registration/school";
import { MAX_RECEIPT_BYTES, MAX_UPLOAD_BYTES } from "@/lib/registration/schema";
import { detectSheetKind, parseStudentSheet } from "@/lib/registration/sheet";
import { findIdempotent, panSeenBefore, payloadHash, readRegistration, saveRegistration, storeIdempotency, toPublicSummary, transactionSeenBefore, type PaymentStatus } from "@/lib/registration/store";

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
  const streamCount = parsed.students.reduce((sum, student) => sum + student.streams.length, 0);
  const fee = calculateFee(streamCount, {
    printedBooks: schoolResult.value.printedBooks === "yes" ? schoolResult.value.bookQuantity : 0,
    ebookAccess: schoolResult.value.ebookAccess === "yes" ? parsed.students.length : 0,
  });
  const hash = payloadHash([bytes, Buffer.from(JSON.stringify(schoolResult.value))]);
  const prior = await findIdempotent(idempotencyKey, hash);
  if (prior === "conflict") return noStore({ ok: false, formErrors: ["This submission was already used for a different sheet."] }, 409);
  if (prior) {
    const existing = await readRegistration(prior);
    if (existing) return noStore({ ok: true, registration: toPublicSummary(existing) });
  }
  schoolResult.value.panDuplicate = await panSeenBefore(schoolResult.value.pan);

  const payment = await readPaymentConfig();
  const transactionRaw = String(form.get("transactionReference") ?? "").trim();
  const receiptFile = form.get("receipt");
  const hasReceipt = receiptFile instanceof File && receiptFile.size > 0;
  if (!payment.activated && (transactionRaw || hasReceipt)) {
    return noStore({ ok: false, formErrors: ["Payment-proof submission is not open yet. Submit the registration without a receipt. The official account details are on the form."], fieldErrors: {} }, 400);
  }

  let status: PaymentStatus = "pending_instructions";
  let transactionReference: string | null = null;
  let receipt: Buffer | null = null;
  let receiptExt: "pdf" | "jpg" | "png" | "webp" | null = null;
  let paymentMode: string | null = null;
  let paidOn: string | null = null;
  let payerName: string | null = null;
  if (payment.activated) {
    const paid = readPaymentSubmission(form, fee.amountDue);
    if (!paid.value) return noStore({ ok: false, fieldErrors: paid.errors, formErrors: ["Payment proof is required. Registration is not confirmed until TEJAS Olympiad verifies the payment."] }, 400);
    if (!(receiptFile instanceof File) || receiptFile.size === 0) {
      return noStore({ ok: false, formErrors: ["Upload the payment proof as a JPG, PNG, or PDF."], fieldErrors: {} }, 400);
    }
    if (receiptFile.size > MAX_RECEIPT_BYTES) return noStore({ ok: false, formErrors: ["The payment proof is larger than 5 MB."], fieldErrors: {} }, 413);
    const receiptBytes = Buffer.from(await receiptFile.arrayBuffer());
    receiptExt = detectReceipt(receiptBytes, receiptFile.name);
    if (!receiptExt) return noStore({ ok: false, formErrors: ["Upload the payment proof as a PDF, JPG, PNG, or WEBP file."], fieldErrors: {} }, 400);
    if (await transactionSeenBefore(paid.value.transactionReference)) {
      return noStore({ ok: false, formErrors: ["This transaction reference is already recorded. A second registration cannot use the same payment."] }, 409);
    }
    transactionReference = paid.value.transactionReference;
    paymentMode = paid.value.mode;
    paidOn = paid.value.paidOn;
    payerName = paid.value.payerName;
    receipt = receiptBytes;
    status = "reported";
  } else if (transactionRaw || hasReceipt) {
    return noStore({ ok: false, formErrors: ["Payment-proof submission is not open yet. Submit the registration without a receipt. The official account details are on the form."], fieldErrors: {} }, 400);
  }

  const reference = newReference();
  const saved = await saveRegistration({
    reference,
    school: schoolResult.value,
    students: parsed.students,
    fee,
    status,
    transactionReference,
    paymentMode,
    paidOn,
    payerName,
    upload: bytes,
    uploadExt: kind,
    receipt,
    receiptExt,
  });
  await storeIdempotency(idempotencyKey, reference, hash);
  return noStore({ ok: true, registration: toPublicSummary(saved) }, 201);
}
