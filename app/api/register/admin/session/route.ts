import { clearStaffCookieHeader, createSessionValue, staffCookieHeader, tokenMatches, adminConfigured, STAFF_RECOVERY_SUBJECT } from "@/lib/registration/auth";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { authenticateStaff, bumpStaffSession } from "@/lib/registration/staff-directory";
import { passwordIsAcceptable } from "@/lib/portal/session";
import { staffSubject } from "@/lib/registration/staff";

export const runtime = "nodejs";

function withCookie(body: unknown, status: number, cookie: string | null) {
  const headers = new Headers({ "Cache-Control": "no-store", "Content-Type": "application/json" });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open the staff page on this website." }, 403);
  if (!rateLimit(`staff:${clientKey(request)}`, 8, 15 * 60 * 1000)) return noStore({ ok: false, error: "Too many attempts." }, 429);
  const body = (await request.json().catch(() => null)) as { token?: unknown; email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (email || password) {
    if (!passwordIsAcceptable(password)) {
      console.error("staff sign-in rejected");
      return noStore({ ok: false, error: "The email or password was not accepted." }, 401);
    }
    const account = await authenticateStaff(email, password);
    if (account === "unavailable") {
      console.error("staff email sign-in unavailable");
      return noStore({ ok: false, error: "Staff email sign-in needs the portal database. The recovery token still opens this page." }, 503);
    }
    if (!account) {
      console.error("staff sign-in rejected");
      return noStore({ ok: false, error: "The email or password was not accepted." }, 401);
    }
    if (!adminConfigured()) return noStore({ ok: false, error: "Staff review is not configured. No password has been set." }, 503);
    const version = await bumpStaffSession(account.id);
    if (typeof version !== "number") {
      console.error("staff session could not be stored");
      return noStore({ ok: false, error: "Staff email sign-in needs the portal database. The recovery token still opens this page." }, 503);
    }
    console.info("staff sign-in accepted account");
    return withCookie({ ok: true, identity: account.email }, 200, staffCookieHeader(createSessionValue(account.id, version)));
  }
  if (!adminConfigured()) return noStore({ ok: false, error: "Staff review is not configured. No password has been set." }, 503);
  if (typeof body?.token !== "string" || !tokenMatches(body.token)) {
    console.error("staff sign-in rejected");
    return noStore({ ok: false, error: "The access token was not accepted." }, 401);
  }
  const version = await bumpStaffSession(STAFF_RECOVERY_SUBJECT);
  const sessionVersion = typeof version === "number" ? version : 0;
  console.info("staff sign-in accepted recovery");
  return withCookie({ ok: true, identity: STAFF_RECOVERY_SUBJECT }, 200, staffCookieHeader(createSessionValue(STAFF_RECOVERY_SUBJECT, sessionVersion)));
}

export async function DELETE() {
  const subject = await staffSubject();
  if (subject) {
    const version = await bumpStaffSession(subject);
    if (typeof version !== "number") console.error("staff session revocation could not reach the database");
  }
  return withCookie({ ok: true }, 200, clearStaffCookieHeader());
}
