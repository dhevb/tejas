import { cookies } from "next/headers";
import { LEARN_COOKIE, openSession } from "@/lib/portal/session";
import { PortalUnavailable, readStudent, type PortalStudent } from "@/lib/portal/store";

export async function currentStudent(): Promise<PortalStudent | null> {
  try {
    const jar = await cookies();
    const opened = await openSession(jar.get(LEARN_COOKIE)?.value);
    if (!opened) return null;
    const student = await readStudent(opened.studentId);
    if (!student || student.sessionVersion !== opened.sessionVersion) return null;
    return student;
  } catch (error) {
    if (error instanceof PortalUnavailable) throw error;
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

export function learnCookieHeader(value: string): string {
  const options = learnCookieOptions();
  const parts = [`tejas_learn=${value}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${options.maxAge}`];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearLearnCookieHeader(): string {
  const parts = ["tejas_learn=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}
