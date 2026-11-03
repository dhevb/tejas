import { readBookOrder, savePrintedBookOrder } from "@/lib/orders/books";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this form on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`book-order:${clientKey(request)}`, 10, 60 * 60 * 1000)) {
    return noStore({ ok: false, formErrors: ["Too many orders. Wait a while and try again."] }, 429);
  }
  const idempotencyKey = request.headers.get("x-idempotency-key") ?? "";
  if (!/^[A-Za-z0-9-]{16,80}$/.test(idempotencyKey)) {
    return noStore({ ok: false, formErrors: ["The order could not be started. Reload the page and try again."] }, 400);
  }
  const form = await request.formData();
  const parsed = readBookOrder(form);
  if (!parsed.value) return noStore({ ok: false, fieldErrors: parsed.errors, formErrors: [] }, 400);
  try {
    const saved = await savePrintedBookOrder(parsed.value, idempotencyKey);
    if ("conflict" in saved) return noStore({ ok: false, formErrors: ["This submission was already used for a different order."] }, 409);
    return noStore({
      ok: true,
      order: {
        reference: saved.order.reference,
        quantity: saved.order.quantity,
        grossAmount: saved.order.grossAmount,
        schoolShare: saved.order.schoolShare,
        amountPayable: saved.order.amountPayable,
        paymentCollected: false,
        dispatched: false,
      },
    }, saved.created ? 201 : 200);
  } catch {
    console.error("printed book order save failed");
    return noStore({ ok: false, formErrors: ["The order could not be saved. No order was confirmed."] }, 503);
  }
}
