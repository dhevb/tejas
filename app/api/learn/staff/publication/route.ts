import { staffAuthorised } from "@/lib/registration/staff";
import { noStore, sameOrigin } from "@/lib/registration/http";
import { setPublication } from "@/lib/portal/store";
import type { PublicationStatus } from "@/lib/portal/model";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  if (!(await staffAuthorised())) return noStore({ ok: false, error: "Staff sign-in is required." }, 401);
  const body = (await request.json().catch(() => null)) as { kind?: "book" | "test"; id?: string; status?: PublicationStatus; reason?: string } | null;
  if (!body || (body.kind !== "book" && body.kind !== "test") || !body.id || (body.status !== "published" && body.status !== "awaiting_approval")) {
    return noStore({ ok: false, error: "The publication request could not be read." }, 400);
  }
  const result = await setPublication({ actor: "staff", kind: body.kind, id: body.id, status: body.status, reason: body.reason ?? "" });
  return noStore(result, result.ok ? 200 : 400);
}
