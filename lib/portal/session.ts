import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { portalDataDir } from "@/lib/portal/paths";

export const LEARN_COOKIE = "tejas_learn";
const SESSION_MS = 12 * 60 * 60 * 1000;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): { hash: string; salt: string } {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return { hash, salt };
}

export function passwordMatches(password: string, salt: string, expectedHex: string): boolean {
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(expectedHex, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

const SESSION_LABEL = "tejas-learn-session-v1";

/** A dedicated portal secret wins. Otherwise a key is derived from the staff token so every server shares it. */
export function sessionKey(): string | null {
  const dedicated = (process.env.TEJAS_PORTAL_SECRET ?? "").trim();
  if (dedicated.length >= 16) return dedicated;
  const staff = (process.env.TEJAS_ADMIN_TOKEN ?? "").trim();
  if (staff.length >= 16) return createHmac("sha256", staff).update(SESSION_LABEL).digest("hex");
  return null;
}

async function secret(): Promise<string> {
  const configured = sessionKey();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    throw new Error("Student session secret is not configured.");
  }
  const file = path.join(portalDataDir(), "session-secret");
  try {
    const stored = (await readFile(file, "utf8")).trim();
    if (stored.length >= 16) return stored;
  } catch {
    // Create a local secret for this data directory. It is not a production credential.
  }
  const created = randomBytes(32).toString("hex");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, created, { mode: 0o600 });
  return created;
}

export type OpenSession = { studentId: string; sessionVersion: number };

/** The signed cookie names one account and one session generation. A newer sign-in replaces that generation. */
export async function sealSession(studentId: string, sessionVersion: number, expiresAt = Date.now() + SESSION_MS): Promise<string> {
  if (!Number.isInteger(sessionVersion) || sessionVersion < 1) throw new Error("Session generation is invalid.");
  const payload = `v2.${studentId}.${sessionVersion}.${expiresAt}`;
  const sig = createHmac("sha256", await secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function openSession(value: string | undefined): Promise<OpenSession | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 5) return null;
  const [version, studentId, sessionVersion, exp, sig] = parts;
  if (version !== "v2" || !/^[0-9a-f-]{36}$/i.test(studentId) || !/^\d+$/.test(sessionVersion) || !/^\d+$/.test(exp)) return null;
  const payload = `${version}.${studentId}.${sessionVersion}.${exp}`;
  const expected = createHmac("sha256", await secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) <= Date.now()) return null;
  return { studentId, sessionVersion: Number(sessionVersion) };
}

export function passwordIsAcceptable(password: string): boolean {
  return password.length >= 8 && password.length <= 72 && !/^\s|\s$/.test(password);
}
