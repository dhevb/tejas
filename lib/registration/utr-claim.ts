import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { configured as remoteConfigured, insertUtrClaim, noteUtrClaim, readUtrClaim, releaseUtrClaim } from "@/lib/registration/database";
import { dataDir } from "@/lib/registration/paths";
import type { PaymentCategory } from "@/lib/registration/payment-decision";

export type UtrCategory = PaymentCategory;

/**
 * Compare UTRs without treating letter case or whitespace as a different payment.
 * The original text is stored unchanged. Only the uniqueness key is normalized.
 */
export function utrKey(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function utrOwner(category: UtrCategory, reference: string): string {
  return `${category}:${reference}`;
}

type ClaimFile = {
  utr: string;
  key: string;
  category: UtrCategory;
  owner: string;
  extractedUtr?: string | null;
  bankResult?: string | null;
  reviewReason?: string | null;
  proofExt?: string | null;
  amountDue?: number | null;
  paymentStatus?: string | null;
  reportedAt?: string | null;
};

export type UtrClaim =
  | { ok: true; reused: boolean; key: string }
  | { ok: false; error: "duplicate" | "invalid" | "unavailable" };

function claimPath(key: string): string {
  return path.join(dataDir(), "utr-claims", `${key}.json`);
}

async function readClaimFile(key: string): Promise<ClaimFile | null> {
  try {
    return JSON.parse(await readFile(claimPath(key), "utf8")) as ClaimFile;
  } catch {
    return null;
  }
}

async function claimFile(utr: string, key: string, category: UtrCategory, owner: string): Promise<UtrClaim> {
  const dir = path.join(dataDir(), "utr-claims");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const file = claimPath(key);
  const body: ClaimFile = { utr, key, category, owner };
  try {
    const handle = await open(file, "wx", 0o600);
    await handle.writeFile(JSON.stringify(body));
    await handle.close();
    return { ok: true, reused: false, key };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code !== "EEXIST") throw error;
    const existing = await readClaimFile(key);
    if (existing?.owner === owner) return { ok: true, reused: true, key };
    return { ok: false, error: "duplicate" };
  }
}

/**
 * Claim a UTR for one payment owner.
 * The hosted path inserts into tejas_payment_utrs. The primary key makes the insert atomic:
 * exactly one concurrent caller can create the row. A failed payment releases only its own row.
 * When that table is not present yet, school registration and e-book payments still have their
 * existing unique constraints. New individual and book proofs fail closed instead of skipping the check.
 */
export async function claimUtr(utr: string, category: UtrCategory, owner: string): Promise<UtrClaim> {
  const key = utrKey(utr);
  if (!/^[A-Z0-9-]{6,40}$/.test(key)) return { ok: false, error: "invalid" };
  if (!remoteConfigured()) return claimFile(utr.trim(), key, category, owner);
  const inserted = await insertUtrClaim({ utr_key: key, utr_text: utr.trim(), category, owner_reference: owner });
  if (inserted === "claimed") return { ok: true, reused: false, key };
  if (inserted === "conflict") {
    const existing = await readUtrClaim(key);
    if (existing && existing !== "missing" && existing.owner_reference === owner) return { ok: true, reused: true, key };
    return { ok: false, error: "duplicate" };
  }
  if (inserted === "missing") return { ok: false, error: "unavailable" };
  return { ok: false, error: "unavailable" };
}

export async function releaseUtr(utr: string, owner: string): Promise<void> {
  const key = utrKey(utr);
  if (!key) return;
  if (remoteConfigured()) {
    await releaseUtrClaim(key, owner);
    return;
  }
  const existing = await readClaimFile(key);
  if (existing?.owner !== owner) return;
  await rm(claimPath(key), { force: true });
}

export async function noteUtr(utr: string, owner: string, note: { extractedUtr: string | null; bankResult: string; reviewReason: string | null; proofExt: string; amountDue: number; paymentStatus: string }): Promise<void> {
  const key = utrKey(utr);
  const reportedAt = new Date().toISOString();
  if (remoteConfigured()) {
    await noteUtrClaim(key, owner, {
      extracted_utr: note.extractedUtr,
      bank_result: note.bankResult,
      review_reason: note.reviewReason,
      proof_ext: note.proofExt,
      amount_due: note.amountDue,
      payment_status: note.paymentStatus,
      reported_at: reportedAt,
    });
    return;
  }
  const existing = await readClaimFile(key);
  if (existing?.owner !== owner) return;
  const next: ClaimFile = { ...existing, extractedUtr: note.extractedUtr, bankResult: note.bankResult, reviewReason: note.reviewReason, proofExt: note.proofExt, amountDue: note.amountDue, paymentStatus: note.paymentStatus, reportedAt };
  await writeFile(claimPath(key), JSON.stringify(next), { mode: 0o600 });
}

export async function readLocalUtr(utr: string): Promise<ClaimFile | null> {
  return readClaimFile(utrKey(utr));
}
