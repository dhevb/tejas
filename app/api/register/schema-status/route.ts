import { clientKey, noStore, rateLimit } from "@/lib/registration/http";
import { staffRequestAuthorised } from "@/lib/registration/staff";
import { inspectSupabase } from "@/lib/registration/supabase-inspect";

/** Staff diagnostic only. The handler does not accept a query and does not change the database. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await staffRequestAuthorised(request))) {
    return noStore({ ok: false, error: "Staff sign-in is required." }, 401);
  }
  if (!rateLimit(`schema-status:${clientKey(request)}`, 8, 10 * 60 * 1000)) {
    return noStore({ ok: false, reason: "busy" }, 429);
  }
  return noStore(await inspectSupabase());
}
