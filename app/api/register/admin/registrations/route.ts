import { noStore } from "@/lib/registration/http";
import { staffAuthorised } from "@/lib/registration/staff";
import { listRegistrationsForStaff } from "@/lib/registration/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await staffAuthorised())) return noStore({ ok: false }, 401);
  return noStore({ ok: true, registrations: await listRegistrationsForStaff() });
}
