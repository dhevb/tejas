import { clientKey, noStore, rateLimit } from "@/lib/registration/http";
import { testSupabaseConnection } from "@/lib/registration/supabase-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!rateLimit(`storage-status:${clientKey(request)}`, 12, 10 * 60 * 1000)) {
    return noStore({ connected: false, reason: "busy" }, 429);
  }
  const status = await testSupabaseConnection();
  return noStore({
    connected: status.connected,
    reason: status.reason,
    keyName: status.keyName,
    keyFormat: status.keyFormat,
  });
}
