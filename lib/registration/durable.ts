/** Server-side key selection. Never log or return the key value. */
const SERVER_KEY_NAMES = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"] as const;

export type ServerKeyName = (typeof SERVER_KEY_NAMES)[number];

export function supabaseOrigin(): string | null {
  const raw = (process.env.SUPABASE_URL ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function serverKeyName(): ServerKeyName | null {
  for (const name of SERVER_KEY_NAMES) {
    const value = (process.env[name] ?? "").trim();
    if (value.length >= 20) return name;
  }
  return null;
}

export function serverKeyValue(): string | null {
  const name = serverKeyName();
  if (!name) return null;
  const value = (process.env[name] ?? "").trim();
  return value.length >= 20 ? value : null;
}

/** True when a URL and a server key are present. */
export function durableStorageConfigured(): boolean {
  return supabaseOrigin() !== null && serverKeyName() !== null;
}

/**
 * Proof upload uses the private tejas-payment-proofs bucket through the server.
 * It opens when that server connection exists. A file upload does not verify payment.
 */
export function paymentProofsAccepted(): boolean {
  return durableStorageConfigured();
}
