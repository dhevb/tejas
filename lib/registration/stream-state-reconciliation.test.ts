import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import {
  buildStreamClassMatrix,
  countStateGroupsForMainScope,
  isMainClassTableStatus,
  olympiadPlacementsForStudents,
  studentIdentityKey,
  studentStreamsTotalFromMatrix,
  sumStateGroupCounts,
} from "@/lib/registration/staff-metrics";
import type { StudentRecord } from "@/lib/registration/sheet";

function token(student: StudentRecord): string {
  return createHash("sha256").update(studentIdentityKey(student)).digest("hex").slice(0, 24);
}

function student(
  partial: Partial<StudentRecord> & Pick<StudentRecord, "fullName" | "classNumber" | "streams">,
): StudentRecord {
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

test("1. English + Mathematics counts once in each stream", () => {
  const placements = olympiadPlacementsForStudents(
    [student({ fullName: "Ada", classNumber: 8, streams: ["english", "mathematics"] })],
    token,
  );
  const matrix = buildStreamClassMatrix(placements);
  assert.equal(matrix.cardTotals.english, 1);
  assert.equal(matrix.cardTotals.mathematics, 1);
  assert.equal(matrix.studentStreamsByClass[8], 2);
});

test("2. Duplicate registration same student+stream does not inflate student-streams", () => {
  const id = token(student({ fullName: "Ada", classNumber: 6, streams: ["english"] }));
  const matrix = buildStreamClassMatrix([
    { id, classNumber: 6, streams: ["english"] },
    { id, classNumber: 6, streams: ["english"] },
  ]);
  assert.equal(matrix.cardTotals.english, 1);
  assert.equal(matrix.studentStreamsByClass[6], 1);
  assert.equal(matrix.studentStreamsTotal, 1);
});

test("3. Same name different parent mobile stay separate", () => {
  const a = token(
    student({ fullName: "Ada", classNumber: 6, streams: ["english"], parentMobile: "9000000001" }),
  );
  const b = token(
    student({ fullName: "Ada", classNumber: 6, streams: ["english"], parentMobile: "9000000002" }),
  );
  assert.notEqual(a, b);
  const matrix = buildStreamClassMatrix([
    { id: a, classNumber: 6, streams: ["english"] },
    { id: b, classNumber: 6, streams: ["english"] },
  ]);
  assert.equal(matrix.cardTotals.english, 2);
  assert.equal(matrix.studentStreamsTotal, 2);
});

test("4. Class-wise student-streams total equals sum of stream unique-student cards", () => {
  const placements = olympiadPlacementsForStudents(
    [
      student({ fullName: "Ada", classNumber: 5, streams: ["english", "mathematics"] }),
      student({ fullName: "Bea", classNumber: 7, streams: ["english", "technology"] }),
      student({ fullName: "Cara", classNumber: 8, streams: ["mathematics"] }),
      // duplicate Ada english across a second registration payload
      student({ fullName: "Ada", classNumber: 5, streams: ["english"], parentMobile: "9000000001" }),
    ],
    token,
  );
  // Flatten as two registration placement lists would appear after flatMap
  const matrix = buildStreamClassMatrix([
    ...placements,
    ...olympiadPlacementsForStudents(
      [student({ fullName: "Ada", classNumber: 5, streams: ["english"], parentMobile: "9000000001" })],
      token,
    ),
  ]);
  const classSum = [3, 4, 5, 6, 7, 8, 9, 10].reduce(
    (sum, n) => sum + (matrix.studentStreamsByClass[n] ?? 0),
    0,
  );
  const cardSum =
    matrix.cardTotals.english + matrix.cardTotals.mathematics + matrix.cardTotals.technology;
  assert.equal(classSum, cardSum);
  assert.equal(studentStreamsTotalFromMatrix(matrix), cardSum);
  assert.equal(matrix.studentStreamsTotal, cardSum);
});

test("5. Future Tech remains N/A for Classes 3–5", () => {
  const matrix = buildStreamClassMatrix([
    { id: "a", classNumber: 3, streams: ["english", "technology"] },
    { id: "b", classNumber: 5, streams: ["technology"] },
    { id: "c", classNumber: 6, streams: ["technology"] },
  ]);
  assert.equal(matrix.rows.find((r) => r.classNumber === 3)!.technology, "n/a");
  assert.equal(matrix.rows.find((r) => r.classNumber === 4)!.technology, "n/a");
  assert.equal(matrix.rows.find((r) => r.classNumber === 5)!.technology, "n/a");
  assert.equal(matrix.rows.find((r) => r.classNumber === 6)!.technology, 1);
  assert.equal(matrix.studentStreamsByClass[3], 1); // english only; FT omitted
  assert.equal(matrix.cardTotals.technology, 1);
});

test("6–10. State-wise includes confirmed/pending/reported; excludes rejected/refund", () => {
  const rows = [
    { paymentStatus: "confirmed", stateKey: "Delhi" },
    { paymentStatus: "confirmed", stateKey: "Delhi" },
    { paymentStatus: "pending_instructions", stateKey: "Punjab" },
    { paymentStatus: "awaiting_payment", stateKey: "Haryana" },
    { paymentStatus: "reported", stateKey: "Himachal Pradesh" },
    { paymentStatus: "rejected", stateKey: "Delhi" },
    { paymentStatus: "rejected", stateKey: "Punjab" },
    { paymentStatus: "refund_pending", stateKey: "Delhi" },
    { paymentStatus: "confirmed", stateKey: null },
  ];
  assert.equal(isMainClassTableStatus("confirmed"), true);
  assert.equal(isMainClassTableStatus("reported"), true);
  assert.equal(isMainClassTableStatus("pending_instructions"), true);
  assert.equal(isMainClassTableStatus("rejected"), false);
  assert.equal(isMainClassTableStatus("refund_pending"), false);

  const groups = countStateGroupsForMainScope(rows);
  const asMap = Object.fromEntries(groups);
  assert.equal(asMap.Delhi, 2); // rejected+refund excluded
  assert.equal(asMap.Punjab, 1);
  assert.equal(asMap.Haryana, 1);
  assert.equal(asMap["Himachal Pradesh"], 1);
  assert.equal(asMap["State/District Not Identified"], 1);
  assert.equal(sumStateGroupCounts(groups), 6);

  // Filter change: only Delhi rows in input → State-wise updates
  const delhiOnly = countStateGroupsForMainScope(rows.filter((r) => r.stateKey === "Delhi"));
  assert.equal(sumStateGroupCounts(delhiOnly), 2);
  assert.equal(Object.fromEntries(delhiOnly).Delhi, 2);
});

test("11. State/District Not Identified counts eligible missing location", () => {
  const groups = countStateGroupsForMainScope([
    { paymentStatus: "confirmed", stateKey: null },
    { paymentStatus: "pending_instructions", stateKey: undefined },
    { paymentStatus: "rejected", stateKey: null },
  ]);
  assert.equal(sumStateGroupCounts(groups), 2);
  assert.equal(Object.fromEntries(groups)["State/District Not Identified"], 2);
});
