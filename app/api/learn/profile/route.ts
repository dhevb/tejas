import { currentStudent } from "@/lib/portal/current";
import { noStore, sameOrigin } from "@/lib/registration/http";
import { updateProfile } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  const student = await currentStudent();
  if (!student) return noStore({ ok: false, error: "Sign in to continue." }, 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return noStore({ ok: false, error: "The form could not be read." }, 400);
  const result = await updateProfile(student.id, body);
  return noStore(result, result.ok ? 200 : 403);
}
