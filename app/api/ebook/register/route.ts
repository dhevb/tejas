import { readEbookRegistration, saveEbookRegistration, toPublicEbook } from "@/lib/orders/ebook";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this form on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`ebook-register:${clientKey(request)}`, 10, 60 * 60 * 1000)) {
    return noStore({ ok: false, formErrors: ["Too many registrations. Wait a while and try again."] }, 429);
  }
  const idempotencyKey = request.headers.get("x-idempotency-key") ?? "";
  if (!/^[A-Za-z0-9-]{16,80}$/.test(idempotencyKey)) {
    return noStore({ ok: false, formErrors: ["The registration could not be started. Reload the page and try again."] }, 400);
  }
  const form = await request.formData();
  const parsed = readEbookRegistration(form);
  if (!parsed.value) return noStore({ ok: false, fieldErrors: parsed.errors, formErrors: [] }, 400);
  try {
    const saved = await saveEbookRegistration(parsed.value, idempotencyKey);
    if ("conflict" in saved) return noStore({ ok: false, formErrors: ["This submission was already used for a different registration."] }, 409);
    if ("duplicateEmail" in saved) return noStore({ ok: false, formErrors: ["This email is already used for a different e-book registration."] }, 409);
    const account = toPublicEbook(saved.account);
    return noStore({
      ok: true,
      account: {
        reference: account.reference,
        feeAmount: account.feeAmount,
        status: account.status,
        classNumber: account.classNumber,
        streams: account.streams,
        paymentVerified: account.paymentVerified,
        loginCreated: account.loginCreated,
      },
    }, saved.created ? 201 : 200);
  } catch {
    console.error("ebook registration save failed");
    return noStore({ ok: false, formErrors: ["The registration could not be saved. No registration was confirmed."] }, 503);
  }
}
