import { FEE_SCHOOL, FEE_TEJAS, FEE_TOTAL, presentFee, type StoredFee } from "@/lib/registration/fee";
import type { StreamId } from "@/lib/registration/schema";
import type { StudentRecord } from "@/lib/registration/sheet";

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
