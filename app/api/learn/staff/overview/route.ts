import { staffAuthorised } from "@/lib/registration/staff";
import { noStore } from "@/lib/registration/http";
import { staffOverview } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function GET() {
  if (!(await staffAuthorised())) return noStore({ ok: false, error: "Staff sign-in is required." }, 401);
  return noStore({ ok: true, ...(await staffOverview()) });
}
