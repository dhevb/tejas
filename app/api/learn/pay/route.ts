import { currentStudent } from "@/lib/portal/current";
import { noStore, sameOrigin } from "@/lib/registration/http";
import { reportPayment } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  const student = await currentStudent();
  if (!student) return noStore({ ok: false, error: "Sign in to continue." }, 401);
  const body = (await request.json().catch(() => null)) as { transactionReference?: unknown } | null;
  const reference = typeof body?.transactionReference === "string" ? body.transactionReference : "";
  const result = await reportPayment(student.id, reference);
  return noStore(result, result.ok ? 200 : 400);
}
