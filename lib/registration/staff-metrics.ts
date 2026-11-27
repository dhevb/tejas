import { createHash } from "node:crypto";
import { parseClassValue } from "@/lib/registration/fields";
import { FEE_SCHOOL, FEE_TEJAS, FEE_TOTAL, presentFee, type StoredFee } from "@/lib/registration/fee";
import type { StreamId } from "@/lib/registration/schema";
import type { StudentRecord } from "@/lib/registration/sheet";

/** Mirrors registration payment statuses without importing store (avoids cycles). */
export type StaffPaymentStatus =
  | "pending_instructions"
  | "awaiting_payment"
  | "reported"
  | "confirmed"
  | "rejected"
  | "refund_pending";

/** Stable identity used by the sheet parser for same-student / multi-stream rows. */
export function studentIdentityKey(student: Pick<StudentRecord, "fullName" | "dateOfBirth" | "parentName" | "parentMobile">): string {
  return [student.fullName, student.dateOfBirth, student.parentName, student.parentMobile]
    .map((part) => part.trim().toLowerCase().replace(/\s+/g, " "))
    .join("|");
}

export type StreamCounts = {
  english: number;
  mathematics: number;
  technology: number;
  total: number;
};

export function countStreamRegistrations(students: StudentRecord[]): StreamCounts {
  const counts: StreamCounts = { english: 0, mathematics: 0, technology: 0, total: 0 };
  for (const student of students) {
    for (const stream of student.streams) {
      if (stream === "english" || stream === "mathematics" || stream === "technology") {
        counts[stream] += 1;
        counts.total += 1;
      }
    }
  }
  return counts;
}

/** Opaque dedupe token for Owner list payloads (avoids re-sending raw identity fields). */
export function studentIdentityDedupeToken(
  student: Pick<StudentRecord, "fullName" | "dateOfBirth" | "parentName" | "parentMobile">,
): string {
  return createHash("sha256").update(studentIdentityKey(student)).digest("hex").slice(0, 24);
}

export type OlympiadPlacement = {
  /** Stable hashed student identity for cross-registration dedupe. */
  id: string;
  /** Resolved class number 3–10, or null when class is missing/invalid. */
  classNumber: number | null;
  streams: Array<"english" | "mathematics" | "technology">;
};

/** Compact olympiad placements for one registration (Owner dashboard stream×class matrix). */
export function olympiadPlacementsForStudents(students: StudentRecord[]): OlympiadPlacement[] {
  const byId = new Map<string, OlympiadPlacement>();
  for (const student of students) {
    const id = studentIdentityDedupeToken(student);
    const info = classKeyForStudent(student);
    const classNumber =
      info.key.startsWith("class-") && info.sort >= 3 && info.sort <= 10 ? info.sort : null;
    const streams = student.streams.filter(
      (stream): stream is "english" | "mathematics" | "technology" =>
        stream === "english" || stream === "mathematics" || stream === "technology",
    );
    if (streams.length === 0) continue;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, { id, classNumber, streams: [...new Set(streams)] });
      continue;
    }
    const merged = new Set([...existing.streams, ...streams]);
    existing.streams = [...merged];
    // Prefer a resolved class number when one placement has it.
    if (existing.classNumber == null && classNumber != null) existing.classNumber = classNumber;
  }
  return [...byId.values()];
}

/** Unique students by parser identity. Multi-stream as separate rows counts once. */
export function countUniqueStudents(students: StudentRecord[]): {
  unique: number;
  rowCount: number;
  ambiguousNotes: string[];
} {
  const byKey = new Map<string, number>();
  const ambiguousNotes: string[] = [];
  for (const student of students) {
    const key = studentIdentityKey(student);
    byKey.set(key, (byKey.get(key) ?? 0) + 1);
  }
  for (const [key, rows] of byKey) {
    if (rows > 1) {
      // Multiple rows for one identity is expected for multi-stream; not ambiguous by itself.
      void key;
    }
  }
  // Near-duplicates (same name+DOB, different parent mobile) stay separate — do not merge.
  const nameDob = new Map<string, Set<string>>();
  for (const student of students) {
    const soft = `${student.fullName.trim().toLowerCase()}|${student.dateOfBirth}`;
    const set = nameDob.get(soft) ?? new Set<string>();
    set.add(studentIdentityKey(student));
    nameDob.set(soft, set);
  }
  for (const [soft, identities] of nameDob) {
    if (identities.size > 1) {
      ambiguousNotes.push(
        `Same name and date of birth with different parent identity keys (${identities.size} variants for “${soft.split("|")[0]}”). Kept separate; not merged.`,
      );
    }
  }
  return { unique: byKey.size, rowCount: students.length, ambiguousNotes };
}

export function classWiseCounts(students: StudentRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  const seen = new Set<string>();
  for (const student of students) {
    const identity = studentIdentityKey(student);
    const classLabel = student.classLabel || String(student.classNumber);
    const key = `${identity}|${classLabel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts[classLabel] = (counts[classLabel] ?? 0) + 1;
  }
  return counts;
}

export type StreamFeeLine = {
  stream: StreamId;
  label: string;
  count: number;
  gross: number;
  schoolShare: number;
  tejasPayable: number;
};

export function streamFeeLines(counts: StreamCounts): StreamFeeLine[] {
  const rows: Array<{ stream: StreamId; label: string; count: number }> = [
    { stream: "english", label: "TEJAS English", count: counts.english },
    { stream: "mathematics", label: "TEJAS Mathematics", count: counts.mathematics },
    { stream: "technology", label: "TEJAS Future Tech", count: counts.technology },
  ];
  return rows.map((row) => ({
    ...row,
    gross: row.count * FEE_TOTAL,
    schoolShare: row.count * FEE_SCHOOL,
    tejasPayable: row.count * FEE_TEJAS,
  }));
}

/** Compare stream-derived N×fees with the saved fee breakdown (no browser trust). */
export function reconcileFeeWithSaved(counts: StreamCounts, fee: StoredFee): {
  ok: boolean;
  derivedStreams: number;
  savedStreams: number;
  derivedPayable: number;
  savedPayable: number;
  notes: string[];
} {
  const presented = presentFee(fee);
  const derivedStreams = counts.total;
  const savedStreams = presented.studentStreamRegistrations;
  const derivedPayable = derivedStreams * FEE_TEJAS;
  const savedPayable = presented.registrationPayable;
  const notes: string[] = [];
  if (derivedStreams !== savedStreams) {
    notes.push(`Stream-row total ${derivedStreams} does not match saved student-stream count ${savedStreams}.`);
  }
  if (fee.schoolShareApproved !== true) {
    notes.push("Saved fee may be a legacy full-remittance record; amounts shown as saved, not recalculated.");
  } else if (derivedPayable !== savedPayable) {
    notes.push(`Derived TEJAS payable ${derivedPayable} does not match saved registration payable ${savedPayable}.`);
  }
  return {
    ok: notes.length === 0,
    derivedStreams,
    savedStreams,
    derivedPayable,
    savedPayable,
    notes,
  };
}

export type DriveSyncStatus = "not_configured" | "pending" | "synced" | "failed";

/** No Drive credentials or sync table in app yet — always not_configured until owner approves design. */
export function driveSyncStatusForRegistration(_reference: string): DriveSyncStatus {
  return "not_configured";
}

export function driveSyncLabel(status: DriveSyncStatus): string {
  if (status === "not_configured") return "Drive not configured";
  if (status === "pending") return "Pending";
  if (status === "synced") return "Synced";
  return "Failed";
}

export const CLASS_NOT_IDENTIFIED = "Class Not Identified";

export type ClassKeyInfo = {
  key: string;
  label: string;
  sort: number;
};

/** Resolve class from stored classNumber / classLabel only — never from school or roll. */
export function classKeyForStudent(student: Pick<StudentRecord, "classLabel" | "classNumber">): ClassKeyInfo {
  const fromNumber = typeof student.classNumber === "number" && Number.isFinite(student.classNumber)
    ? student.classNumber
    : null;
  const parsed = fromNumber ?? parseClassValue(String(student.classLabel ?? "").trim());
  if (parsed !== null && parsed >= 1 && parsed <= 12) {
    return { key: `class-${parsed}`, label: `Class ${parsed}`, sort: parsed };
  }
  const label = String(student.classLabel ?? "").trim();
  if (!label) return { key: "ni", label: CLASS_NOT_IDENTIFIED, sort: 999 };
  return { key: `label:${label.toLowerCase()}`, label, sort: 500 };
}

/** Saved fee parts used for allocation / payment buckets (never invent ratios). */
export type RegistrationFeeParts = {
  /** Saved TEJAS remittance (`amountDue` / registrationPayable). */
  tejas: number;
  /** Saved gross fee (`grossTotal` / totalStudentFees). */
  gross: number;
  /** Saved school share. */
  schoolShare: number;
};

export type ClassMetric = {
  classKey: string;
  classLabel: string;
  sort: number;
  /** Registrations that include at least one student in this class (1 for this registration). */
  registrationTouch: number;
  uniqueStudents: number;
  studentStreams: number;
  /** Share of this registration's TEJAS amountDue allocated by stream weight. */
  allocatedAmountDue: number;
  /** Share of this registration's saved grossTotal allocated by stream weight. */
  allocatedGross: number;
  /** Share of this registration's saved schoolShare allocated by stream weight. */
  allocatedSchoolShare: number;
};

function fixRoundingOnHeaviest(
  rows: ClassMetric[],
  field: "allocatedAmountDue" | "allocatedGross" | "allocatedSchoolShare",
  target: number,
): void {
  if (rows.length === 0) return;
  const sum = rows.reduce((n, row) => n + row[field], 0);
  const delta = target - sum;
  if (delta !== 0) {
    const heaviest = [...rows].sort((a, b) => b.studentStreams - a.studentStreams || a.sort - b.sort)[0];
    heaviest[field] += delta;
  }
}

/**
 * Per-class metrics for one registration.
 * Amounts allocate saved fee parts by student-stream weight in each class.
 * `amountDueOrParts` may be a TEJAS-only number (legacy) or full saved fee parts.
 */
export function classMetricsForRegistration(
  students: StudentRecord[],
  amountDueOrParts: number | RegistrationFeeParts,
): ClassMetric[] {
  const parts: RegistrationFeeParts = typeof amountDueOrParts === "number"
    ? { tejas: amountDueOrParts, gross: 0, schoolShare: 0 }
    : amountDueOrParts;
  type Acc = {
    info: ClassKeyInfo;
    identities: Set<string>;
    studentStreams: number;
  };
  const byClass = new Map<string, Acc>();
  let totalStreams = 0;
  for (const student of students) {
    const streams = student.streams.filter((id) => id === "english" || id === "mathematics" || id === "technology");
    if (streams.length === 0) continue;
    const info = classKeyForStudent(student);
    const acc = byClass.get(info.key) ?? { info, identities: new Set<string>(), studentStreams: 0 };
    acc.identities.add(studentIdentityKey(student));
    acc.studentStreams += streams.length;
    totalStreams += streams.length;
    byClass.set(info.key, acc);
  }
  if (byClass.size === 0 && students.length > 0) {
    const info = { key: "ni", label: CLASS_NOT_IDENTIFIED, sort: 999 };
    return [{
      classKey: info.key,
      classLabel: info.label,
      sort: info.sort,
      registrationTouch: 1,
      uniqueStudents: countUniqueStudents(students).unique,
      studentStreams: 0,
      allocatedAmountDue: parts.tejas,
      allocatedGross: parts.gross,
      allocatedSchoolShare: parts.schoolShare,
    }];
  }
  const rows: ClassMetric[] = [];
  for (const acc of byClass.values()) {
    const weight = totalStreams > 0 ? acc.studentStreams / totalStreams : 0;
    rows.push({
      classKey: acc.info.key,
      classLabel: acc.info.label,
      sort: acc.info.sort,
      registrationTouch: 1,
      uniqueStudents: acc.identities.size,
      studentStreams: acc.studentStreams,
      allocatedAmountDue: Math.round(parts.tejas * weight),
      allocatedGross: Math.round(parts.gross * weight),
      allocatedSchoolShare: Math.round(parts.schoolShare * weight),
    });
  }
  fixRoundingOnHeaviest(rows, "allocatedAmountDue", parts.tejas);
  fixRoundingOnHeaviest(rows, "allocatedGross", parts.gross);
  fixRoundingOnHeaviest(rows, "allocatedSchoolShare", parts.schoolShare);
  return rows.sort((a, b) => a.sort - b.sort || a.classLabel.localeCompare(b.classLabel));
}

export type PaymentBucketAmounts = {
  confirmedCount: number;
  /** Confirmed TEJAS remittance (saved amountDue). */
  confirmedAmount: number;
  /** Confirmed saved grossTotal (independent field; not invented from TEJAS). */
  confirmedGross: number;
  /** Confirmed saved schoolShare. */
  confirmedSchoolShare: number;
  awaitingCount: number;
  awaitingAmount: number;
  awaitingGross: number;
  reportedCount: number;
  reportedAmount: number;
  reportedGross: number;
  rejectedCount: number;
  rejectedAmount: number;
  rejectedGross: number;
  refundPendingCount: number;
  refundPendingAmount: number;
  refundPendingGross: number;
  /** awaiting + reported TEJAS amounts. */
  pendingPayable: number;
  /** awaiting + reported gross amounts. */
  pendingGross: number;
};

export function emptyPaymentBuckets(): PaymentBucketAmounts {
  return {
    confirmedCount: 0,
    confirmedAmount: 0,
    confirmedGross: 0,
    confirmedSchoolShare: 0,
    awaitingCount: 0,
    awaitingAmount: 0,
    awaitingGross: 0,
    reportedCount: 0,
    reportedAmount: 0,
    reportedGross: 0,
    rejectedCount: 0,
    rejectedAmount: 0,
    rejectedGross: 0,
    refundPendingCount: 0,
    refundPendingAmount: 0,
    refundPendingGross: 0,
    pendingPayable: 0,
    pendingGross: 0,
  };
}

export function addPaymentBucket(
  buckets: PaymentBucketAmounts,
  status: StaffPaymentStatus | string,
  amounts: number | RegistrationFeeParts,
): void {
  const parts: RegistrationFeeParts = typeof amounts === "number"
    ? { tejas: amounts, gross: 0, schoolShare: 0 }
    : amounts;
  if (status === "confirmed") {
    buckets.confirmedCount += 1;
    buckets.confirmedAmount += parts.tejas;
    buckets.confirmedGross += parts.gross;
    buckets.confirmedSchoolShare += parts.schoolShare;
    return;
  }
  if (status === "rejected") {
    buckets.rejectedCount += 1;
    buckets.rejectedAmount += parts.tejas;
    buckets.rejectedGross += parts.gross;
    return;
  }
  if (status === "refund_pending") {
    buckets.refundPendingCount += 1;
    buckets.refundPendingAmount += parts.tejas;
    buckets.refundPendingGross += parts.gross;
    return;
  }
  if (status === "reported") {
    buckets.reportedCount += 1;
    buckets.reportedAmount += parts.tejas;
    buckets.reportedGross += parts.gross;
    buckets.pendingPayable += parts.tejas;
    buckets.pendingGross += parts.gross;
    return;
  }
  // pending_instructions | awaiting_payment | future pending_*
  buckets.awaitingCount += 1;
  buckets.awaitingAmount += parts.tejas;
  buckets.awaitingGross += parts.gross;
  buckets.pendingPayable += parts.tejas;
  buckets.pendingGross += parts.gross;
}

export type ClassBreakdownRow = {
  classKey: string;
  classLabel: string;
  sort: number;
  /**
   * Count of registration records that include ≥1 student in this class.
   * A multi-class registration increments each touched class once — do not sum
   * this column across classes and treat the sum as total registration records.
   */
  registrationRecords: number;
  uniqueStudents: number;
  studentStreams: number;
  confirmedCount: number;
  /** Confirmed TEJAS share (allocated amountDue). */
  confirmedAmount: number;
  /** Confirmed gross (allocated saved grossTotal). */
  confirmedGross: number;
  pendingCount: number;
  /** Pending TEJAS share. */
  pendingAmount: number;
  /** Pending gross. */
  pendingGross: number;
  rejectedCount: number;
  /** Rejected TEJAS allocation (not received). */
  rejectedAmount: number;
  rejectedGross: number;
  refundPendingCount: number;
  refundPendingAmount: number;
  refundPendingGross: number;
};

/** Standard olympiad classes always shown in the class-wise table (zeros allowed). */
export const STANDARD_CLASS_NUMBERS = [3, 4, 5, 6, 7, 8, 9, 10] as const;

export function standardClassInfo(classNumber: number): ClassKeyInfo {
  return { key: `class-${classNumber}`, label: `Class ${classNumber}`, sort: classNumber };
}

export type StreamClassCell = number | "n/a";

export type StreamClassMatrixRow = {
  classNumber: number;
  classLabel: string;
  english: StreamClassCell;
  mathematics: StreamClassCell;
  technology: StreamClassCell;
};

export type StreamClassMatrix = {
  /** Human-readable scope (e.g. Confirmed + Pending under current filters). */
  scopeLabel: string;
  cardTotals: { english: number; mathematics: number; technology: number };
  rows: StreamClassMatrixRow[];
  columnTotals: { english: number; mathematics: number; technology: number };
  notes: string[];
};

/**
 * Unique students per stream and class.
 * Multi-stream students count once in each enrolled stream.
 * Future Tech cells for Classes 3–5 are N/A (not zero).
 */
export function buildStreamClassMatrix(
  placements: OlympiadPlacement[],
  options?: { scopeLabel?: string },
): StreamClassMatrix {
  const notes: string[] = [];
  const eng = new Map<number, Set<string>>();
  const math = new Map<number, Set<string>>();
  const tech = new Map<number, Set<string>>();
  let missingClass = 0;
  let futureTechOutsideRange = 0;

  const add = (map: Map<number, Set<string>>, classNumber: number, id: string) => {
    const set = map.get(classNumber) ?? new Set<string>();
    set.add(id);
    map.set(classNumber, set);
  };

  for (const placement of placements) {
    if (placement.classNumber == null) {
      missingClass += 1;
      continue;
    }
    const classNumber = placement.classNumber;
    for (const stream of placement.streams) {
      if (stream === "english") add(eng, classNumber, placement.id);
      else if (stream === "mathematics") add(math, classNumber, placement.id);
      else if (stream === "technology") {
        if (classNumber < 6) {
          futureTechOutsideRange += 1;
          continue;
        }
        add(tech, classNumber, placement.id);
      }
    }
  }

  if (missingClass > 0) {
    notes.push(`${missingClass} olympiad placement(s) omitted — class not identified.`);
  }
  if (futureTechOutsideRange > 0) {
    notes.push(
      `${futureTechOutsideRange} Future Tech placement(s) outside Classes 6–10 omitted from the table (not shown as zero).`,
    );
  }

  const rows: StreamClassMatrixRow[] = STANDARD_CLASS_NUMBERS.map((classNumber) => {
    const english = eng.get(classNumber)?.size ?? 0;
    const mathematics = math.get(classNumber)?.size ?? 0;
    const technology: StreamClassCell = classNumber < 6 ? "n/a" : (tech.get(classNumber)?.size ?? 0);
    return {
      classNumber,
      classLabel: `Class ${classNumber}`,
      english,
      mathematics,
      technology,
    };
  });

  const sumNumeric = (cells: StreamClassCell[]) =>
    cells.reduce<number>((sum, cell) => sum + (typeof cell === "number" ? cell : 0), 0);

  const columnTotals = {
    english: sumNumeric(rows.map((row) => row.english)),
    mathematics: sumNumeric(rows.map((row) => row.mathematics)),
    technology: sumNumeric(rows.map((row) => row.technology)),
  };

  return {
    scopeLabel: options?.scopeLabel ?? "Confirmed + Pending under current filters",
    cardTotals: { ...columnTotals },
    rows,
    columnTotals,
    notes,
  };
}

export function emptyClassBreakdown(info: ClassKeyInfo): ClassBreakdownRow {
  return {
    classKey: info.key,
    classLabel: info.label,
    sort: info.sort,
    registrationRecords: 0,
    uniqueStudents: 0,
    studentStreams: 0,
    confirmedCount: 0,
    confirmedAmount: 0,
    confirmedGross: 0,
    pendingCount: 0,
    pendingAmount: 0,
    pendingGross: 0,
    rejectedCount: 0,
    rejectedAmount: 0,
    rejectedGross: 0,
    refundPendingCount: 0,
    refundPendingAmount: 0,
    refundPendingGross: 0,
  };
}

export function mergeClassMetricIntoBreakdown(
  map: Map<string, ClassBreakdownRow>,
  metric: ClassMetric,
  status: StaffPaymentStatus | string,
): void {
  const row = map.get(metric.classKey) ?? emptyClassBreakdown({
    key: metric.classKey,
    label: metric.classLabel,
    sort: metric.sort,
  });
  row.registrationRecords += metric.registrationTouch;
  row.uniqueStudents += metric.uniqueStudents;
  row.studentStreams += metric.studentStreams;
  const tejas = metric.allocatedAmountDue;
  const gross = metric.allocatedGross ?? 0;
  if (status === "confirmed") {
    row.confirmedCount += 1;
    row.confirmedAmount += tejas;
    row.confirmedGross += gross;
  } else if (status === "rejected") {
    row.rejectedCount += 1;
    row.rejectedAmount += tejas;
    row.rejectedGross += gross;
  } else if (status === "refund_pending") {
    row.refundPendingCount += 1;
    row.refundPendingAmount += tejas;
    row.refundPendingGross += gross;
  } else {
    row.pendingCount += 1;
    row.pendingAmount += tejas;
    row.pendingGross += gross;
  }
  map.set(metric.classKey, row);
}

export function finalizeClassBreakdown(map: Map<string, ClassBreakdownRow>): ClassBreakdownRow[] {
  return [...map.values()].sort((a, b) => a.sort - b.sort || a.classLabel.localeCompare(b.classLabel));
}

/**
 * Always include Classes 3–10 (zero-filled). Keep Class Not Identified and any
 * other observed class keys from data. Does not invent classes outside data + 3–10.
 */
export function ensureStandardClassRows(rows: ClassBreakdownRow[]): ClassBreakdownRow[] {
  const map = new Map<string, ClassBreakdownRow>();
  for (const n of STANDARD_CLASS_NUMBERS) {
    const info = standardClassInfo(n);
    map.set(info.key, emptyClassBreakdown(info));
  }
  for (const row of rows) {
    const base = emptyClassBreakdown({ key: row.classKey, label: row.classLabel, sort: row.sort });
    map.set(row.classKey, {
      ...base,
      ...row,
      confirmedGross: row.confirmedGross ?? 0,
      pendingGross: row.pendingGross ?? 0,
      rejectedGross: row.rejectedGross ?? 0,
      refundPendingCount: row.refundPendingCount ?? 0,
      refundPendingAmount: row.refundPendingAmount ?? 0,
      refundPendingGross: row.refundPendingGross ?? 0,
    });
  }
  return finalizeClassBreakdown(map);
}

/** Sum class TEJAS amount buckets — reconciles with registration amountDue allocation. */
export function classBreakdownAmountTotal(rows: ClassBreakdownRow[]): number {
  return rows.reduce(
    (sum, row) =>
      sum + row.confirmedAmount + row.pendingAmount + row.rejectedAmount + (row.refundPendingAmount ?? 0),
    0,
  );
}

/** Sum class gross amount buckets — reconciles with registration grossTotal allocation. */
export function classBreakdownGrossTotal(rows: ClassBreakdownRow[]): number {
  return rows.reduce(
    (sum, row) =>
      sum + (row.confirmedGross ?? 0) + (row.pendingGross ?? 0) + (row.rejectedGross ?? 0) + (row.refundPendingGross ?? 0),
    0,
  );
}

/** Distinct school names (trimmed, case-insensitive) for school-channel rows. */
export function countUniqueSchoolNames(rows: Array<{ channel?: string | null; schoolName: string }>): number {
  const names = new Set<string>();
  for (const row of rows) {
    if ((row.channel ?? "school-registration") === "individual-registration") continue;
    const name = row.schoolName.trim().toLowerCase().replace(/\s+/g, " ");
    if (name) names.add(name);
  }
  return names.size;
}

export function paymentStatusLabel(status: StaffPaymentStatus | string): string {
  if (status === "confirmed") return "Payment Verified / Amount Received";
  if (status === "rejected") return "Rejected / Not Received";
  if (status === "refund_pending") return "Refund/Adjustment Pending";
  if (status === "reported") return "Proof Submitted / Verification Awaiting";
  if (status === "pending_instructions" || status === "awaiting_payment") return "Payment Pending";
  return String(status);
}

export function isAwaitingPaymentStatus(status: string): boolean {
  return status === "pending_instructions" || status === "awaiting_payment";
}

/** Pending for owner UI: awaiting payment instructions/transfer or proof submitted (reported). */
export function isPendingPaymentStatus(status: string): boolean {
  return (
    status === "pending_instructions" ||
    status === "awaiting_payment" ||
    status === "reported" ||
    (status.startsWith("pending_") && status !== "refund_pending")
  );
}

/**
 * Statuses included in the main Class-wise registration table.
 * Rejected and refund/adjustment remain in source data and overview cards, but are excluded here.
 */
export function isMainClassTableStatus(status: string): boolean {
  return status === "confirmed" || isPendingPaymentStatus(status);
}

/** Confirmed TEJAS + pending TEJAS from class rows (excludes rejected/refund columns). */
export function classBreakdownMainTejasTotal(rows: ClassBreakdownRow[]): number {
  return rows.reduce((sum, row) => sum + row.confirmedAmount + row.pendingAmount, 0);
}

/** Confirmed gross + pending gross from class rows. */
export function classBreakdownMainGrossTotal(rows: ClassBreakdownRow[]): number {
  return rows.reduce((sum, row) => sum + (row.confirmedGross ?? 0) + (row.pendingGross ?? 0), 0);
}

export type FilterableStaffRow = {
  schoolName: string;
  channel?: string | null;
  paymentStatus: string;
  amountDue: number;
  grossTotal: number;
  schoolShare: number;
  uniqueStudentCount: number;
  studentCount: number;
  studentStreamRegistrations: number;
  englishCount?: number;
  mathematicsCount?: number;
  technologyCount?: number;
  classMetrics: ClassMetric[];
};

/**
 * When a class filter is active, scope each registration to that class’s allocated
 * students / streams / amount so card totals match the class-wise row.
 */
export function scopeFilterableRowsToClass(
  rows: FilterableStaffRow[],
  classKey: string,
): FilterableStaffRow[] {
  if (classKey === "all") return rows;
  const scoped: FilterableStaffRow[] = [];
  for (const row of rows) {
    const metric = (row.classMetrics ?? []).find((item) => item.classKey === classKey);
    if (!metric) continue;
    const streamShare = row.studentStreamRegistrations > 0
      ? metric.studentStreams / row.studentStreamRegistrations
      : 0;
    scoped.push({
      ...row,
      amountDue: metric.allocatedAmountDue,
      grossTotal: metric.allocatedGross ?? Math.round(row.grossTotal * streamShare),
      schoolShare: metric.allocatedSchoolShare ?? Math.round(row.schoolShare * streamShare),
      uniqueStudentCount: metric.uniqueStudents,
      studentCount: metric.uniqueStudents,
      studentStreamRegistrations: metric.studentStreams,
      englishCount: undefined,
      mathematicsCount: undefined,
      technologyCount: undefined,
      classMetrics: [metric],
    });
  }
  return scoped;
}

/** Recompute overview buckets from already server-authored row fields (same formulas as staffSnapshot). */
export function summarizeFilterableRows(rows: FilterableStaffRow[]): {
  schools: number;
  uniqueSchools: number;
  schoolRegistrations: number;
  individualRegistrations: number;
  uniqueStudents: number;
  studentStreams: number;
  englishEntries: number;
  mathematicsEntries: number;
  technologyEntries: number;
  amountDue: number;
  grossCollected: number;
  schoolShare: number;
  /** Confirmed TEJAS remittance only (saved amountDue). */
  amountReceived: number;
  /** Confirmed saved grossTotal only. */
  confirmedGrossReceived: number;
  /** Confirmed saved schoolShare only. */
  confirmedSchoolShare: number;
  pendingPayable: number;
  pendingGross: number;
  awaitingPaymentCount: number;
  awaitingPaymentAmount: number;
  awaitingPaymentGross: number;
  reportedCount: number;
  reportedAmount: number;
  reportedGross: number;
  confirmedCount: number;
  rejectedCount: number;
  rejectedPayable: number;
  rejectedGross: number;
  refundPendingCount: number;
  refundPendingAmount: number;
  refundPendingGross: number;
  rejectedOrRefund: number;
  payments: Record<string, number>;
  classBreakdown: ClassBreakdownRow[];
} {
  const buckets = emptyPaymentBuckets();
  const payments: Record<string, number> = {};
  const classMap = new Map<string, ClassBreakdownRow>();
  let amountDue = 0;
  let grossCollected = 0;
  let schoolShare = 0;
  let uniqueStudents = 0;
  let studentStreams = 0;
  let englishEntries = 0;
  let mathematicsEntries = 0;
  let technologyEntries = 0;
  let schoolRegistrations = 0;
  let individualRegistrations = 0;
  for (const row of rows) {
    payments[row.paymentStatus] = (payments[row.paymentStatus] ?? 0) + 1;
    amountDue += row.amountDue;
    grossCollected += row.grossTotal;
    schoolShare += row.schoolShare;
    uniqueStudents += row.uniqueStudentCount ?? row.studentCount;
    studentStreams += row.studentStreamRegistrations;
    englishEntries += row.englishCount ?? 0;
    mathematicsEntries += row.mathematicsCount ?? 0;
    technologyEntries += row.technologyCount ?? 0;
    if (row.channel === "individual-registration") individualRegistrations += 1;
    else schoolRegistrations += 1;
    addPaymentBucket(buckets, row.paymentStatus, {
      tejas: row.amountDue,
      gross: row.grossTotal,
      schoolShare: row.schoolShare,
    });
    for (const metric of row.classMetrics ?? []) {
      mergeClassMetricIntoBreakdown(classMap, metric, row.paymentStatus);
    }
  }
  return {
    schools: rows.length,
    uniqueSchools: countUniqueSchoolNames(rows),
    schoolRegistrations,
    individualRegistrations,
    uniqueStudents,
    studentStreams,
    englishEntries,
    mathematicsEntries,
    technologyEntries,
    amountDue,
    grossCollected,
    schoolShare,
    amountReceived: buckets.confirmedAmount,
    confirmedGrossReceived: buckets.confirmedGross,
    confirmedSchoolShare: buckets.confirmedSchoolShare,
    pendingPayable: buckets.pendingPayable,
    pendingGross: buckets.pendingGross,
    awaitingPaymentCount: buckets.awaitingCount,
    awaitingPaymentAmount: buckets.awaitingAmount,
    awaitingPaymentGross: buckets.awaitingGross,
    reportedCount: buckets.reportedCount,
    reportedAmount: buckets.reportedAmount,
    reportedGross: buckets.reportedGross,
    confirmedCount: buckets.confirmedCount,
    rejectedCount: buckets.rejectedCount,
    rejectedPayable: buckets.rejectedAmount,
    rejectedGross: buckets.rejectedGross,
    refundPendingCount: buckets.refundPendingCount,
    refundPendingAmount: buckets.refundPendingAmount,
    refundPendingGross: buckets.refundPendingGross,
    rejectedOrRefund: buckets.rejectedCount + buckets.refundPendingCount,
    payments,
    classBreakdown: ensureStandardClassRows(finalizeClassBreakdown(classMap)),
  };
}
