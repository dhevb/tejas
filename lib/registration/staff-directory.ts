import { hashPassword, passwordMatches } from "@/lib/portal/session";
import { PortalUnavailable, schemaMissing, supabaseConfigured, supabaseRest } from "@/lib/portal/supabase-rest";
import { STAFF_RECOVERY_SUBJECT } from "@/lib/registration/auth";

export type StaffAccount = {
  id: string;
  email: string;
  roleName: string;
  active: boolean;
};

type VersionResult = number | "missing" | "down";

function rows(json: unknown): Record<string, unknown>[] {
  return Array.isArray(json) ? json.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
}

/** Advance the one active session for this subject. Missing means the migration is not applied yet. */
export async function bumpStaffSession(subject: string): Promise<VersionResult> {
  if (!supabaseConfigured()) return "missing";
  try {
    const result = await supabaseRest("/rest/v1/rpc/tejas_staff_bump_session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ p_subject: subject }),
    });
    if (schemaMissing(result.status, result.json)) return "missing";
    if (result.status === 404 && result.json && typeof result.json === "object" && (result.json as { code?: string }).code === "PGRST202") return "missing";
    if (result.status !== 200 || typeof result.json !== "number") return "down";
    return result.json;
  } catch (error) {
    if (error instanceof PortalUnavailable) return "down";
    return "down";
  }
}

export async function staffSessionVersion(subject: string): Promise<VersionResult> {
  if (!supabaseConfigured()) return "missing";
  if (subject === STAFF_RECOVERY_SUBJECT || /^[0-9a-f-]{36}$/i.test(subject)) {
    try {
      const result = await supabaseRest(`/rest/v1/tejas_staff_sessions?subject=eq.${encodeURIComponent(subject)}&select=session_version`, { method: "GET" });
      if (schemaMissing(result.status, result.json)) return "missing";
      if (result.status !== 200) return "down";
      const version = rows(result.json)[0]?.session_version;
      return typeof version === "number" ? version : "missing";
    } catch (error) {
      if (error instanceof PortalUnavailable) return "down";
      return "down";
    }
  }
  return "down";
}

export async function authenticateStaff(emailInput: unknown, password: unknown): Promise<StaffAccount | null | "unavailable"> {
  if (!supabaseConfigured()) return "unavailable";
  const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
  if (!email || typeof password !== "string") return null;
  try {
    const result = await supabaseRest(`/rest/v1/tejas_learn_staff?email=eq.${encodeURIComponent(email)}&select=id,email,role_name,active,password_hash,password_salt`, { method: "GET" });
    if (schemaMissing(result.status, result.json) || (result.status === 404)) return "unavailable";
    if (result.status !== 200) return "unavailable";
    const row = rows(result.json)[0];
    if (!row || row.active !== true) return null;
    if (typeof row.password_hash !== "string" || typeof row.password_salt !== "string" || typeof row.id !== "string" || typeof row.email !== "string") return null;
    if (!passwordMatches(password, row.password_salt, row.password_hash)) return null;
    return { id: row.id, email: row.email, roleName: typeof row.role_name === "string" ? row.role_name : "reviewer", active: true };
  } catch (error) {
    if (error instanceof PortalUnavailable) return "unavailable";
    return "unavailable";
  }
}

export async function staffEmail(subject: string): Promise<string | null> {
  if (subject === STAFF_RECOVERY_SUBJECT) return STAFF_RECOVERY_SUBJECT;
  if (!supabaseConfigured()) return null;
  try {
    const result = await supabaseRest(`/rest/v1/tejas_learn_staff?id=eq.${encodeURIComponent(subject)}&select=email`, { method: "GET" });
    if (result.status !== 200) return null;
    const email = rows(result.json)[0]?.email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

export async function createStaffAccount(input: { email: string; password: string }): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!supabaseConfigured()) return { ok: false, error: "Staff accounts need the portal database. The recovery token still opens this page." };
  const password = hashPassword(input.password);
  try {
    const result = await supabaseRest("/rest/v1/tejas_learn_staff", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({
        email: input.email,
        password_hash: password.hash,
        password_salt: password.salt,
        role_name: "reviewer",
        active: true,
      }),
    });
    if (schemaMissing(result.status, result.json)) return { ok: false, error: "Staff accounts are not ready until the portal migration is applied." };
    if (result.status === 409) return { ok: false, error: "An account with this email already exists." };
    if (result.status !== 201 && result.status !== 200) return { ok: false, error: "The staff account could not be created." };
    const id = rows(result.json)[0]?.id;
    if (typeof id !== "string") return { ok: false, error: "The staff account could not be created." };
    return { ok: true, id };
  } catch (error) {
    if (error instanceof PortalUnavailable) return { ok: false, error: "The student portal database is not available." };
    return { ok: false, error: "The staff account could not be created." };
  }
}
