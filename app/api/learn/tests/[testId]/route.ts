import { currentStudent } from "@/lib/portal/current";
import { startAttempt } from "@/lib/portal/store";
import { noStore, sameOrigin } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ testId: string }> }) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  const student = await currentStudent();
  if (!student) return noStore({ ok: false, error: "Sign in to continue." }, 401);
  const { testId } = await context.params;
  const result = await startAttempt(student, testId);
  return noStore(result, result.ok ? 200 : result.reason === "unknown" ? 404 : 403);
}
