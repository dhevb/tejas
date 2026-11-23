import { durableStorageConfigured, serverKeyValue, supabaseOrigin } from "@/lib/registration/durable";
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

export type UtrClaim =
  | { ok: true; reused: boolean; key: string; backend: "supabase" | "test" }
  | { ok: false; error: "duplicate" | "invalid" | "unavailable"; detail?: string };

export type UtrNote = {
  extractedUtr: string | null;
  reviewReason: string | null;
  proofExt: string;
  amountDue: number;
  paymentStatus: string;
  approvalMethod: string;
};

type UtrClaimBackend = {
  claim: (utr: string, category: UtrCategory, owner: string, key: string) => Promise<UtrClaim>;
  release: (key: string, owner: string) => Promise<void>;
  note: (key: string, owner: string, note: UtrNote) => Promise<void>;
};

/** Test-only injectable backend. Never used in Production/Vercel runtimes. */
let testBackend: UtrClaimBackend | null = null;

export function installUtrClaimTestBackend(backend: UtrClaimBackend | null): void {
  testBackend = backend;
}

/** In-memory atomic registry for unit tests only (not a Production uniqueness store). */
export function createMemoryUtrClaimBackend(): UtrClaimBackend {
  const rows = new Map<string, { category: UtrCategory; owner: string; utr: string; note?: UtrNote }>();
  return {
    async claim(utr, category, owner, key) {
      const existing = rows.get(key);
      if (existing) {
        if (existing.owner === owner) return { ok: true, reused: true, key, backend: "test" };
        return { ok: false, error: "duplicate" };
      }
      rows.set(key, { category, owner, utr: utr.trim() });
      return { ok: true, reused: false, key, backend: "test" };
    },
    async release(key, owner) {
      const existing = rows.get(key);
      if (existing?.owner === owner) rows.delete(key);
    },
    async note(key, owner, note) {
      const existing = rows.get(key);
      if (!existing || existing.owner !== owner) return;
      rows.set(key, { ...existing, note });
    },
  };
}

function isMissingRegistry(status: number, json: unknown): boolean {
  if (status === 404 || status === 406) return true;
  if (!json || typeof json !== "object") return false;
  const code = "code" in json ? String((json as { code?: unknown }).code ?? "") : "";
  const message = "message" in json ? String((json as { message?: unknown }).message ?? "") : "";
  if (code === "PGRST205" || code === "42P01") return true;
  if (/tejas_payment_utrs/i.test(message) && /not find|does not exist|schema cache/i.test(message)) return true;
  return false;
}

async function supabaseRequest(
  path: string,
  init: RequestInit,
): Promise<{ status: number; json: unknown }> {
  const origin = supabaseOrigin();
  const key = serverKeyValue();
  if (!origin || !key) return { status: 503, json: { message: "durable storage unavailable" } };
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("authorization", `Bearer ${key}`);
  headers.set("accept", "application/json");
  try {
    const response = await fetch(`${origin}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const text = await response.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        json = null;
      }
    }
    return { status: response.status, json };
  } catch {
    return { status: 503, json: { message: "database unreachable" } };
  }
}

function rows(json: unknown): Record<string, unknown>[] {
  if (!Array.isArray(json)) return [];
  return json.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

async function readRemoteClaim(key: string): Promise<{ owner: string } | null> {
  const result = await supabaseRequest(
    `/rest/v1/tejas_payment_utrs?utr_key=eq.${encodeURIComponent(key)}&select=owner_reference&limit=1`,
    { method: "GET" },
  );
  if (isMissingRegistry(result.status, result.json)) return null;
  if (result.status !== 200) return null;
  const owner = rows(result.json)[0]?.owner_reference;
  return typeof owner === "string" ? { owner } : null;
}

async function claimViaSupabase(utr: string, category: UtrCategory, owner: string, key: string): Promise<UtrClaim> {
  if (!durableStorageConfigured()) {
    return {
      ok: false,
      error: "unavailable",
      detail: "Durable Supabase storage is not configured; UTR uniqueness cannot be established.",
    };
  }

  const insert = await supabaseRequest("/rest/v1/tejas_payment_utrs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify({
      utr_key: key,
      utr_text: utr.trim(),
      category,
      owner_reference: owner,
    }),
  });

  if (insert.status === 200 || insert.status === 201) {
    return { ok: true, reused: false, key, backend: "supabase" };
  }
  if (isMissingRegistry(insert.status, insert.json)) {
    return {
      ok: false,
      error: "unavailable",
      detail: "UTR registry table is not available (migration not applied).",
    };
  }
  if (insert.status === 409) {
    const existing = await readRemoteClaim(key);
    if (existing?.owner === owner) return { ok: true, reused: true, key, backend: "supabase" };
    return { ok: false, error: "duplicate" };
  }
  if (insert.status >= 500 || insert.status === 503) {
    return { ok: false, error: "unavailable", detail: `UTR claim database error (${insert.status}).` };
  }
  return { ok: false, error: "unavailable", detail: `UTR claim rejected (${insert.status}).` };
}

async function releaseViaSupabase(key: string, owner: string): Promise<void> {
  if (!durableStorageConfigured()) return;
  const result = await supabaseRequest(
    `/rest/v1/tejas_payment_utrs?utr_key=eq.${encodeURIComponent(key)}&owner_reference=eq.${encodeURIComponent(owner)}`,
    { method: "DELETE", headers: { prefer: "return=minimal" } },
  );
  if (isMissingRegistry(result.status, result.json)) return;
}

async function noteViaSupabase(key: string, owner: string, note: UtrNote): Promise<void> {
  if (!durableStorageConfigured()) return;
  const result = await supabaseRequest(
    `/rest/v1/tejas_payment_utrs?utr_key=eq.${encodeURIComponent(key)}&owner_reference=eq.${encodeURIComponent(owner)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({
        extracted_utr: note.extractedUtr,
        review_reason: note.reviewReason,
        proof_ext: note.proofExt,
        amount_due: note.amountDue,
        payment_status: note.paymentStatus,
        approval_method: note.approvalMethod,
        reported_at: new Date().toISOString(),
      }),
    },
  );
  if (isMissingRegistry(result.status, result.json)) return;
}

/**
 * Atomically claim a UTR for one payment owner.
 * Production/Vercel path: Supabase `tejas_payment_utrs` primary-key insert.
 * Missing registry / DB errors → `{ error: "unavailable" }` (never throws for FS).
 * No application-filesystem or /tmp persistence.
 */
export async function claimUtr(utr: string, category: UtrCategory, owner: string): Promise<UtrClaim> {
  const key = utrKey(utr);
  if (!/^[A-Z0-9-]{6,40}$/.test(key)) return { ok: false, error: "invalid" };
  if (testBackend) return testBackend.claim(utr, category, owner, key);
  return claimViaSupabase(utr, category, owner, key);
}

export async function releaseUtr(utr: string, owner: string): Promise<void> {
  const key = utrKey(utr);
  if (!key) return;
  if (testBackend) {
    await testBackend.release(key, owner);
    return;
  }
  await releaseViaSupabase(key, owner);
}

export async function noteUtr(utr: string, owner: string, note: UtrNote): Promise<void> {
  const key = utrKey(utr);
  if (!key) return;
  if (testBackend) {
    await testBackend.note(key, owner, note);
    return;
  }
  await noteViaSupabase(key, owner, note);
}

export function utrRegistryUnavailableMessage(): string {
  return "UTR uniqueness could not be established (registry unavailable). The payment was not auto-approved.";
}
