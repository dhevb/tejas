/**
 * Parse Indian school addresses into State / District without rewriting the original.
 * Never guesses when the address is incomplete, ambiguous, or conflicting.
 */

import { INDIA_STATES, type IndiaState } from "@/lib/registration/india-geo-data";

export const UNIDENTIFIED_LOCATION = "State/District Not Identified";
export const UNIDENTIFIED_DISTRICT = "District Not Identified";

export type ParsedIndiaAddress = {
  /** Canonical state name when confidently identified; otherwise null. */
  state: string | null;
  /** Canonical district name when confidently identified; otherwise null. */
  district: string | null;
  /** Filter/group key for state (canonical or UNIDENTIFIED_LOCATION). */
  stateKey: string;
  /** Filter/group key for district (canonical, UNIDENTIFIED_DISTRICT, or UNIDENTIFIED_LOCATION). */
  districtKey: string;
  /** True only when both state and district are confidently identified. */
  fullyIdentified: boolean;
  /** Why identification failed or was partial (empty when fully identified). */
  notes: string[];
};

type AliasHit = { state: IndiaState; alias: string; start: number; end: number };

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Bare postal-style codes (UP, TN, MP, …) are ambiguous in running English.
 * They match only as ALL-CAPS standalone tokens in the original address.
 * Punctuated forms (U.P., T.N.) are separate aliases handled via normalisation.
 */
function isBareShortStateCode(alias: string): boolean {
  const needle = normalize(alias);
  if (!needle || /\s/.test(needle)) return false;
  return /^[a-z]{1,2}$/.test(needle);
}

/** Whole-token match on normalised text (full names and punctuated aliases like u.p. → "u p"). */
function findAlias(haystack: string, alias: string): { start: number; end: number } | null {
  const needle = normalize(alias);
  if (!needle) return null;
  const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(needle)}(?=\\s|$)`);
  const match = pattern.exec(` ${haystack} `);
  if (!match) return null;
  const start = match.index;
  return { start, end: start + needle.length + 1 };
}

/**
 * Match a bare short code only when the original address uses it as an uppercase abbreviation
 * (e.g. ", TN 600017" or "UP,"), never lowercase ordinary words like "up" / "in".
 */
function findBareShortCode(original: string, code: string): { start: number; end: number } | null {
  const upper = normalize(code).toUpperCase();
  if (!/^[A-Z]{1,2}$/.test(upper)) return null;
  const pattern = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(upper)}(?![A-Za-z0-9])`);
  const match = pattern.exec(original);
  if (!match) return null;
  return { start: match.index, end: match.index + match[0].length };
}

function aliasLength(alias: string): number {
  return normalize(alias).length;
}

function collectStateHits(original: string, normalized: string): AliasHit[] {
  const hits: AliasHit[] = [];
  for (const state of INDIA_STATES) {
    const aliases = [state.name, ...state.aliases];
    for (const alias of aliases) {
      if (isBareShortStateCode(alias)) {
        const found = findBareShortCode(original, alias);
        if (found) hits.push({ state, alias: normalize(alias), start: found.start, end: found.end });
        continue;
      }
      const found = findAlias(normalized, alias);
      if (found) hits.push({ state, alias: normalize(alias), start: found.start, end: found.end });
    }
  }
  return hits;
}

function pickUniqueState(hits: AliasHit[]): { state: IndiaState; notes: string[] } | { state: null; notes: string[] } {
  if (hits.length === 0) return { state: null, notes: ["No State/UT name or abbreviation found in address."] };
  hits.sort((a, b) => aliasLength(b.alias) - aliasLength(a.alias) || a.start - b.start);
  const longest = aliasLength(hits[0].alias);
  const top = hits.filter((hit) => aliasLength(hit.alias) === longest);
  const names = new Set(top.map((hit) => hit.state.name));
  if (names.size > 1) {
    return {
      state: null,
      notes: [`Conflicting State/UT matches: ${[...names].sort().join(", ")}.`],
    };
  }
  // Shorter aliases pointing at a different state (length ≥ 3, or punctuated multi-token) are conflicts.
  // Bare short codes that merely reinforce the same state are ignored; conflicting short codes veto.
  const primary = top[0].state;
  const otherConflicts = hits.filter((hit) => {
    if (hit.state.name === primary.name) return false;
    const len = aliasLength(hit.alias);
    if (len >= 3) return true;
    // Conflicting bare short code (e.g. both TN and KL as caps) is also a conflict.
    return isBareShortStateCode(hit.alias) || /\s/.test(hit.alias);
  });
  if (otherConflicts.length > 0) {
    const others = [...new Set(otherConflicts.map((hit) => hit.state.name))].sort();
    return {
      state: null,
      notes: [`Conflicting State/UT matches: ${[primary.name, ...others].join(", ")}.`],
    };
  }
  return { state: primary, notes: [] };
}

function collectDistrictHits(state: IndiaState, normalized: string): Array<{ name: string; alias: string; length: number }> {
  const hits: Array<{ name: string; alias: string; length: number }> = [];
  for (const district of state.districts) {
    const aliases = [district.name, ...(district.aliases ?? [])];
    for (const alias of aliases) {
      if (!findAlias(normalized, alias)) continue;
      hits.push({ name: district.name, alias: normalize(alias), length: aliasLength(alias) });
    }
  }
  return hits;
}

function pickUniqueDistrict(
  state: IndiaState,
  normalized: string,
): { district: string | null; notes: string[] } {
  const hits = collectDistrictHits(state, normalized);
  if (hits.length === 0) return { district: null, notes: [`State identified as ${state.name}, but no district matched.`] };
  hits.sort((a, b) => b.length - a.length);
  const longest = hits[0].length;
  const top = hits.filter((hit) => hit.length === longest);
  const names = new Set(top.map((hit) => hit.name));
  if (names.size > 1) {
    return {
      district: null,
      notes: [`Ambiguous district matches within ${state.name}: ${[...names].sort().join(", ")}.`],
    };
  }
  return { district: top[0].name, notes: [] };
}

/**
 * When no state text matched, a district name that belongs to exactly one state
 * can identify both — but only if that district name is unique across India.
 */
function stateFromUniqueDistrict(normalized: string): { state: IndiaState; district: string } | null {
  const matches: Array<{ state: IndiaState; district: string; length: number }> = [];
  for (const state of INDIA_STATES) {
    for (const district of state.districts) {
      const aliases = [district.name, ...(district.aliases ?? [])];
      for (const alias of aliases) {
        if (!findAlias(normalized, alias)) continue;
        const length = aliasLength(alias);
        if (length < 4) continue;
        matches.push({ state, district: district.name, length });
      }
    }
  }
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.length - a.length);
  const longest = matches[0].length;
  const top = matches.filter((m) => m.length === longest);
  const stateNames = new Set(top.map((m) => m.state.name));
  const districtNames = new Set(top.map((m) => m.district));
  if (stateNames.size !== 1 || districtNames.size !== 1) return null;
  return { state: top[0].state, district: top[0].district };
}

function extractPin(normalized: string): string | null {
  const match = normalized.match(/\b([1-9][0-9]{5})\b/);
  return match ? match[1] : null;
}

export function parseIndiaAddress(address: string | null | undefined): ParsedIndiaAddress {
  const original = typeof address === "string" ? address : "";
  const normalized = normalize(original);
  if (normalized.length < 3) {
    return {
      state: null,
      district: null,
      stateKey: UNIDENTIFIED_LOCATION,
      districtKey: UNIDENTIFIED_LOCATION,
      fullyIdentified: false,
      notes: ["Address too short to identify State/District."],
    };
  }

  const notes: string[] = [];
  const pin = extractPin(normalized);

  let statePick = pickUniqueState(collectStateHits(original, normalized));
  let district: string | null = null;

  if (!statePick.state) {
    const fromDistrict = stateFromUniqueDistrict(normalized);
    if (fromDistrict) {
      statePick = { state: fromDistrict.state, notes: [] };
      district = fromDistrict.district;
      notes.push("State inferred from a district name unique to one State/UT.");
    } else {
      notes.push(...statePick.notes);
      // PIN never invents State (two-digit prefixes are ambiguous across India).
      if (pin) notes.push(`PIN ${pin} was present but not used to invent a State.`);
      return {
        state: null,
        district: null,
        stateKey: UNIDENTIFIED_LOCATION,
        districtKey: UNIDENTIFIED_LOCATION,
        fullyIdentified: false,
        notes,
      };
    }
  } else {
    notes.push(...statePick.notes);
  }

  const state = statePick.state!;

  // PIN is never used to veto a text-derived State (prefixes are ambiguous). Optional diagnostic only.
  if (pin) {
    notes.push(`PIN ${pin} noted; two-digit PIN prefixes are not used to confirm or reject State.`);
  }

  if (!district) {
    const districtPick = pickUniqueDistrict(state, normalized);
    district = districtPick.district;
    notes.push(...districtPick.notes);
  }

  if (!district) {
    return {
      state: state.name,
      district: null,
      stateKey: state.name,
      districtKey: UNIDENTIFIED_DISTRICT,
      fullyIdentified: false,
      notes,
    };
  }

  return {
    state: state.name,
    district,
    stateKey: state.name,
    districtKey: district,
    fullyIdentified: true,
    notes: [],
  };
}

/** Stable display label for dashboard grouping. */
export function locationLabel(parsed: ParsedIndiaAddress): string {
  if (!parsed.state) return UNIDENTIFIED_LOCATION;
  if (!parsed.district) return `${parsed.state} · ${UNIDENTIFIED_DISTRICT}`;
  return `${parsed.state} · ${parsed.district}`;
}

/** District options for a selected state filter key, including unidentified buckets. */
export function districtsForStateKey(stateKey: string, rows: Array<{ stateKey: string; districtKey: string }>): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.stateKey === stateKey) set.add(row.districtKey);
  }
  return [...set].sort((a, b) => {
    if (a === UNIDENTIFIED_DISTRICT || a === UNIDENTIFIED_LOCATION) return 1;
    if (b === UNIDENTIFIED_DISTRICT || b === UNIDENTIFIED_LOCATION) return -1;
    return a.localeCompare(b);
  });
}
