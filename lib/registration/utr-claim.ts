import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
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
  reviewReason?: string | null;
  proofExt?: string | null;
  amountDue?: number | null;
  paymentStatus?: string | null;
  approvalMethod?: string | null;
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

/**
 * Atomically claim a UTR for one payment owner using O_EXCL create.
 * Concurrent callers racing on the same key: exactly one wins; others get duplicate.
 */
export async function claimUtr(utr: string, category: UtrCategory, owner: string): Promise<UtrClaim> {
  const key = utrKey(utr);
  if (!/^[A-Z0-9-]{6,40}$/.test(key)) return { ok: false, error: "invalid" };
  const dir = path.join(dataDir(), "utr-claims");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const file = claimPath(key);
  const body: ClaimFile = { utr: utr.trim(), key, category, owner };
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

export async function releaseUtr(utr: string, owner: string): Promise<void> {
  const key = utrKey(utr);
  if (!key) return;
  const existing = await readClaimFile(key);
  if (existing?.owner !== owner) return;
  await rm(claimPath(key), { force: true });
}

export async function noteUtr(
  utr: string,
  owner: string,
  note: {
    extractedUtr: string | null;
    reviewReason: string | null;
    proofExt: string;
    amountDue: number;
    paymentStatus: string;
    approvalMethod: string;
  },
): Promise<void> {
  const key = utrKey(utr);
  const existing = await readClaimFile(key);
  if (existing?.owner !== owner) return;
  const next: ClaimFile = {
    ...existing,
    extractedUtr: note.extractedUtr,
    reviewReason: note.reviewReason,
    proofExt: note.proofExt,
    amountDue: note.amountDue,
    paymentStatus: note.paymentStatus,
    approvalMethod: note.approvalMethod,
    reportedAt: new Date().toISOString(),
  };
  await writeFile(claimPath(key), JSON.stringify(next), { mode: 0o600 });
}

export async function readLocalUtr(utr: string): Promise<ClaimFile | null> {
  return readClaimFile(utrKey(utr));
}

export async function utrClaimedByOther(utr: string, owner: string): Promise<boolean> {
  const existing = await readClaimFile(utrKey(utr));
  if (!existing) return false;
  return existing.owner !== owner;
}
