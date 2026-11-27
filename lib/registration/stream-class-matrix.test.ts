import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import {
  buildStreamClassMatrix,
  olympiadPlacementsForStudents,
  studentIdentityKey,
} from "@/lib/registration/staff-metrics";
import type { StudentRecord } from "@/lib/registration/sheet";

function token(student: StudentRecord): string {
  return createHash("sha256").update(studentIdentityKey(student)).digest("hex").slice(0, 24);
}

function student(partial: Partial<StudentRecord> & Pick<StudentRecord, "fullName" | "classNumber" | "streams">): StudentRecord {
  return {
    row: 2,
    parentName: partial.parentName ?? "Parent",
    parentMobile: partial.parentMobile ?? "9000000001",
    parentEmail: "p@example.test",
    dateOfBirth: partial.dateOfBirth ?? "15-08-2015",
    classLabel: partial.classLabel ?? String(partial.classNumber),
    section: "A",
    rollNumber: "1",
    schoolName: "Sample",
    ...partial,
  };
}

test("multi-stream student counts once per stream; Future Tech N/A for classes 3–5", () => {
  const placements = olympiadPlacementsForStudents(
    [
      student({ fullName: "Ada", classNumber: 5, streams: ["english", "mathematics"] }),
      student({ fullName: "Bea", classNumber: 7, streams: ["english", "technology"] }),
      student({ fullName: "Ada", classNumber: 5, streams: ["english"], parentMobile: "9000000001" }), // same identity
    ],
    token,
  );
  const matrix = buildStreamClassMatrix(placements);
  assert.equal(matrix.cardTotals.english, 2);
  assert.equal(matrix.cardTotals.mathematics, 1);
  assert.equal(matrix.cardTotals.technology, 1);
  const class5 = matrix.rows.find((row) => row.classNumber === 5)!;
  assert.equal(class5.english, 1);
  assert.equal(class5.mathematics, 1);
  assert.equal(class5.technology, "n/a");
  const class7 = matrix.rows.find((row) => row.classNumber === 7)!;
  assert.equal(class7.english, 1);
  assert.equal(class7.technology, 1);
  assert.equal(matrix.columnTotals.english, matrix.cardTotals.english);
});

test("same identity across registrations dedupes; different parent mobile stays separate", () => {
  const a = token(
    student({ fullName: "Ada", classNumber: 6, streams: ["english"], parentMobile: "9000000001" }),
  );
  const b = token(
    student({ fullName: "Ada", classNumber: 6, streams: ["english"], parentMobile: "9000000002" }),
  );
  assert.notEqual(a, b);
  const matrix = buildStreamClassMatrix([
    { id: a, classNumber: 6, streams: ["english"] },
    { id: a, classNumber: 6, streams: ["english", "mathematics"] },
    { id: b, classNumber: 6, streams: ["english"] },
  ]);
  assert.equal(matrix.rows.find((row) => row.classNumber === 6)!.english, 2);
  assert.equal(matrix.rows.find((row) => row.classNumber === 6)!.mathematics, 1);
});

test("Future Tech in class 5 is noted and not shown as zero", () => {
  const matrix = buildStreamClassMatrix([
    { id: "x", classNumber: 5, streams: ["technology"] },
  ]);
  assert.equal(matrix.rows.find((row) => row.classNumber === 5)!.technology, "n/a");
  assert.equal(matrix.cardTotals.technology, 0);
  assert.ok(matrix.notes.some((note) => note.includes("Future Tech")));
});
