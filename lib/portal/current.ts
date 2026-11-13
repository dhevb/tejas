import { cookies } from "next/headers";
import { LEARN_COOKIE, openSession } from "@/lib/portal/session";
import { readStudent, type PortalStudent } from "@/lib/portal/store";

export async function currentStudent(): Promise<PortalStudent | null> {
  try {
    const jar = await cookies();
    const id = await openSession(jar.get(LEARN_COOKIE)?.value);
    if (!id) return null;
    return readStudent(id);
  } catch {
    return null;
  }
}

export function learnCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  };
}
