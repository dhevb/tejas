import { passwordIsAcceptable } from "@/lib/portal/session";
import { supabaseRest } from "@/lib/portal/supabase-rest";
import { noStore, sameOrigin } from "@/lib/registration/http";
import { createStaffAccount } from "@/lib/registration/staff-directory";
import { staffIdentity } from "@/lib/registration/staff";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  const actor = await staffIdentity();
  if (!actor) return noStore({ ok: false, error: "Staff sign-in is required." }, 401);
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return noStore({ ok: false, error: "Enter a valid email address." }, 400);
  if (typeof body?.password !== "string" || !passwordIsAcceptable(body.password)) return noStore({ ok: false, error: "Use a password of 8 to 72 characters." }, 400);
  const result = await createStaffAccount({ email, password: body.password });
  if (!result.ok) return noStore(result, 400);
  try {
    await supabaseRest("/rest/v1/tejas_learn_audit", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({
        actor,
        action_name: "create-staff",
        reason: "An authorised staff member created a staff account.",
        after_state: { email },
      }),
    });
  } catch {
    console.error("staff account audit could not be written");
  }
  console.info("staff account created");
  return noStore({ ok: true, id: result.id });
}
