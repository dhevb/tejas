import { collectEbookCredential } from "@/lib/orders/ebook";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, message: "Open this form on the TEJAS website and try again." }, 403);
  if (!rateLimit(`ebook-credential:${clientKey(request)}`, 10, 60 * 60 * 1000)) {
    return noStore({ ok: false, message: "Too many attempts. Wait a while and try again." }, 429);
  }
  const form = await request.formData();
  const result = await collectEbookCredential(
    String(form.get("reference") ?? ""),
    String(form.get("email") ?? ""),
    String(form.get("mobile") ?? ""),
  );
  if (!result.ok) return noStore({ ok: false, message: result.message }, 400);
  return noStore({ ok: true, email: result.email, password: result.password });
}
