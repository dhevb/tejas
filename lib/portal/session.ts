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

async function secret(): Promise<string> {
  const fromEnv = process.env.TEJAS_PORTAL_SECRET ?? "";
  if (fromEnv.length >= 16) return fromEnv;
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

export async function sealSession(studentId: string): Promise<string> {
  const exp = Date.now() + SESSION_MS;
  const payload = `v1.${studentId}.${exp}`;
  const sig = createHmac("sha256", await secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function openSession(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [version, studentId, exp, sig] = parts;
  if (version !== "v1" || !/^[0-9a-f-]{36}$/i.test(studentId) || !/^\d+$/.test(exp)) return null;
  const payload = `${version}.${studentId}.${exp}`;
  const expected = createHmac("sha256", await secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) <= Date.now()) return null;
  return studentId;
}

export function passwordIsAcceptable(password: string): boolean {
  return password.length >= 8 && password.length <= 72 && !/^\s|\s$/.test(password);
}
