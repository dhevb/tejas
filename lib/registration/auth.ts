import { createHmac, timingSafeEqual } from "node:crypto";

export const STAFF_COOKIE = "tejas_staff";

export function adminConfigured(): boolean {
  const token = process.env.TEJAS_ADMIN_TOKEN ?? "";
  return token.length >= 16;
}

export function tokenMatches(input: string): boolean {
  if (!adminConfigured()) return false;
  const expected = Buffer.from(process.env.TEJAS_ADMIN_TOKEN ?? "");
  const given = Buffer.from(input);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function createSessionValue(): string {
  if (!adminConfigured()) throw new Error("Staff review is not configured.");
  const exp = Date.now() + 8 * 60 * 60 * 1000;
  const payload = `v1.${exp}`;
  const sig = createHmac("sha256", process.env.TEJAS_ADMIN_TOKEN ?? "").update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function sessionIsValid(value: string | undefined): boolean {
  if (!adminConfigured() || !value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [version, exp, sig] = parts;
  if (version !== "v1" || !/^\d+$/.test(exp)) return false;
  const payload = `${version}.${exp}`;
  const expected = createHmac("sha256", process.env.TEJAS_ADMIN_TOKEN ?? "").update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(exp) > Date.now();
}
