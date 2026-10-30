import { clientKey, noStore, rateLimit } from "@/lib/registration/http";
import { inspectSupabase } from "@/lib/registration/supabase-inspect";

/** Structural check only. The handler does not accept a query and does not change the database. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!rateLimit(`schema-status:${clientKey(request)}`, 8, 10 * 60 * 1000)) {
    return noStore({ ok: false, reason: "busy" }, 429);
  }
  return noStore(await inspectSupabase());
}
