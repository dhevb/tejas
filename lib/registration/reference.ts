import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newReference(): string {
  let out = "";
  while (out.length < 20) {
    const bytes = randomBytes(32);
    for (const byte of bytes) {
      if (byte >= 256 - (256 % ALPHABET.length)) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === 20) break;
    }
  }
  return `TEJAS-2026-${out}`;
}

export function referenceIsValid(value: string): boolean {
  return /^TEJAS-2026-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{20}$/.test(value);
}
