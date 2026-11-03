import { toPublicEbook, verifyEbookPayment } from "@/lib/orders/ebook";
import { noStore, sameOrigin } from "@/lib/registration/http";
import { staffAuthorised } from "@/lib/registration/staff";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, message: "Open this form on the TEJAS website and try again." }, 403);
  if (!(await staffAuthorised())) return noStore({ ok: false, message: "Staff sign-in is required." }, 401);
  const form = await request.formData();
  const result = await verifyEbookPayment(String(form.get("reference") ?? "").trim());
  if (!result.ok) return noStore({ ok: false, message: result.message }, 404);
  const account = toPublicEbook(result.account);
  return noStore({
    ok: true,
    alreadyActive: result.alreadyActive,
    reference: account.reference,
    email: account.email,
    feeAmount: account.feeAmount,
    password: result.password,
  });
}
