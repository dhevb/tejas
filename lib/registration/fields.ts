import { CLASS_MAX, CLASS_MIN, EXAMPLE_STUDENT_NAME } from "@/lib/registration/schema";

const ROMAN: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
  x: 10,
  xi: 11,
  xii: 12,
};

export function parseClassValue(raw: string): number | null {
  let value = raw.trim().toLowerCase().replace(/\./g, "");
  value = value.replace(/^(class|std|standard|grade)\s+/, "");
  value = value.replace(/(st|nd|rd|th)$/, "");
  if (/^\d{1,2}$/.test(value)) return Number(value);
  return ROMAN[value] ?? null;
}

export function classIsEligible(classNumber: number, allowed: readonly number[]): boolean {
  return allowed.includes(classNumber);
}

export function publishedClassLabel(): string {
  return "Classes III–X";
}

/** Sanity bounds for a Classes III–X examination in December 2026. Not an official age rule. */
const MIN_DOB = 20040101;
const MAX_DOB = 20201231;

export function dobStamp(day: number, month: number, year: number): number {
  return year * 10000 + month * 100 + day;
}

export function isRealDate(day: number, month: number, year: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function canonicalDob(day: number, month: number, year: number): string {
  return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
}

export type DobResult = { ok: true; value: string } | { ok: false; message: string };

export function validateDob(input: string): DobResult {
  const text = input.trim();
  const match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(text) ?? /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text);
  if (!match) {
    return { ok: false, message: "Enter the date of birth as DD-MM-YYYY." };
  }
  const yearFirst = match[1].length === 4;
  const year = Number(yearFirst ? match[1] : match[3]);
  const month = Number(match[2]);
  const day = Number(yearFirst ? match[3] : match[1]);
  if (!isRealDate(day, month, year)) {
    return { ok: false, message: "This date of birth is not a real calendar date." };
  }
  const stamp = dobStamp(day, month, year);
  if (stamp < MIN_DOB || stamp > MAX_DOB) {
    return {
      ok: false,
      message: "This date of birth is outside the range that can be accepted for Classes III–X in 2026.",
    };
  }
  return { ok: true, value: canonicalDob(day, month, year) };
}

export function excelSerialToDob(serial: number): DobResult {
  if (!Number.isFinite(serial)) return { ok: false, message: "Enter the date of birth as DD-MM-YYYY." };
  const whole = Math.floor(serial);
  const utc = new Date(Date.UTC(1899, 11, 30) + whole * 86400000);
  return validateDob(canonicalDob(utc.getUTCDate(), utc.getUTCMonth() + 1, utc.getUTCFullYear()));
}

export function dateObjectToDob(date: Date): DobResult {
  const utcMidnight = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
  const day = utcMidnight ? date.getUTCDate() : date.getDate();
  const month = (utcMidnight ? date.getUTCMonth() : date.getMonth()) + 1;
  const year = utcMidnight ? date.getUTCFullYear() : date.getFullYear();
  return validateDob(canonicalDob(day, month, year));
}

export function normalisePersonName(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function isExampleStudent(name: string): boolean {
  return normalisePersonName(name).toLowerCase() === EXAMPLE_STUDENT_NAME.toLowerCase();
}

export function validatePersonName(value: string, label: string): { ok: true; value: string } | { ok: false; message: string } {
  const name = normalisePersonName(value);
  if (!name) return { ok: false, message: `${label} is blank.` };
  if (name.length < 2 || name.length > 120) return { ok: false, message: `${label} must be between 2 and 120 characters.` };
  if (/[\r\n\t=+]/.test(name) || /^\s*[@=-]/.test(name)) {
    return { ok: false, message: `${label} contains a character that cannot be accepted.` };
  }
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]*[\p{L}\p{M}.]$/u.test(name) || !/\p{L}/u.test(name)) {
    return { ok: false, message: `${label} should contain letters only.` };
  }
  return { ok: true, value: name };
}

export function normaliseSchoolName(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseIndianMobile(input: string): string | null {
  let digits = input.replace(/[\s()-]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return digits;
}

export function formatIndianMobile(digits: string): string {
  return `+91-${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function parseEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function classRangeNote(): string {
  return `Eligible classes on this form are ${publishedClassLabel()} (class ${CLASS_MIN} to class ${CLASS_MAX}) for each stream, because that is the only range printed for TEJAS Olympiad 2026–27.`;
}
