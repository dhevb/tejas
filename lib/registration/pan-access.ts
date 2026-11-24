import { maskPan } from "@/lib/registration/fields";

/**
 * Full-PAN reveal is disabled until a trusted staff role/permission model exists.
 *
 * Evidence today:
 * - `tejas_learn_staff.role_name` is constrained to `'reviewer'` only.
 * - `tejas_admin_users` (reviewer|finance) is unused by the live staff session path and has historically been empty.
 * - Recovery-token sessions have subject `recovery` with no role.
 *
 * Do not invent roles or trust client-supplied role/header/query parameters.
 * Owner approval + schema/auth work is required before enabling reveal.
 */
export const FULL_PAN_REVEAL_AVAILABLE = false;

export type PanRevealSurface = "detail-api" | "consolidated-xlsx" | "schools-csv" | "ui";

export type PanRevealDecision = {
  reveal: boolean;
  requested: boolean;
  reason: "not_requested" | "disabled_no_trusted_role" | "authorized";
};

/** Always false until owner approves a real role-gated model. */
export function staffMayRevealFullPan(): boolean {
  return FULL_PAN_REVEAL_AVAILABLE;
}

/**
 * Resolve whether a revealPan request may return the unmasked value.
 * Logs the decision without logging the PAN itself.
 */
export function authorizePanReveal(input: {
  requested: boolean;
  subject: string | null;
  surface: PanRevealSurface;
  reference?: string | null;
}): PanRevealDecision {
  if (!input.requested) {
    return { reveal: false, requested: false, reason: "not_requested" };
  }
  if (!staffMayRevealFullPan()) {
    console.info(
      `staff pan reveal denied surface=${input.surface} subject=${input.subject ?? "unknown"} reference=${input.reference ?? "-"}`,
    );
    return { reveal: false, requested: true, reason: "disabled_no_trusted_role" };
  }
  console.info(
    `staff pan reveal authorized surface=${input.surface} subject=${input.subject ?? "unknown"} reference=${input.reference ?? "-"}`,
  );
  return { reveal: true, requested: true, reason: "authorized" };
}

/** Staff-facing school PAN fields: never ship the raw value while reveal is disabled. */
export function staffVisiblePan(pan: string | null | undefined): {
  pan: string;
  maskedPan: string;
  fullPanAvailable: boolean;
} {
  const raw = typeof pan === "string" ? pan.trim() : "";
  const masked = raw ? maskPan(raw) : "";
  return {
    pan: masked,
    maskedPan: masked,
    fullPanAvailable: staffMayRevealFullPan(),
  };
}

export function panValueForExport(pan: string | null | undefined, reveal: boolean): string {
  const raw = typeof pan === "string" ? pan : "";
  if (reveal && staffMayRevealFullPan()) return raw;
  return maskPan(raw);
}
