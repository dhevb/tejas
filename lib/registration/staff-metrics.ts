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
};

/**
 * Per-class metrics for one registration.
 * Amount is allocated from the saved registration amountDue by student-stream weight in each class.
 */
export function classMetricsForRegistration(students: StudentRecord[], amountDue: number): ClassMetric[] {
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
      allocatedAmountDue: amountDue,
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
      allocatedAmountDue: Math.round(amountDue * weight),
    });
  }
  // Fix rounding so class amounts sum to amountDue.
  if (rows.length > 0) {
    const sum = rows.reduce((n, row) => n + row.allocatedAmountDue, 0);
    const delta = amountDue - sum;
    if (delta !== 0) {
      const heaviest = [...rows].sort((a, b) => b.studentStreams - a.studentStreams || a.sort - b.sort)[0];
      heaviest.allocatedAmountDue += delta;
    }
  }
  return rows.sort((a, b) => a.sort - b.sort || a.classLabel.localeCompare(b.classLabel));
}

export type PaymentBucketAmounts = {
  confirmedCount: number;
  confirmedAmount: number;
  awaitingCount: number;
  awaitingAmount: number;
  reportedCount: number;
  reportedAmount: number;
  rejectedCount: number;
  rejectedAmount: number;
  refundPendingCount: number;
  refundPendingAmount: number;
  /** awaiting + reported (and any other unfinished pending_* except rejected/refund). */
  pendingPayable: number;
};

export function emptyPaymentBuckets(): PaymentBucketAmounts {
  return {
    confirmedCount: 0,
    confirmedAmount: 0,
    awaitingCount: 0,
    awaitingAmount: 0,
    reportedCount: 0,
    reportedAmount: 0,
    rejectedCount: 0,
    rejectedAmount: 0,
    refundPendingCount: 0,
    refundPendingAmount: 0,
    pendingPayable: 0,
  };
}

export function addPaymentBucket(buckets: PaymentBucketAmounts, status: StaffPaymentStatus | string, amountDue: number): void {
  if (status === "confirmed") {
    buckets.confirmedCount += 1;
    buckets.confirmedAmount += amountDue;
    return;
  }
  if (status === "rejected") {
    buckets.rejectedCount += 1;
    buckets.rejectedAmount += amountDue;
    return;
  }
  if (status === "refund_pending") {
    buckets.refundPendingCount += 1;
    buckets.refundPendingAmount += amountDue;
    return;
  }
  if (status === "reported") {
    buckets.reportedCount += 1;
    buckets.reportedAmount += amountDue;
    buckets.pendingPayable += amountDue;
    return;
  }
  // pending_instructions | awaiting_payment | future pending_*
  buckets.awaitingCount += 1;
  buckets.awaitingAmount += amountDue;
  buckets.pendingPayable += amountDue;
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
  confirmedAmount: number;
  pendingCount: number;
  pendingAmount: number;
  rejectedCount: number;
  rejectedAmount: number;
  refundPendingCount: number;
  refundPendingAmount: number;
};

/** Standard olympiad classes always shown in the class-wise table (zeros allowed). */
export const STANDARD_CLASS_NUMBERS = [3, 4, 5, 6, 7, 8, 9, 10] as const;

export function standardClassInfo(classNumber: number): ClassKeyInfo {
  return { key: `class-${classNumber}`, label: `Class ${classNumber}`, sort: classNumber };
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
    pendingCount: 0,
    pendingAmount: 0,
    rejectedCount: 0,
    rejectedAmount: 0,
    refundPendingCount: 0,
    refundPendingAmount: 0,
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
  const amount = metric.allocatedAmountDue;
  if (status === "confirmed") {
    row.confirmedCount += 1;
    row.confirmedAmount += amount;
  } else if (status === "rejected") {
    row.rejectedCount += 1;
    row.rejectedAmount += amount;
  } else if (status === "refund_pending") {
    row.refundPendingCount += 1;
    row.refundPendingAmount += amount;
  } else {
    row.pendingCount += 1;
    row.pendingAmount += amount;
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
    const existing = map.get(row.classKey);
    map.set(row.classKey, existing
      ? {
          ...row,
          refundPendingCount: row.refundPendingCount ?? 0,
          refundPendingAmount: row.refundPendingAmount ?? 0,
        }
      : {
          ...emptyClassBreakdown({ key: row.classKey, label: row.classLabel, sort: row.sort }),
          ...row,
          refundPendingCount: row.refundPendingCount ?? 0,
          refundPendingAmount: row.refundPendingAmount ?? 0,
        });
  }
  return finalizeClassBreakdown(map);
}

/** Sum class amount buckets — used to reconcile with registration amountDue allocation. */
export function classBreakdownAmountTotal(rows: ClassBreakdownRow[]): number {
  return rows.reduce(
    (sum, row) =>
      sum + row.confirmedAmount + row.pendingAmount + row.rejectedAmount + (row.refundPendingAmount ?? 0),
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
      grossTotal: Math.round(row.grossTotal * streamShare),
      schoolShare: Math.round(row.schoolShare * streamShare),
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
  amountReceived: number;
  pendingPayable: number;
  awaitingPaymentCount: number;
  awaitingPaymentAmount: number;
  reportedCount: number;
  reportedAmount: number;
  confirmedCount: number;
  rejectedCount: number;
  rejectedPayable: number;
  refundPendingCount: number;
  refundPendingAmount: number;
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
    addPaymentBucket(buckets, row.paymentStatus, row.amountDue);
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
    pendingPayable: buckets.pendingPayable,
    awaitingPaymentCount: buckets.awaitingCount,
    awaitingPaymentAmount: buckets.awaitingAmount,
    reportedCount: buckets.reportedCount,
    reportedAmount: buckets.reportedAmount,
    confirmedCount: buckets.confirmedCount,
    rejectedCount: buckets.rejectedCount,
    rejectedPayable: buckets.rejectedAmount,
    refundPendingCount: buckets.refundPendingCount,
    refundPendingAmount: buckets.refundPendingAmount,
    rejectedOrRefund: buckets.rejectedCount + buckets.refundPendingCount,
    payments,
    classBreakdown: ensureStandardClassRows(finalizeClassBreakdown(classMap)),
  };
}
