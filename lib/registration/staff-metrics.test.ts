import assert from "node:assert/strict";
import test from "node:test";
import {
  classWiseCounts,
  countStreamRegistrations,
  countUniqueStudents,
  reconcileFeeWithSaved,
  studentIdentityKey,
  streamFeeLines,
} from "@/lib/registration/staff-metrics";
import type { StudentRecord } from "@/lib/registration/sheet";

function student(partial: Partial<StudentRecord> & Pick<StudentRecord, "fullName" | "streams">): StudentRecord {
  return {
    row: partial.row ?? 2,
    fullName: partial.fullName,
    parentName: partial.parentName ?? "Parent One",
    parentMobile: partial.parentMobile ?? "9876543210",
    parentEmail: partial.parentEmail ?? "parent@example.test",
    dateOfBirth: partial.dateOfBirth ?? "15-08-2015",
    classLabel: partial.classLabel ?? "V",
    classNumber: partial.classNumber ?? 5,
    section: partial.section ?? "A",
    rollNumber: partial.rollNumber ?? "1",
    schoolName: partial.schoolName ?? "Example School",
    streams: partial.streams,
  };
}

test("unique students count multi-stream rows once", () => {
  const rows = [
    student({ fullName: "Ada Lovelace", streams: ["english"], rollNumber: "1" }),
    student({ fullName: "Ada Lovelace", streams: ["mathematics"], rollNumber: "1" }),
    student({ fullName: "Ada Lovelace", streams: ["technology"], rollNumber: "1", classLabel: "VI", classNumber: 6 }),
  ];
  const unique = countUniqueStudents(rows);
  assert.equal(unique.unique, 1);
  assert.equal(unique.rowCount, 3);
  const streams = countStreamRegistrations(rows);
  assert.deepEqual(streams, { english: 1, mathematics: 1, technology: 1, total: 3 });
  const fees = streamFeeLines(streams);
  assert.equal(fees.reduce((sum, line) => sum + line.tejasPayable, 0), 360);
  assert.equal(fees.reduce((sum, line) => sum + line.gross, 0), 450);
});

test("different parent mobile keeps two unique students with same name and DOB", () => {
  const rows = [
    student({ fullName: "Same Name", parentMobile: "9876543210", streams: ["english"] }),
    student({ fullName: "Same Name", parentMobile: "9876543211", streams: ["english"], rollNumber: "2" }),
  ];
  assert.notEqual(studentIdentityKey(rows[0]), studentIdentityKey(rows[1]));
  const unique = countUniqueStudents(rows);
  assert.equal(unique.unique, 2);
  assert.ok(unique.ambiguousNotes.length >= 1);
});

test("class-wise counts unique students per class", () => {
  const rows = [
    student({ fullName: "One", streams: ["english"], classLabel: "V", classNumber: 5 }),
    student({ fullName: "One", streams: ["mathematics"], classLabel: "V", classNumber: 5 }),
    student({ fullName: "Two", streams: ["english"], classLabel: "VI", classNumber: 6, rollNumber: "2" }),
  ];
  assert.deepEqual(classWiseCounts(rows), { V: 1, VI: 1 });
});

test("reconcileFeeWithSaved matches approved share breakdown", () => {
  const counts = { english: 2, mathematics: 1, technology: 0, total: 3 };
  const result = reconcileFeeWithSaved(counts, {
    studentStreamRegistrations: 3,
    totalStudentFees: 450,
    payableToTejas: 360,
    schoolShare: 90,
    schoolShareApproved: true,
    registrationSchoolShare: 90,
    registrationPayable: 360,
    amountDue: 360,
    grossTotal: 450,
  });
  assert.equal(result.ok, true);
});
