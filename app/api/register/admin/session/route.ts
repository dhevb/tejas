import { cookies } from "next/headers";
import { STAFF_COOKIE, adminConfigured, createSessionValue, tokenMatches } from "@/lib/registration/auth";
import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open the staff page on this website." }, 403);
  if (!adminConfigured()) return noStore({ ok: false, error: "Staff review is not configured. No password has been set." }, 503);
  if (!rateLimit(`staff:${clientKey(request)}`, 8, 15 * 60 * 1000)) return noStore({ ok: false, error: "Too many attempts." }, 429);
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  if (!body?.token || !tokenMatches(body.token)) return noStore({ ok: false, error: "The access token was not accepted." }, 401);
  const jar = await cookies();
  jar.set(STAFF_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return noStore({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(STAFF_COOKIE);
  return noStore({ ok: true });
}
