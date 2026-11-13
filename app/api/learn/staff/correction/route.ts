import { staffAuthorised } from "@/lib/registration/staff";
import { noStore, sameOrigin } from "@/lib/registration/http";
import { correctRegistration } from "@/lib/portal/store";
import type { StreamId } from "@/lib/registration/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  if (!(await staffAuthorised())) return noStore({ ok: false, error: "Staff sign-in is required." }, 401);
  const body = (await request.json().catch(() => null)) as { studentId?: string; streamId?: StreamId; classLevel?: number; reason?: string } | null;
  if (!body?.studentId || !body.reason) return noStore({ ok: false, error: "The correction could not be read." }, 400);
  const result = await correctRegistration({
    actor: "staff",
    studentId: body.studentId,
    streamId: body.streamId,
    classLevel: body.classLevel,
    reason: body.reason,
  });
  return noStore(result, result.ok ? 200 : 400);
}
