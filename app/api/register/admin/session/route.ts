import { clearStaffCookieHeader, createSessionValue, staffCookieHeader, tokenMatches, adminConfigured, STAFF_RECOVERY_SUBJECT } from "@/lib/registration/auth";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { bumpStaffSession } from "@/lib/registration/staff-directory";
import { staffSubject } from "@/lib/registration/staff";

export const runtime = "nodejs";

function withCookie(body: unknown, status: number, cookie: string | null) {
  const headers = new Headers({ "Cache-Control": "no-store", "Content-Type": "application/json" });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

/**
 * School registration administration is owner-only.
 * Email/password and school-staff accounts cannot open this session.
 * The configured TEJAS_ADMIN_TOKEN (owner recovery) is the sole registration admin credential.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open the staff page on this website." }, 403);
  if (!rateLimit(`staff:${clientKey(request)}`, 8, 15 * 60 * 1000)) return noStore({ ok: false, error: "Too many attempts." }, 429);
  const body = (await request.json().catch(() => null)) as { token?: unknown; email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (email || password) {
    console.error("staff sign-in rejected school-staff path");
    return noStore(
      {
        ok: false,
        error:
          "Registration review is owner-only. School staff cannot sign in here. Use the owner access token.",
      },
      401,
    );
  }
  if (!adminConfigured()) return noStore({ ok: false, error: "Staff review is not configured. No password has been set." }, 503);
  if (typeof body?.token !== "string" || !tokenMatches(body.token)) {
    console.error("staff sign-in rejected");
    return noStore({ ok: false, error: "The access token was not accepted." }, 401);
  }
  const version = await bumpStaffSession(STAFF_RECOVERY_SUBJECT);
  const sessionVersion = typeof version === "number" ? version : 0;
  console.info("staff sign-in accepted recovery");
  return withCookie({ ok: true, identity: STAFF_RECOVERY_SUBJECT, role: "owner" }, 200, staffCookieHeader(createSessionValue(STAFF_RECOVERY_SUBJECT, sessionVersion)));
}

export async function DELETE() {
  const subject = await staffSubject();
  if (subject) {
    const version = await bumpStaffSession(subject);
    if (typeof version !== "number") console.error("staff session revocation could not reach the database");
  }
  return withCookie({ ok: true }, 200, clearStaffCookieHeader());
}
