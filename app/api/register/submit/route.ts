import { calculateFee } from "@/lib/registration/fee";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { newReference } from "@/lib/registration/reference";
import { readSchoolForm } from "@/lib/registration/school";
import { MAX_UPLOAD_BYTES } from "@/lib/registration/schema";
import { detectSheetKind, parseStudentSheet } from "@/lib/registration/sheet";
import { findIdempotent, panSeenBefore, payloadHash, readRegistration, saveRegistration, toPublicSummary, type PaymentStatus } from "@/lib/registration/store";

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
  const transactionRaw = String(form.get("transactionReference") ?? "").trim();
  const receiptFile = form.get("receipt");
  if (transactionRaw || (receiptFile instanceof File && receiptFile.size > 0)) {
    return noStore({ ok: false, formErrors: ["Submit the registration without a receipt. Please upload your payment screenshot and enter the UTR number. Both are mandatory for payment verification."], fieldErrors: {} }, 400);
  }
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
  schoolResult.value.printedBooks = "no";
  schoolResult.value.bookQuantity = 0;
  const fee = calculateFee(streamCount, {
    printedBooks: 0,
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

  const status: PaymentStatus = "pending_instructions";
  const transactionReference: string | null = null;
  const receipt: Buffer | null = null;
  const receiptExt = null;
  const paymentMode: string | null = null;
  const paidOn: string | null = null;
  const payerName: string | null = null;

  const reference = newReference();
  try {
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
      idempotencyKey,
      payloadHash: hash,
    });
    return noStore({ ok: true, registration: toPublicSummary(saved) }, 201);
  } catch {
    console.error("registration save failed");
    return noStore({ ok: false, formErrors: ["The registration could not be saved. No registration was confirmed. Please try again."] }, 503);
  }
}
