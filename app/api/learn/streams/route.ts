import { currentStudent } from "@/lib/portal/current";
import { addStreamPurchases } from "@/lib/portal/store";
import { noStore, sameOrigin } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  const student = await currentStudent();
  if (!student) return noStore({ ok: false, error: "Sign in to continue." }, 401);
  const body = (await request.json().catch(() => null)) as { streamIds?: unknown } | null;
  if (!body) return noStore({ ok: false, error: "Select at least one stream." }, 400);
  const result = await addStreamPurchases(student.id, body.streamIds);
  if (!result.ok) return noStore(result, 400);
  return noStore({
    ok: true,
    amountInr: result.quote.status === "payable" ? result.quote.amountInr : 0,
    streamIds: result.quote.status === "payable" ? result.quote.lines.map((line) => line.streamId) : [],
  });
}
