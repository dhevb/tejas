import { createEbookSession, EBOOK_COOKIE, ebookSecret, findEbookByEmail, passwordMatches } from "@/lib/orders/ebook";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";

export const runtime = "nodejs";

function sessionCookie(value: string, request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${EBOOK_COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this form on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`ebook-login:${clientKey(request)}`, 20, 60 * 60 * 1000)) {
    return noStore({ ok: false, formErrors: ["Too many sign-in attempts. Wait a while and try again."] }, 429);
  }
  if (!ebookSecret()) return noStore({ ok: false, formErrors: ["E-book sign-in is not configured."] }, 503);
  const form = await request.formData();
  const account = await findEbookByEmail(String(form.get("email") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!account || !passwordMatches(account, password)) {
    return noStore({ ok: false, formErrors: ["The email or password is not correct, or payment has not been verified."] }, 401);
  }
  const session = createEbookSession(account.reference);
  if (!session) return noStore({ ok: false, formErrors: ["E-book sign-in is not configured."] }, 503);
  const response = noStore({ ok: true });
  response.headers.append("Set-Cookie", sessionCookie(session, request, 8 * 60 * 60));
  return response;
}
