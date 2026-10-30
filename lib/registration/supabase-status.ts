import { serverKeyName, serverKeyValue, supabaseOrigin, type ServerKeyName } from "@/lib/registration/durable";

export type ConnectionReason = "ok" | "missing_url" | "missing_server_key" | "rejected" | "not_server_key" | "unreachable" | "unexpected";

export type ConnectionStatus = {
  connected: boolean;
  reason: ConnectionReason;
  keyName: ServerKeyName | null;
  keyFormat: "secret" | "jwt" | "other" | null;
};

function keyFormat(key: string): ConnectionStatus["keyFormat"] {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.split(".").length === 3) return "jwt";
  return "other";
}

function authHeaders(key: string): Headers {
  const headers = new Headers();
  headers.set("apikey", key);
  headers.set("accept", "application/json");
  if (key.split(".").length === 3) headers.set("authorization", `Bearer ${key}`);
  return headers;
}

async function statusOnly(url: string, init: RequestInit): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    await response.body?.cancel();
    return response.status;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Confirms the server key can reach Supabase. The response never includes secrets or response bodies. */
export async function testSupabaseConnection(): Promise<ConnectionStatus> {
  const origin = supabaseOrigin();
  const keyName = serverKeyName();
  const key = serverKeyValue();
  if (!origin) return { connected: false, reason: "missing_url", keyName: null, keyFormat: null };
  if (!key || !keyName) return { connected: false, reason: "missing_server_key", keyName: null, keyFormat: null };
  const format = keyFormat(key);
  const health = await statusOnly(`${origin}/auth/v1/health`, { method: "GET" });
  if (health === null) return { connected: false, reason: "unreachable", keyName, keyFormat: format };
  const accepted = await statusOnly(`${origin}/rest/v1/`, { method: "GET", headers: authHeaders(key) });
  if (accepted === null) return { connected: false, reason: "unreachable", keyName, keyFormat: format };
  if (accepted === 401 || accepted === 403) return { connected: false, reason: "rejected", keyName, keyFormat: format };
  if (accepted !== 200) return { connected: false, reason: "unexpected", keyName, keyFormat: format };
  const elevated = await statusOnly(`${origin}/auth/v1/admin/users?per_page=1`, { method: "GET", headers: authHeaders(key) });
  if (elevated === null) return { connected: false, reason: "unreachable", keyName, keyFormat: format };
  if (elevated === 200) return { connected: true, reason: "ok", keyName, keyFormat: format };
  if (elevated === 401 || elevated === 403) return { connected: false, reason: "not_server_key", keyName, keyFormat: format };
  return { connected: false, reason: "unexpected", keyName, keyFormat: format };
}
