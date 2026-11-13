import { cookies } from "next/headers";
import { learnCookieOptions } from "@/lib/portal/current";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { LEARN_COOKIE, sealSession } from "@/lib/portal/session";
import { readStudent, registerStudent } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  if (!rateLimit(`learn-register:${clientKey(request)}`, 8, 60 * 60 * 1000)) return noStore({ ok: false, error: "Too many attempts. Wait and try again." }, 429);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return noStore({ ok: false, error: "The form could not be read." }, 400);
  const result = await registerStudent(body);
  if (!result.ok) return noStore(result, 400);
  const stored = await readStudent(result.student.id);
  if (!stored) return noStore({ ok: false, error: "The account could not be opened." }, 500);
  const jar = await cookies();
  jar.set(LEARN_COOKIE, await sealSession(stored.id, stored.sessionVersion), learnCookieOptions());
  return noStore(result);
}
