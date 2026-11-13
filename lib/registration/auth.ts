import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const STAFF_COOKIE = "tejas_staff";
const SESSION_MS = 8 * 60 * 60 * 1000;

/** Recovery sessions use this subject. It is a role, not a person's name. */
export const STAFF_RECOVERY_SUBJECT = "recovery";

export function adminSecret(): string {
  return (process.env.TEJAS_ADMIN_TOKEN ?? "").trim();
}

export function adminConfigured(): boolean {
  return adminSecret().length >= 16;
}

export function tokenMatches(input: string): boolean {
  if (!adminConfigured()) return false;
  const expected = createHash("sha256").update(adminSecret()).digest();
  const given = createHash("sha256").update(input.trim()).digest();
  return timingSafeEqual(expected, given);
}

export type StaffSession = { subject: string; version: number };

function sign(payload: string): string {
  return createHmac("sha256", adminSecret()).update(payload).digest("base64url");
}

function signatureMatches(payload: string, sig: string): boolean {
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Recovery-token login. Version 0 is accepted when the staff session table is not reachable. */
export function createSessionValue(subject = STAFF_RECOVERY_SUBJECT, version = 0): string {
  if (!adminConfigured()) throw new Error("Staff review is not configured.");
  if (!/^[A-Za-z0-9-]{1,80}$/.test(subject) || !Number.isInteger(version) || version < 0) {
    throw new Error("Staff session is invalid.");
  }
  const exp = Date.now() + SESSION_MS;
  const payload = `v2.${subject}.${version}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function openStaffSession(value: string | undefined): StaffSession | null {
  if (!adminConfigured() || !value) return null;
  const parts = value.split(".");
  if (parts.length === 3) {
    const [version, exp, sig] = parts;
    if (version !== "v1" || !/^\d+$/.test(exp)) return null;
    const payload = `${version}.${exp}`;
    if (!signatureMatches(payload, sig) || Number(exp) <= Date.now()) return null;
    return { subject: STAFF_RECOVERY_SUBJECT, version: 0 };
  }
  if (parts.length !== 5) return null;
  const [marker, subject, sessionVersion, exp, sig] = parts;
  if (marker !== "v2" || !/^[A-Za-z0-9-]{1,80}$/.test(subject) || !/^\d+$/.test(sessionVersion) || !/^\d+$/.test(exp)) return null;
  const payload = `${marker}.${subject}.${sessionVersion}.${exp}`;
  if (!signatureMatches(payload, sig) || Number(exp) <= Date.now()) return null;
  return { subject, version: Number(sessionVersion) };
}

export function sessionIsValid(value: string | undefined): boolean {
  return openStaffSession(value) !== null;
}

export function staffCookieHeader(value: string): string {
  const parts = [`${STAFF_COOKIE}=${value}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${SESSION_MS / 1000}`];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function clearStaffCookieHeader(): string {
  const parts = [`${STAFF_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}
