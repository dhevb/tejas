import { learnCookieHeader } from "@/lib/portal/current";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { sealSession } from "@/lib/portal/session";
import { authenticate, rotateSession } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  if (!rateLimit(`learn-login:${clientKey(request)}`, 10, 15 * 60 * 1000)) return noStore({ ok: false, error: "Too many attempts. Wait and try again." }, 429);
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const result = body ? await authenticate(body.email, body.password) : { ok: false as const, error: "The email or password was not accepted." };
  if (!result.ok) {
    const unavailable = "unavailable" in result && result.unavailable === true;
    return noStore({ ok: false, error: result.error }, unavailable ? 503 : 401);
  }
  let sessionVersion: number | null;
  try {
    sessionVersion = await rotateSession(result.student.id);
  } catch {
    return noStore({ ok: false, error: "The student portal database is not available." }, 503);
  }
  if (sessionVersion == null) return noStore({ ok: false, error: "The email or password was not accepted." }, 401);
  const headers = new Headers({ "Cache-Control": "no-store", "Content-Type": "application/json" });
  headers.set("Set-Cookie", learnCookieHeader(await sealSession(result.student.id, sessionVersion)));
  return new Response(JSON.stringify({ ok: true, student: result.student }), { status: 200, headers });
}
