import { noStore } from "@/lib/registration/http";
import { registrationOwnerAuthorised } from "@/lib/registration/staff";
import { staffSnapshot } from "@/lib/registration/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await registrationOwnerAuthorised())) return noStore({ ok: false }, 401);
  const snapshot = await staffSnapshot();
  return noStore({ ok: true, ...snapshot });
}
