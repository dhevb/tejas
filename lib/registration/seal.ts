import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const MAGIC = Buffer.from("TJENC1");

export function dataKey(): Buffer | null {
  const hex = process.env.TEJAS_DATA_KEY ?? "";
  if (!hex) return null;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) throw new Error("TEJAS_DATA_KEY must be 64 hex characters.");
  return Buffer.from(hex, "hex");
}

export function sealBytes(plain: Buffer): Buffer {
  const key = dataKey();
  if (!key) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, iv, tag, enc]);
}

export function openBytes(buf: Buffer): Buffer {
  const key = dataKey();
  const encrypted = buf.length > 6 && buf.subarray(0, 6).equals(MAGIC);
  if (!key) {
    if (encrypted) throw new Error("Registration file is encrypted and TEJAS_DATA_KEY is not set.");
    return buf;
  }
  if (!encrypted) return buf;
  const iv = buf.subarray(6, 18);
  const tag = buf.subarray(18, 34);
  const enc = buf.subarray(34);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}
