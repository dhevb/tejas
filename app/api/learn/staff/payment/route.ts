import { staffAuthorised } from "@/lib/registration/staff";
import { noStore, sameOrigin } from "@/lib/registration/http";
import { reviewPayment } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  if (!(await staffAuthorised())) return noStore({ ok: false, error: "Staff sign-in is required." }, 401);
  const body = (await request.json().catch(() => null)) as { studentId?: string; bookId?: string; decision?: "verified" | "rejected"; note?: string } | null;
  if (!body?.studentId || !body.bookId || (body.decision !== "verified" && body.decision !== "rejected")) {
    return noStore({ ok: false, error: "The payment review could not be read." }, 400);
  }
  const result = await reviewPayment({ actor: "staff", studentId: body.studentId, bookId: body.bookId, decision: body.decision, note: body.note ?? "" });
  return noStore(result, result.ok ? 200 : 400);
}
