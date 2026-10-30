/** Server-side check only. Never log the key. */
export function durableStorageConfigured(): boolean {
  const url = (process.env.SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) && key.length >= 20;
}

/**
 * Proof upload opens only after durable storage is configured and an operator
 * has turned on TEJAS_ACCEPT_PAYMENT_PROOF following a tested migration.
 */
export function paymentProofsAccepted(): boolean {
  return process.env.TEJAS_ACCEPT_PAYMENT_PROOF === "true" && durableStorageConfigured();
}
