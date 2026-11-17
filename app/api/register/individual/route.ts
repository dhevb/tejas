import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { individualAlreadyRegistered, individualCharge, individualSchool, individualStudent, readIndividualForm } from "@/lib/registration/individual";
import type { FeeBreakdown } from "@/lib/registration/fee";
import { newReference } from "@/lib/registration/reference";
import { findIdempotent, payloadHash, saveRegistration, toPublicSummary } from "@/lib/registration/store";

export const runtime = "nodejs";

function feeFor(streams: number): FeeBreakdown {
  const charge = individualCharge(streams);
  return {
    studentStreamRegistrations: charge.units,
    totalStudentFees: charge.total,
    registrationSchoolShare: 0,
    registrationPayable: charge.payableToTejas,
    payableToTejas: charge.payableToTejas,
    schoolShare: 0,
    schoolShareApproved: true,
    printedBooks: 0,
    printedBookAmount: 0,
    bookSchoolShare: 0,
    bookPayable: 0,
    ebookAccess: 0,
    ebookAmount: 0,
    grossTotal: charge.total,
    amountDue: charge.payableToTejas,
  };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this form on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`individual:${clientKey(request)}`, 10, 60 * 60 * 1000)) {
    return noStore({ ok: false, formErrors: ["Too many submissions. Wait a while and try again."] }, 429);
  }
  const form = await request.formData();
  const parsed = readIndividualForm(form);
  if (!parsed.value) return noStore({ ok: false, fieldErrors: parsed.errors, formErrors: ["Check the highlighted fields."] }, 400);
  const fee = feeFor(parsed.value.streams.length);
  const student = individualStudent(parsed.value);
  const upload = Buffer.from([
    "Full Name of Student,Father's/Mother's Name,Class,School Name,Selected TEJAS Stream(s)",
    [student.fullName, student.parentName, student.classLabel, student.schoolName, student.streams.join(", ")].join(","),
  ].join("\n"));
  const key = request.headers.get("x-idempotency-key") ?? "";
  const hash = payloadHash([upload, Buffer.from(JSON.stringify({ fee, student: student.fullName, dob: student.dateOfBirth }))]);
  if (key) {
    const existing = await findIdempotent(key, hash);
    if (existing === "conflict") return noStore({ ok: false, formErrors: ["This submission key was already used for a different registration."] }, 409);
    if (existing) {
      const { readRegistration } = await import("@/lib/registration/store");
      const saved = await readRegistration(existing);
      if (saved) return noStore({ ok: true, registration: toPublicSummary(saved) });
    }
  }
  if (await individualAlreadyRegistered(parsed.value)) {
    return noStore({ ok: false, formErrors: ["This student is already registered for this date of birth and school."] }, 409);
  }
  const reference = newReference();
  try {
    const record = await saveRegistration({
      reference,
      school: individualSchool(parsed.value),
      students: [student],
      fee,
      status: "awaiting_payment",
      transactionReference: null,
      upload,
      uploadExt: "csv",
      receipt: null,
      receiptExt: null,
      idempotencyKey: key || undefined,
      payloadHash: key ? hash : undefined,
      channel: "individual",
    });
    return noStore({ ok: true, registration: toPublicSummary(record) }, 201);
  } catch {
    console.error("individual registration save failed");
    return noStore({ ok: false, formErrors: ["The registration could not be saved. It was not marked as paid."] }, 503);
  }
}
