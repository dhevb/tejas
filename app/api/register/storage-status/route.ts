import { clientKey, noStore, rateLimit } from "@/lib/registration/http";
import { probeNamedServerKey, testSupabaseConnection } from "@/lib/registration/supabase-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!rateLimit(`storage-status:${clientKey(request)}`, 12, 10 * 60 * 1000)) {
    return noStore({ connected: false, reason: "busy" }, 429);
  }
  const status = await testSupabaseConnection();
  const present = (name: string) => (process.env[name] ?? "").trim().length >= 20;
  return noStore({
    connected: status.connected,
    reason: status.reason,
    keyName: status.keyName,
    keyFormat: status.keyFormat,
    urlPresent: (process.env.SUPABASE_URL ?? "").trim().length > 0,
    serviceRoleKeyPresent: present("SUPABASE_SERVICE_ROLE_KEY"),
    secretKeyPresent: present("SUPABASE_SECRET_KEY"),
    secretKey: await probeNamedServerKey("SUPABASE_SECRET_KEY"),
  });
}
