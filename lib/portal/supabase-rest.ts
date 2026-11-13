import { durableStorageConfigured, serverKeyValue, supabaseOrigin } from "@/lib/registration/durable";

export class PortalUnavailable extends Error {
  constructor(message = "The student portal database is not available.") {
    super(message);
    this.name = "PortalUnavailable";
  }
}

export function supabaseConfigured(): boolean {
  return durableStorageConfigured();
}

export async function supabaseRest(path: string, init: RequestInit = {}): Promise<{ status: number; json: unknown }> {
  const origin = supabaseOrigin();
  const key = serverKeyValue();
  if (!origin || !key) throw new PortalUnavailable();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("authorization", `Bearer ${key}`);
  headers.set("accept", "application/json");
  let response: Response;
  try {
    response = await fetch(`${origin}${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(20000) });
  } catch {
    throw new PortalUnavailable();
  }
  const text = await response.text();
  if (!text) return { status: response.status, json: null };
  try {
    return { status: response.status, json: JSON.parse(text) as unknown };
  } catch {
    return { status: response.status, json: null };
  }
}

export function schemaMissing(status: number, json: unknown): boolean {
  if (status !== 404) return false;
  return Boolean(json && typeof json === "object" && "code" in json && (json as { code?: string }).code === "PGRST205");
}
