import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataDir } from "@/lib/registration/paths";
import { openBytes, sealBytes } from "@/lib/registration/seal";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function ordersRoot(): string {
  return path.join(dataDir(), "separate-orders");
}

export function newOrderCode(prefix: "TEJAS-BOOK" | "TEJAS-EBOOK"): string {
  let out = "";
  while (out.length < 20) {
    const bytes = randomBytes(32);
    for (const byte of bytes) {
      if (byte >= 256 - (256 % ALPHABET.length)) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === 20) break;
    }
  }
  return `${prefix}-${out}`;
}

export function bookReferenceIsValid(value: string): boolean {
  return /^TEJAS-BOOK-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{20}$/.test(value);
}

export function ebookReferenceIsValid(value: string): boolean {
  return /^TEJAS-EBOOK-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{20}$/.test(value);
}

export function payloadHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const body = sealBytes(Buffer.from(JSON.stringify(value)));
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, body);
  await rename(tmp, file);
}

export async function readJson<T>(file: string): Promise<T | null> {
  try {
    const buf = await readFile(file);
    return JSON.parse(openBytes(buf).toString("utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function removeFile(file: string): Promise<void> {
  await rm(file, { force: true });
}

export function emailKey(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}
