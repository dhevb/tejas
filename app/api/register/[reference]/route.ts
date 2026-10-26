import { noStore } from "@/lib/registration/http";
import { referenceIsValid } from "@/lib/registration/reference";
import { readRegistration, toPublicSummary } from "@/lib/registration/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ reference: string }> }) {
  const { reference } = await context.params;
  if (!referenceIsValid(reference)) return noStore({ ok: false }, 404);
  const record = await readRegistration(reference);
  if (!record) return noStore({ ok: false }, 404);
  return noStore({ ok: true, registration: toPublicSummary(record) });
}
