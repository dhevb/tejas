import { createHash, randomBytes } from "node:crypto";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { calculateIndividualRegistration } from "@/lib/registration/fee";
import { individualCharge, individualSchool, individualStudent, readIndividualForm } from "@/lib/registration/individual";
import { newReference } from "@/lib/registration/reference";
import { saveRegistration } from "@/lib/registration/store";

export const runtime = "nodejs";

function idemKey(form: FormData): string {
  const raw = [
    form.get("fullName"),
    form.get("dateOfBirth"),
    form.get("className"),
    form.get("schoolName"),
    form.get("mobile"),
    form.get("email"),
    form.get("streams"),
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this form on the TEJAS website."] }, 403);
  if (!rateLimit(`individual:${clientKey(request)}`, 10, 60 * 60 * 1000)) {
    return noStore({ ok: false, formErrors: ["Too many attempts. Wait and try again."] }, 429);
  }
  const form = await request.formData();
  const parsed = readIndividualForm(form);
  if (!parsed.value) {
    return noStore({ ok: false, fieldErrors: parsed.errors, formErrors: ["Correct the highlighted fields."] }, 400);
  }

  const charge = individualCharge(parsed.value.streams.length);
  const expected = calculateIndividualRegistration(parsed.value.streams.length);
  if (charge.payableToTejas !== expected.payableToTejas) {
    return noStore({ ok: false, formErrors: ["The fee could not be calculated."] }, 500);
  }

  const reference = newReference();
  const student = individualStudent(parsed.value);
  const school = individualSchool(parsed.value);
  const key = idemKey(form);
  const payloadHash = createHash("sha256").update(key).digest("hex");

  try {
    const record = await saveRegistration({
      reference,
      channel: "individual-registration",
      school,
      students: [student],
      fee: {
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
      },
      status: "awaiting_payment",
      transactionReference: null,
      upload: Buffer.from(`individual,${key},${randomBytes(4).toString("hex")}`),
      uploadExt: "csv",
      receipt: null,
      receiptExt: null,
      idempotencyKey: `individual:${key}`,
      payloadHash,
    });
    return noStore({ ok: true, reference: record.reference, amountDue: charge.payableToTejas, streams: parsed.value.streams.length });
  } catch {
    console.error("individual registration save failed");
    return noStore({ ok: false, formErrors: ["The registration could not be saved."] }, 503);
  }
}
