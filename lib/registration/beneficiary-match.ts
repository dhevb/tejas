/**
 * Deterministic beneficiary matching for screenshot OCR auto-approval.
 * Does not change published bank account numbers or IFSC values.
 */

export const OFFICIAL_BENEFICIARY_FULL =
  "Vidya Bharti Institute of Training and Research Trust";

/** Acceptable bank truncations of the official beneficiary. Exact normalised match only. */
export const OFFICIAL_BENEFICIARY_ALLOWLIST = [
  "VIDYA BHARTI INSTITUTE OF TRAINING AND RESEARCH TRUST",
  "VIDYA BHARTI INSTITUTE OF TRAINING AND RESEARCH",
  "VIDYA BHARTI INSTITUTE OF TRAINING AND RES",
  "VIDYA BHARTI INSTITUTE OF TRAINING",
  "VIDYA BHARTI INSTITUTE",
  "VIDYA BHARTI INST OF TRAINING AND RESEARCH TRUST",
  "VIDYA BHARTI INST OF TRAINING AND RESEARCH",
  "V B EDUCATIONAL TRUST",
  "VB EDUCATIONAL TRUST",
  "V.B. EDUCATIONAL TRUST",
] as const;

/** School-registration account holder as published on the site. */
export const REGISTRATION_BENEFICIARY_ALLOWLIST = [
  "TEJAS OLYMPIAD",
  "TEJAS OLYMPIAD DHE",
] as const;

export type BeneficiaryPurpose = "registration" | "ebook";

export type BeneficiaryMatch =
  | { ok: true; matched: string; form: "full" | "truncated" | "allowlist" }
  | { ok: false; reason: "missing" | "ambiguous" | "unrelated" };

/** Collapse case, punctuation, and OCR spacing into a comparable key. */
export function normaliseBeneficiary(value: string): string {
  return value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function allowlistFor(purpose: BeneficiaryPurpose): readonly string[] {
  if (purpose === "ebook") return OFFICIAL_BENEFICIARY_ALLOWLIST;
  return REGISTRATION_BENEFICIARY_ALLOWLIST;
}

/**
 * Conservative matching: normalised extracted name must equal an allowlisted form.
 * Missing Trust is accepted via the allowlist. Unrestricted fuzzy match is never used.
 */
export function matchBeneficiary(extracted: string | null | undefined, purpose: BeneficiaryPurpose): BeneficiaryMatch {
  if (!extracted || !extracted.trim()) return { ok: false, reason: "missing" };
  const key = normaliseBeneficiary(extracted);
  if (!key) return { ok: false, reason: "missing" };

  const list = allowlistFor(purpose).map(normaliseBeneficiary);
  const hit = list.find((item) => item === key);
  if (!hit) {
    // Reject generic / ambiguous fragments.
    if (key.length < 10 || /UNKNOWN|CUSTOMER|SELF|CASH|NA|NOT AVAILABLE/.test(key)) {
      return { ok: false, reason: "ambiguous" };
    }
    return { ok: false, reason: "unrelated" };
  }

  const full = normaliseBeneficiary(OFFICIAL_BENEFICIARY_FULL);
  if (purpose === "ebook" && hit === full) return { ok: true, matched: hit, form: "full" };
  if (purpose === "ebook" && hit === normaliseBeneficiary("Vidya Bharti Institute of Training and Research")) {
    return { ok: true, matched: hit, form: "truncated" };
  }
  return { ok: true, matched: hit, form: "allowlist" };
}
