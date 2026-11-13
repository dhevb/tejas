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

export async function staffAuthorised(): Promise<boolean> {
  const session = await openedSession();
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
