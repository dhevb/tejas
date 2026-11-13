import { currentStudent } from "@/lib/portal/current";
import { submitAttempt } from "@/lib/portal/store";
import { noStore, sameOrigin } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  const student = await currentStudent();
  if (!student) return noStore({ ok: false, error: "Sign in to continue." }, 401);
  const body = (await request.json().catch(() => null)) as { attemptId?: unknown; answers?: unknown } | null;
  if (!body || typeof body.attemptId !== "string" || !body.answers || typeof body.answers !== "object") {
    return noStore({ ok: false, error: "The answers could not be read." }, 400);
  }
  const result = await submitAttempt(student, body.attemptId, body.answers as Record<string, string>);
  return noStore(result, result.ok ? 200 : 400);
}
