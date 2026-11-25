import assert from "node:assert/strict";
import test from "node:test";
import {
  STANDARD_CLASS_NUMBERS,
  addPaymentBucket,
  classBreakdownAmountTotal,
  classKeyForStudent,
  classMetricsForRegistration,
  classWiseCounts,
  countStreamRegistrations,
  countUniqueStudents,
  emptyPaymentBuckets,
  ensureStandardClassRows,
  finalizeClassBreakdown,
  mergeClassMetricIntoBreakdown,
  reconcileFeeWithSaved,
  scopeFilterableRowsToClass,
  studentIdentityKey,
  streamFeeLines,
  summarizeFilterableRows,
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

test("classKeyForStudent uses stored classNumber/label only", () => {
  assert.equal(classKeyForStudent({ classNumber: 7, classLabel: "VII" }).key, "class-7");
  assert.equal(classKeyForStudent({ classNumber: null as unknown as number, classLabel: "" }).label, "Class Not Identified");
});

test("classMetrics allocates amountDue by stream weight without double-counting unique students", () => {
  const students = [
    student({ fullName: "Ada", streams: ["english", "mathematics"], classLabel: "V", classNumber: 5 }),
    student({ fullName: "Ben", streams: ["english"], classLabel: "VI", classNumber: 6, rollNumber: "2", parentMobile: "9999999999" }),
  ];
  // Ada has 2 streams in class 5, Ben 1 in class 6 → 240 + 120 = 360
  const metrics = classMetricsForRegistration(students, 360);
  assert.equal(metrics.length, 2);
  const five = metrics.find((row) => row.classKey === "class-5");
  const six = metrics.find((row) => row.classKey === "class-6");
  assert.equal(five?.uniqueStudents, 1);
  assert.equal(five?.studentStreams, 2);
  assert.equal(five?.allocatedAmountDue, 240);
  assert.equal(six?.allocatedAmountDue, 120);
  assert.equal(metrics.reduce((sum, row) => sum + row.allocatedAmountDue, 0), 360);
});

test("payment buckets keep confirmed, reported, pending, rejected and refund_pending separate", () => {
  const buckets = emptyPaymentBuckets();
  addPaymentBucket(buckets, "confirmed", 120);
  addPaymentBucket(buckets, "reported", 480);
  addPaymentBucket(buckets, "awaiting_payment", 480);
  addPaymentBucket(buckets, "rejected", 240);
  addPaymentBucket(buckets, "refund_pending", 360);
  assert.equal(buckets.confirmedAmount, 120);
  assert.equal(buckets.reportedAmount, 480);
  assert.equal(buckets.awaitingAmount, 480);
  assert.equal(buckets.pendingPayable, 960);
  assert.equal(buckets.rejectedAmount, 240);
  assert.equal(buckets.refundPendingAmount, 360);
  assert.equal(
    buckets.confirmedAmount + buckets.pendingPayable + buckets.rejectedAmount + buckets.refundPendingAmount,
    1680,
  );
  // refund_pending must never inflate confirmed received
  assert.equal(buckets.confirmedAmount, 120);
});

test("ensureStandardClassRows always includes Classes 3–10 including zeros", () => {
  const padded = ensureStandardClassRows([]);
  assert.equal(padded.length, STANDARD_CLASS_NUMBERS.length);
  for (const n of STANDARD_CLASS_NUMBERS) {
    const row = padded.find((item) => item.classKey === `class-${n}`);
    assert.ok(row, `missing Class ${n}`);
    assert.equal(row!.registrationRecords, 0);
    assert.equal(row!.uniqueStudents, 0);
    assert.equal(row!.studentStreams, 0);
  }
  const withData = ensureStandardClassRows([
    {
      classKey: "class-5",
      classLabel: "Class 5",
      sort: 5,
      registrationRecords: 2,
      uniqueStudents: 3,
      studentStreams: 4,
      confirmedCount: 1,
      confirmedAmount: 120,
      pendingCount: 1,
      pendingAmount: 240,
      rejectedCount: 0,
      rejectedAmount: 0,
      refundPendingCount: 0,
      refundPendingAmount: 0,
    },
    {
      classKey: "ni",
      classLabel: "Class Not Identified",
      sort: 999,
      registrationRecords: 1,
      uniqueStudents: 1,
      studentStreams: 1,
      confirmedCount: 0,
      confirmedAmount: 0,
      pendingCount: 1,
      pendingAmount: 120,
      rejectedCount: 0,
      rejectedAmount: 0,
      refundPendingCount: 0,
      refundPendingAmount: 0,
    },
  ]);
  assert.ok(withData.find((row) => row.classKey === "class-3")?.uniqueStudents === 0);
  assert.equal(withData.find((row) => row.classKey === "class-5")?.uniqueStudents, 3);
  assert.ok(withData.find((row) => row.classKey === "ni"));
});

test("registration records vs unique students vs student-streams stay distinct", () => {
  // One registration, two unique students, three student-streams (one multi-stream)
  const students = [
    student({ fullName: "Ada", streams: ["english", "mathematics"], classNumber: 5, classLabel: "V" }),
    student({ fullName: "Ben", streams: ["english"], classNumber: 5, classLabel: "V", parentMobile: "9000000002", rollNumber: "2" }),
  ];
  const metrics = classMetricsForRegistration(students, 360);
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0]!.registrationTouch, 1);
  assert.equal(metrics[0]!.uniqueStudents, 2);
  assert.equal(metrics[0]!.studentStreams, 3);
  const summary = summarizeFilterableRows([
    {
      schoolName: "School A",
      channel: "school-registration",
      paymentStatus: "confirmed",
      amountDue: 360,
      grossTotal: 450,
      schoolShare: 90,
      uniqueStudentCount: 2,
      studentCount: 2,
      studentStreamRegistrations: 3,
      englishCount: 2,
      mathematicsCount: 1,
      classMetrics: metrics,
    },
  ]);
  assert.equal(summary.schools, 1);
  assert.equal(summary.uniqueStudents, 2);
  assert.equal(summary.studentStreams, 3);
  const class5 = summary.classBreakdown.find((row) => row.classKey === "class-5");
  assert.equal(class5!.registrationRecords, 1);
  assert.equal(class5!.uniqueStudents, 2);
  assert.equal(class5!.studentStreams, 3);
  // Summing registrationRecords across classes must not be treated as unique students
  assert.notEqual(class5!.registrationRecords, class5!.uniqueStudents);
});

test("summarizeFilterableRows reconciles class totals with overall buckets", () => {
  const studentsA = [
    student({ fullName: "A", streams: ["english"], classNumber: 5, classLabel: "V" }),
  ];
  const studentsB = [
    student({ fullName: "B", streams: ["mathematics"], classNumber: 5, classLabel: "V", parentMobile: "9000000001" }),
  ];
  const metricsA = classMetricsForRegistration(studentsA, 120);
  const metricsB = classMetricsForRegistration(studentsB, 120);
  const summary = summarizeFilterableRows([
    {
      schoolName: "School A",
      channel: "school-registration",
      paymentStatus: "confirmed",
      amountDue: 120,
      grossTotal: 150,
      schoolShare: 30,
      uniqueStudentCount: 1,
      studentCount: 1,
      studentStreamRegistrations: 1,
      englishCount: 1,
      classMetrics: metricsA,
    },
    {
      schoolName: "School B",
      channel: "school-registration",
      paymentStatus: "reported",
      amountDue: 120,
      grossTotal: 150,
      schoolShare: 30,
      uniqueStudentCount: 1,
      studentCount: 1,
      studentStreamRegistrations: 1,
      mathematicsCount: 1,
      classMetrics: metricsB,
    },
  ]);
  assert.equal(summary.confirmedCount, 1);
  assert.equal(summary.amountReceived, 120);
  assert.equal(summary.reportedCount, 1);
  assert.equal(summary.reportedAmount, 120);
  assert.equal(summary.pendingPayable, 120);
  for (const n of STANDARD_CLASS_NUMBERS) {
    assert.ok(summary.classBreakdown.find((row) => row.classKey === `class-${n}`));
  }
  const class5 = summary.classBreakdown.find((row) => row.classKey === "class-5");
  assert.ok(class5);
  assert.equal(class5!.registrationRecords, 2);
  assert.equal(class5!.uniqueStudents, 2);
  assert.equal(class5!.studentStreams, 2);
  assert.equal(class5!.confirmedAmount + class5!.pendingAmount + class5!.rejectedAmount, 240);
  assert.equal(classBreakdownAmountTotal(summary.classBreakdown), summary.amountDue);
  const map = new Map();
  for (const metric of [...metricsA, ...metricsB]) mergeClassMetricIntoBreakdown(map, metric, "confirmed");
  assert.equal(finalizeClassBreakdown(map).length >= 1, true);
});

test("rejected and refund_pending do not double-count in class breakdown", () => {
  const students = [student({ fullName: "R", streams: ["english"], classNumber: 7, classLabel: "VII" })];
  const metrics = classMetricsForRegistration(students, 120);
  const summary = summarizeFilterableRows([
    {
      schoolName: "Rejected School",
      channel: "school-registration",
      paymentStatus: "rejected",
      amountDue: 120,
      grossTotal: 150,
      schoolShare: 30,
      uniqueStudentCount: 1,
      studentCount: 1,
      studentStreamRegistrations: 1,
      classMetrics: metrics,
    },
    {
      schoolName: "Refund School",
      channel: "school-registration",
      paymentStatus: "refund_pending",
      amountDue: 120,
      grossTotal: 150,
      schoolShare: 30,
      uniqueStudentCount: 1,
      studentCount: 1,
      studentStreamRegistrations: 1,
      classMetrics: classMetricsForRegistration(
        [student({ fullName: "F", streams: ["mathematics"], classNumber: 7, classLabel: "VII", parentMobile: "9000000099" })],
        120,
      ),
    },
  ]);
  assert.equal(summary.amountReceived, 0);
  assert.equal(summary.rejectedCount, 1);
  assert.equal(summary.rejectedPayable, 120);
  assert.equal(summary.refundPendingCount, 1);
  assert.equal(summary.refundPendingAmount, 120);
  const class7 = summary.classBreakdown.find((row) => row.classKey === "class-7");
  assert.equal(class7!.rejectedCount, 1);
  assert.equal(class7!.rejectedAmount, 120);
  assert.equal(class7!.refundPendingCount, 1);
  assert.equal(class7!.refundPendingAmount, 120);
  assert.equal(class7!.confirmedAmount, 0);
});

test("class filter scopes overview to that class so cards reconcile with the class row", () => {
  const metrics = classMetricsForRegistration(
    [
      student({ fullName: "Ada", streams: ["english", "mathematics"], classNumber: 5, classLabel: "V" }),
      student({ fullName: "Ben", streams: ["english"], classNumber: 6, classLabel: "VI", parentMobile: "9000000003", rollNumber: "2" }),
    ],
    360,
  );
  const rows = [
    {
      schoolName: "Mixed School",
      channel: "school-registration" as const,
      paymentStatus: "confirmed",
      amountDue: 360,
      grossTotal: 450,
      schoolShare: 90,
      uniqueStudentCount: 2,
      studentCount: 2,
      studentStreamRegistrations: 3,
      classMetrics: metrics,
    },
  ];
  const all = summarizeFilterableRows(rows);
  assert.equal(all.uniqueStudents, 2);
  assert.equal(all.studentStreams, 3);
  assert.equal(all.amountReceived, 360);
  const scoped = summarizeFilterableRows(scopeFilterableRowsToClass(rows, "class-5"));
  const class5 = scoped.classBreakdown.find((row) => row.classKey === "class-5");
  assert.equal(scoped.schools, 1);
  assert.equal(scoped.uniqueStudents, 1);
  assert.equal(scoped.studentStreams, 2);
  assert.equal(scoped.amountReceived, 240);
  assert.equal(class5!.uniqueStudents, scoped.uniqueStudents);
  assert.equal(class5!.studentStreams, scoped.studentStreams);
  assert.equal(class5!.confirmedAmount, scoped.amountReceived);
});
