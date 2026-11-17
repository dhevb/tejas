import { readSchoolBookForm } from "@/lib/registration/book-order";
import { saveBookOrder, type BookOrder } from "@/lib/registration/cases";
import { BOOK_BANK } from "@/lib/registration/official-bank";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { newReference } from "@/lib/registration/reference";
import { findIdempotent, payloadHash } from "@/lib/registration/store";
import { publicBookOrder, readBookOrder } from "@/lib/registration/cases";

export const runtime = "nodejs";

function orderFrom(input: ReturnType<typeof readSchoolBookForm>["value"], reference: string): BookOrder {
  if (!input) throw new Error("Missing book order.");
  return {
    kind: "book",
    reference,
    channel: "school-book",
    createdAt: new Date().toISOString(),
    schoolName: input.schoolName,
    phone: input.phone,
    email: input.email,
    deliveryAddress: input.deliveryAddress,
    district: input.district,
    state: input.state,
    pin: input.pin,
    contactName: input.contactName,
    contactMobile: input.contactMobile,
    contactEmail: input.contactEmail,
    studentName: null,
    parentName: null,
    classNumber: null,
    streamId: null,
    lines: input.lines,
    pan: input.pan,
    charge: input.charge,
    payment: {
      status: "awaiting_payment",
      transactionReference: null,
      reviewNote: null,
      enteredUtr: null,
      extractedUtr: null,
      reviewReason: null,
      bankResult: null,
      receivingAccount: BOOK_BANK.accountNumber,
      approvalMethod: null,
    },
    proofExt: null,
  };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this form on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`school-book:${clientKey(request)}`, 10, 60 * 60 * 1000)) return noStore({ ok: false, formErrors: ["Too many orders. Wait and try again."] }, 429);
  const form = await request.formData();
  const parsed = readSchoolBookForm(form);
  if (!parsed.value) return noStore({ ok: false, fieldErrors: parsed.errors, formErrors: ["Check the book order."] }, 400);
  const key = request.headers.get("x-idempotency-key") ?? "";
  const hash = payloadHash([Buffer.from(JSON.stringify({ ...parsed.value, pan: parsed.value.pan ? "provided" : "" }))]);
  if (key) {
    const existing = await findIdempotent(key, hash);
    if (existing === "conflict") return noStore({ ok: false, formErrors: ["This submission key was already used for a different order."] }, 409);
    if (existing) {
      const saved = await readBookOrder(existing);
      if (saved) return noStore({ ok: true, order: publicBookOrder(saved) });
    }
  }
  const reference = newReference();
  try {
    const order = orderFrom(parsed.value, reference);
    await saveBookOrder(order, key ? { key, hash } : undefined);
    if (key) {
      const { storeIdempotency } = await import("@/lib/registration/store");
      if (!process.env.SUPABASE_URL) await storeIdempotency(key, reference, hash);
    }
    return noStore({ ok: true, order: publicBookOrder(order) }, 201);
  } catch {
    console.error("school book order save failed");
    return noStore({ ok: false, formErrors: ["The book order could not be saved."] }, 503);
  }
}
