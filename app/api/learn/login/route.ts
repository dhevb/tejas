import { cookies } from "next/headers";
import { learnCookieOptions } from "@/lib/portal/current";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { LEARN_COOKIE, sealSession } from "@/lib/portal/session";
import { authenticate, rotateSession } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  if (!rateLimit(`learn-login:${clientKey(request)}`, 10, 15 * 60 * 1000)) return noStore({ ok: false, error: "Too many attempts. Wait and try again." }, 429);
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const student = body ? await authenticate(body.email, body.password) : null;
  if (!student) return noStore({ ok: false, error: "The email or password was not accepted." }, 401);
  const sessionVersion = await rotateSession(student.id);
  if (sessionVersion == null) return noStore({ ok: false, error: "The email or password was not accepted." }, 401);
  const jar = await cookies();
  jar.set(LEARN_COOKIE, await sealSession(student.id, sessionVersion), learnCookieOptions());
  return noStore({ ok: true, student });
}
