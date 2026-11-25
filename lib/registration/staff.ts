import { cookies } from "next/headers";
import { STAFF_COOKIE, STAFF_RECOVERY_SUBJECT, openStaffSession } from "@/lib/registration/auth";
import { staffEmail, staffSessionVersion } from "@/lib/registration/staff-directory";

async function openedSession() {
  try {
    const jar = await cookies();
    return openStaffSession(jar.get(STAFF_COOKIE)?.value);
  } catch {
    return null;
  }
}

function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

async function sessionAllowed(session: ReturnType<typeof openStaffSession>): Promise<boolean> {
  if (!session) return false;
  if (session.version === 0) {
    if (session.subject !== STAFF_RECOVERY_SUBJECT) return false;
    const current = await staffSessionVersion(session.subject);
    return typeof current !== "number";
  }
  const current = await staffSessionVersion(session.subject);
  if (current === "missing" || current === "down") return session.subject === STAFF_RECOVERY_SUBJECT;
  return current === session.version;
}

/**
 * Registration administration is owner-only.
 * The owner recovery session (`STAFF_RECOVERY_SUBJECT`) holds Super Admin / Admin / Staff capabilities.
 * School staff accounts and learn-portal reviewer emails must not open registration admin APIs.
 */
export function isRegistrationOwnerSubject(subject: string | null | undefined): boolean {
  return subject === STAFF_RECOVERY_SUBJECT;
}

export async function staffAuthorised(): Promise<boolean> {
  return sessionAllowed(await openedSession());
}

/** Same staff rule as `staffAuthorised`, using the cookie on this request. */
export async function staffRequestAuthorised(request: Request): Promise<boolean> {
  return sessionAllowed(openStaffSession(cookieValue(request, STAFF_COOKIE)));
}

/** Owner-only gate for school registration review APIs and dashboard data. */
export async function registrationOwnerAuthorised(): Promise<boolean> {
  const session = await openedSession();
  if (!(await sessionAllowed(session))) return false;
  return isRegistrationOwnerSubject(session?.subject);
}

/** Owner-only gate using the cookie on this request. */
export async function registrationOwnerRequestAuthorised(request: Request): Promise<boolean> {
  const session = openStaffSession(cookieValue(request, STAFF_COOKIE));
  if (!(await sessionAllowed(session))) return false;
  return isRegistrationOwnerSubject(session?.subject);
}

export async function staffSubject(): Promise<string | null> {
  if (!(await staffAuthorised())) return null;
  const session = await openedSession();
  return session?.subject ?? null;
}

/** Recovery token sessions are recorded as "recovery". Named accounts use their email. */
export async function staffIdentity(): Promise<string | null> {
  if (!(await staffAuthorised())) return null;
  const session = await openedSession();
  if (!session) return null;
  if (session.subject === STAFF_RECOVERY_SUBJECT) return STAFF_RECOVERY_SUBJECT;
  return (await staffEmail(session.subject)) ?? session.subject;
}
