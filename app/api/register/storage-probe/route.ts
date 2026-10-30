import { clientKey, noStore, rateLimit } from "@/lib/registration/http";
import { runStorageProbe } from "@/lib/registration/storage-probe";

/** Temporary authorised-access check. It writes one labelled probe row and deletes it before returning. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!rateLimit(`storage-probe:${clientKey(request)}`, 2, 30 * 60 * 1000)) {
    return noStore({ ok: false, reason: "busy" }, 429);
  }
  return noStore(await runStorageProbe());
}
