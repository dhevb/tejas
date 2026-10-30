/**
 * Class range source: the TEJAS brochure cover prints Classes III–X for the
 * Olympiad and does not print a separate range for any stream. Eligibility is
 * stored per stream so a later approved range can differ without a rewrite.
 */
export const CLASS_MIN = 3;
export const CLASS_MAX = 10;

export const STREAMS = [
  { id: "english", name: "TEJAS English", classes: [3, 4, 5, 6, 7, 8, 9, 10] },
  { id: "mathematics", name: "TEJAS Mathematics", classes: [3, 4, 5, 6, 7, 8, 9, 10] },
  { id: "technology", name: "TEJAS Future Tech", classes: [3, 4, 5, 6, 7, 8, 9, 10] },
] as const;

export type StreamId = (typeof STREAMS)[number]["id"];

export const STUDENT_COLUMNS = [
  { key: "fullName", header: "Full Name of Student" },
  { key: "parentName", header: "Father's/Mother's Name" },
  { key: "parentMobile", header: "Parent/Guardian Mobile" },
  { key: "parentEmail", header: "Parent/Guardian Email" },
  { key: "dob", header: "Date of Birth (DD-MM-YYYY)" },
  { key: "className", header: "Class" },
  { key: "section", header: "Section" },
  { key: "rollNumber", header: "Roll Number" },
  { key: "schoolName", header: "School Name" },
  { key: "streams", header: "Selected TEJAS Stream(s)" },
] as const;

export type ColumnKey = (typeof STUDENT_COLUMNS)[number]["key"];

export const EXAMPLE_STUDENT_NAME = "EXAMPLE STUDENT (DELETE THIS ROW)";
export const EXAMPLE_PARENT_NAME = "Example Parent";
export const EXAMPLE_PARENT_MOBILE = "9876543210";
export const EXAMPLE_PARENT_EMAIL = "parent@example.test";
export const EXAMPLE_DOB = "15-08-2015";
export const EXAMPLE_ROLL = "1";
export const EXAMPLE_CLASS = "V";
export const EXAMPLE_SECTION = "A";
export const EXAMPLE_SCHOOL = "EXAMPLE SCHOOL (REPLACE WITH YOUR SCHOOL)";
export const EXAMPLE_STREAMS = "TEJAS English";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const MAX_STUDENT_ROWS = 2000;

export const PREVIOUS_OLYMPIAD_NAME = "1st DHE English Olympiad";
export const PREVIOUS_OLYMPIAD_DATES = "13–16 October 2025";

const HEADER_ALIASES: Record<string, ColumnKey> = {
  "full name of student": "fullName",
  "fathers mothers name": "parentName",
  "father mothers name": "parentName",
  "parent guardian mobile": "parentMobile",
  "parent mobile": "parentMobile",
  "parent guardian email": "parentEmail",
  "parent email": "parentEmail",
  "date of birth": "dob",
  class: "className",
  section: "section",
  "roll number": "rollNumber",
  "roll number if assigned": "rollNumber",
  "school name": "schoolName",
  "selected tejas stream": "streams",
  "selected tejas streams": "streams",
};

export function normaliseHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function columnKeyForHeader(value: string): ColumnKey | null {
  return HEADER_ALIASES[normaliseHeader(value)] ?? null;
}

const STREAM_ALIASES: Record<string, StreamId> = {
  "tejas english": "english",
  english: "english",
  "tejas mathematics": "mathematics",
  mathematics: "mathematics",
  "tejas future tech": "technology",
  "future tech": "technology",
};

export function streamById(id: StreamId) {
  const stream = STREAMS.find((item) => item.id === id);
  if (!stream) throw new Error("Unknown stream.");
  return stream;
}

export function parseStreamToken(token: string): StreamId | null {
  const key = token.toLowerCase().replace(/[^a-z]+/g, " ").replace(/\s+/g, " ").trim();
  return STREAM_ALIASES[key] ?? null;
}

export function splitStreamCell(value: string): string[] {
  return value
    .split(/[,;|\n]+|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}
