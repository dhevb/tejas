import { readIndividualBookForm } from "@/lib/registration/book-order";
import { publicBookOrder, readBookOrder, saveBookOrder, type BookOrder } from "@/lib/registration/cases";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { BOOK_BANK } from "@/lib/registration/official-bank";
import { newReference } from "@/lib/registration/reference";
import { findIdempotent, payloadHash, storeIdempotency } from "@/lib/registration/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this form on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`individual-book:${clientKey(request)}`, 10, 60 * 60 * 1000)) return noStore({ ok: false, formErrors: ["Too many orders. Wait and try again."] }, 429);
  const form = await request.formData();
  const parsed = readIndividualBookForm(form);
  if (!parsed.value) return noStore({ ok: false, fieldErrors: parsed.errors, formErrors: ["Check the book order."] }, 400);
  const input = parsed.value;
  const key = request.headers.get("x-idempotency-key") ?? "";
  const hash = payloadHash([Buffer.from(JSON.stringify({ student: input.studentName, quantity: input.quantity, stream: input.streamId }))]);
  if (key) {
    const existing = await findIdempotent(key, hash);
    if (existing === "conflict") return noStore({ ok: false, formErrors: ["This submission key was already used for a different order."] }, 409);
    if (existing) {
      const saved = await readBookOrder(existing);
      if (saved) return noStore({ ok: true, order: publicBookOrder(saved) });
    }
  }
  const reference = newReference();
  const order: BookOrder = {
    kind: "book",
    reference,
    channel: "individual-book",
    createdAt: new Date().toISOString(),
    schoolName: input.schoolName,
    phone: input.mobile,
    email: input.email,
    deliveryAddress: input.deliveryAddress,
    district: input.district,
    state: input.state,
    pin: input.pin,
    contactName: input.parentName,
    contactMobile: input.mobile,
    contactEmail: input.email,
    studentName: input.studentName,
    parentName: input.parentName,
    classNumber: input.classNumber,
    streamId: input.streamId,
    lines: [{ streamId: input.streamId, classNumber: input.classNumber, quantity: input.quantity }],
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
  try {
    await saveBookOrder(order);
    if (key && !process.env.SUPABASE_URL) await storeIdempotency(key, reference, hash);
    return noStore({ ok: true, order: publicBookOrder(order) }, 201);
  } catch {
    console.error("individual book order save failed");
    return noStore({ ok: false, formErrors: ["The book order could not be saved."] }, 503);
  }
}
