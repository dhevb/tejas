import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { EBOOK_FEE } from "@/lib/registration/fee";
import { parseEmail, parseIndianMobile, validatePersonName } from "@/lib/registration/fields";
import { STREAMS, type StreamId } from "@/lib/registration/schema";
import { ebookReferenceIsValid, emailKey, newOrderCode, ordersRoot, payloadHash, readJson, removeFile, writeJson } from "@/lib/orders/files";
import { BOOK_CLASSES, classLabel, streamAllowed, streamLabel } from "@/lib/orders/catalogue";

export const EBOOK_COOKIE = "tejas_ebook";
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type EbookInput = {
  studentName: string;
  parentName: string;
  schoolName: string;
  classNumber: number;
  streams: StreamId[];
  email: string;
  mobile: string;
};

export type EbookAccount = EbookInput & {
  reference: string;
  feeAmount: number;
  status: "pending_payment" | "active";
  passwordHash: string | null;
  passwordSalt: string | null;
  createdAt: string;
  verifiedAt: string | null;
};

export type PublicEbook = Omit<EbookAccount, "passwordHash" | "passwordSalt"> & {
  paymentVerified: boolean;
  loginCreated: boolean;
  fileSupplied: false;
};

export type EbookErrors = Partial<Record<string, string>>;

function cleanLine(value: string, max: number): string {
  return value.normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function readField(source: FormData | Record<string, string>, key: string): string {
  if (source instanceof FormData) return String(source.get(key) ?? "");
  return source[key] ?? "";
}

export function toPublicEbook(account: EbookAccount): PublicEbook {
  return {
    reference: account.reference,
    studentName: account.studentName,
    parentName: account.parentName,
    schoolName: account.schoolName,
    classNumber: account.classNumber,
    streams: account.streams,
    email: account.email,
    mobile: account.mobile,
    feeAmount: account.feeAmount,
    status: account.status,
    createdAt: account.createdAt,
    verifiedAt: account.verifiedAt,
    paymentVerified: account.status === "active",
    loginCreated: account.status === "active" && Boolean(account.passwordHash),
    fileSupplied: false,
  };
}

export function readEbookRegistration(source: FormData | Record<string, string>): { value: EbookInput | null; errors: EbookErrors } {
  const errors: EbookErrors = {};
  const student = validatePersonName(cleanLine(readField(source, "studentName"), 120), "Student's name");
  const parent = validatePersonName(cleanLine(readField(source, "parentName"), 120), "Parent's name");
  const schoolName = cleanLine(readField(source, "schoolName"), 200);
  const classNumber = Number(readField(source, "classNumber").trim());
  const email = parseEmail(readField(source, "email"));
  const mobile = parseIndianMobile(readField(source, "mobile"));
  if (!student.ok) errors.studentName = student.message;
  if (!parent.ok) errors.parentName = parent.message;
  if (schoolName.length < 3 || !/\p{L}/u.test(schoolName)) errors.schoolName = "Enter the school name.";
  if (!BOOK_CLASSES.includes(classNumber as (typeof BOOK_CLASSES)[number])) errors.classNumber = "Select a class from III to X.";
  if (!email) errors.email = "Enter the email address for this login.";
  if (!mobile) errors.mobile = "Enter a 10-digit mobile number.";
  const streams: StreamId[] = [];
  for (const stream of STREAMS) {
    const raw = readField(source, `stream_${stream.id}`).trim().toLowerCase();
    if (raw !== "yes" && raw !== "on" && raw !== "true") continue;
    if (!Number.isInteger(classNumber) || !streamAllowed(stream.id, classNumber)) {
      errors[`stream_${stream.id}`] = `${streamLabel(stream.id)} is not available for ${Number.isInteger(classNumber) ? classLabel(classNumber) : "this class"}.`;
      continue;
    }
    streams.push(stream.id);
  }
  if (!streams.length && !Object.keys(errors).some((key) => key.startsWith("stream_"))) {
    errors.streams = "Select at least one stream for this class.";
  }
  if (Object.keys(errors).length || !student.ok || !parent.ok || !email || !mobile) return { value: null, errors };
  return {
    value: {
      studentName: student.value,
      parentName: parent.value,
      schoolName,
      classNumber,
      streams,
      email,
      mobile,
    },
    errors,
  };
}

function accountFile(reference: string): string {
  return path.join(ordersRoot(), "ebooks", "accounts", `${reference}.json`);
}

function idemFile(key: string): string {
  return path.join(ordersRoot(), "ebooks", "idem", `${key}.json`);
}

function emailFile(email: string): string {
  return path.join(ordersRoot(), "ebooks", "email", `${emailKey(email)}.json`);
}

function onceFile(reference: string): string {
  return path.join(ordersRoot(), "ebooks", "once", `${reference}.json`);
}

type IdempotentRecord = { hash: string; reference: string };
type EmailIndex = { reference: string };
type OnceCredential = { password: string };

function sameRegistration(account: EbookAccount, input: EbookInput): boolean {
  return account.studentName === input.studentName
    && account.parentName === input.parentName
    && account.schoolName === input.schoolName
    && account.classNumber === input.classNumber
    && account.mobile === input.mobile
    && account.email === input.email
    && account.streams.join(",") === input.streams.join(",");
}

export async function readEbookAccount(reference: string): Promise<EbookAccount | null> {
  if (!ebookReferenceIsValid(reference)) return null;
  return readJson<EbookAccount>(accountFile(reference));
}

export async function saveEbookRegistration(input: EbookInput, idempotencyKey: string): Promise<{ account: EbookAccount; created: boolean } | { conflict: true } | { duplicateEmail: true }> {
  const hash = payloadHash(input);
  const prior = await readJson<IdempotentRecord>(idemFile(idempotencyKey));
  if (prior) {
    if (prior.hash !== hash) return { conflict: true };
    const existing = await readEbookAccount(prior.reference);
    if (existing) return { account: existing, created: false };
  }
  const indexed = await readJson<EmailIndex>(emailFile(input.email));
  if (indexed) {
    const existing = await readEbookAccount(indexed.reference);
    if (existing && sameRegistration(existing, input)) return { account: existing, created: false };
    return { duplicateEmail: true };
  }
  const account: EbookAccount = {
    ...input,
    reference: newOrderCode("TEJAS-EBOOK"),
    feeAmount: EBOOK_FEE,
    status: "pending_payment",
    passwordHash: null,
    passwordSalt: null,
    createdAt: new Date().toISOString(),
    verifiedAt: null,
  };
  await writeJson(accountFile(account.reference), account);
  await writeJson(emailFile(account.email), { reference: account.reference });
  await writeJson(idemFile(idempotencyKey), { hash, reference: account.reference });
  return { account, created: true };
}

function newPassword(): string {
  let out = "";
  while (out.length < 12) {
    const bytes = randomBytes(16);
    for (const byte of bytes) {
      if (byte >= 256 - (256 % PASSWORD_ALPHABET.length)) continue;
      out += PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length];
      if (out.length === 12) break;
    }
  }
  return out;
}

function hashPassword(password: string, salt: Buffer): string {
  return scryptSync(password, salt, 32).toString("base64url");
}

export async function verifyEbookPayment(reference: string): Promise<{ ok: true; account: EbookAccount; password: string | null; alreadyActive: boolean } | { ok: false; message: string }> {
  const account = await readEbookAccount(reference);
  if (!account) return { ok: false, message: "No e-book registration uses that reference." };
  if (account.status === "active") return { ok: true, account, password: null, alreadyActive: true };
  const password = newPassword();
  const salt = randomBytes(16);
  account.passwordHash = hashPassword(password, salt);
  account.passwordSalt = salt.toString("base64url");
  account.status = "active";
  account.verifiedAt = new Date().toISOString();
  await writeJson(accountFile(account.reference), account);
  await writeJson(onceFile(account.reference), { password });
  return { ok: true, account, password, alreadyActive: false };
}

export async function collectEbookCredential(reference: string, email: string, mobile: string): Promise<{ ok: true; password: string; email: string } | { ok: false; message: string }> {
  const account = await readEbookAccount(reference);
  if (!account) return { ok: false, message: "No e-book registration uses that reference." };
  const parsedEmail = parseEmail(email);
  const parsedMobile = parseIndianMobile(mobile);
  if (!parsedEmail || parsedEmail !== account.email || !parsedMobile || parsedMobile !== account.mobile) {
    return { ok: false, message: "Those details do not match this e-book registration." };
  }
  if (account.status !== "active") return { ok: false, message: "Payment has not been verified. No login has been created." };
  const once = await readJson<OnceCredential>(onceFile(reference));
  if (!once?.password) return { ok: false, message: "The password was already shown. It cannot be shown again. Write to tejas@dhe.org.in." };
  await removeFile(onceFile(reference));
  return { ok: true, password: once.password, email: account.email };
}

export function passwordMatches(account: EbookAccount, password: string): boolean {
  if (!account.passwordHash || !account.passwordSalt || account.status !== "active") return false;
  const salt = Buffer.from(account.passwordSalt, "base64url");
  const actual = Buffer.from(hashPassword(password, salt));
  const expected = Buffer.from(account.passwordHash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function findEbookByEmail(email: string): Promise<EbookAccount | null> {
  const parsed = parseEmail(email);
  if (!parsed) return null;
  const indexed = await readJson<EmailIndex>(emailFile(parsed));
  if (!indexed) return null;
  return readEbookAccount(indexed.reference);
}

export function ebookSecret(): string | null {
  const dedicated = process.env.TEJAS_EBOOK_SECRET ?? "";
  if (dedicated.length >= 16) return dedicated;
  const admin = process.env.TEJAS_ADMIN_TOKEN ?? "";
  if (admin.length >= 16) return admin;
  return null;
}

export function createEbookSession(reference: string): string | null {
  const secret = ebookSecret();
  if (!secret) return null;
  const exp = Date.now() + 8 * 60 * 60 * 1000;
  const payload = `v1.${exp}.${reference}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function ebookSessionReference(cookieValue: string | undefined): string | null {
  const secret = ebookSecret();
  if (!secret || !cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 4) return null;
  const [version, exp, reference, sig] = parts;
  if (version !== "v1" || !/^\d+$/.test(exp) || !ebookReferenceIsValid(reference)) return null;
  const payload = `${version}.${exp}.${reference}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) <= Date.now()) return null;
  return reference;
}

export function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export type ReadDecision =
  | { status: 401; body: { ok: false; message: string } }
  | { status: 403; body: { ok: false; message: string } }
  | { status: 404; body: { ok: false; readable: false; download: false; message: string; stream: StreamId; classNumber: number } };

export async function authoriseEbookRead(cookieHeader: string | null, streamRaw: string): Promise<ReadDecision> {
  const reference = ebookSessionReference(cookieValue(cookieHeader, EBOOK_COOKIE));
  if (!reference) return { status: 401, body: { ok: false, message: "Sign in on the e-book login page." } };
  const account = await readEbookAccount(reference);
  if (!account || account.status !== "active") return { status: 401, body: { ok: false, message: "Sign in on the e-book login page." } };
  const stream = STREAMS.find((item) => item.id === streamRaw)?.id;
  if (!stream || !account.streams.includes(stream) || !streamAllowed(stream, account.classNumber)) {
    return { status: 403, body: { ok: false, message: "This login is not authorised for that book." } };
  }
  return {
    status: 404,
    body: {
      ok: false,
      readable: false,
      download: false,
      stream,
      classNumber: account.classNumber,
      message: `The e-book file for ${streamLabel(stream)}, ${classLabel(account.classNumber)}, has not been supplied. Reading cannot start, and this response is not a file.`,
    },
  };
}
