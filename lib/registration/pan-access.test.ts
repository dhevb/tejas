import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import {
  FULL_PAN_REVEAL_AVAILABLE,
  authorizePanReveal,
  panValueForExport,
  staffMayRevealFullPan,
  staffVisiblePan,
} from "@/lib/registration/pan-access";
import { consolidatedRegistrationWorkbook } from "@/lib/registration/consolidated-workbook";
import { registrationsToCsv } from "@/lib/registration/reports";
import type { RegistrationRecord } from "@/lib/registration/store";

const FULL_PAN = "ABCDE1234F";

function sampleRecord(): RegistrationRecord {
  return {
    reference: "TEJAS-2026-PANTEST00000000000001",
    createdAt: "2026-11-24T00:00:00.000Z",
    channel: "school-registration",
    uploadExt: "xlsx",
    receiptExt: null,
    school: {
      schoolName: "PAN Test School",
      schoolAddress: "1 Test Road",
      state: "Delhi",
      district: "New Delhi",
      city: "Delhi",
      pin: "110001",
      schoolEmail: "school@example.test",
      schoolMobile: "9000000000",
      schoolCategory: "private",
      previousParticipation: false,
      previousReference: null,
      pan: FULL_PAN,
      panHolder: "school",
      panDuplicate: false,
      principalName: "Principal",
      principalMobile: "9000000001",
      principalEmail: "principal@example.test",
      coordinatorName: "Coordinator",
      coordinatorMobile: "9000000002",
      coordinatorEmail: "coord@example.test",
      coordinatorDesignation: "Teacher",
      printedBooks: "no",
      bookQuantity: 0,
      ebookAccess: "no",
    },
    students: [
      {
        row: 2,
        fullName: "Student One",
        parentName: "Parent",
        parentMobile: "9111111111",
        parentEmail: "parent@example.test",
        dateOfBirth: "01-01-2014",
        classLabel: "V",
        classNumber: 5,
        section: "A",
        rollNumber: "1",
        schoolName: "PAN Test School",
        streams: ["english"],
      },
    ],
    fee: {
      studentStreamRegistrations: 1,
      totalStudentFees: 150,
      payableToTejas: 120,
      schoolShare: 30,
      schoolShareApproved: true,
      registrationSchoolShare: 30,
      registrationPayable: 120,
      amountDue: 120,
      grossTotal: 150,
      printedBookAmount: 0,
      bookSchoolShare: 0,
      bookPayable: 0,
      ebookAmount: 0,
    },
    payment: {
      status: "awaiting_payment",
      history: [],
      mode: null,
      paidOn: null,
      payerName: null,
      transactionReference: null,
      enteredUtr: null,
      extractedUtr: null,
      approvalMethod: null,
      reviewNote: null,
    },
  } as unknown as RegistrationRecord;
}

test("full PAN reveal is disabled until a trusted role model exists", () => {
  assert.equal(FULL_PAN_REVEAL_AVAILABLE, false);
  assert.equal(staffMayRevealFullPan(), false);
});

test("authorizePanReveal denies revealPan=yes without logging the PAN value", () => {
  const logs: string[] = [];
  const original = console.info;
  console.info = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };
  try {
    const decision = authorizePanReveal({
      requested: true,
      subject: "recovery",
      surface: "consolidated-xlsx",
      reference: "TEJAS-REF",
    });
    assert.equal(decision.reveal, false);
    assert.equal(decision.reason, "disabled_no_trusted_role");
    assert.ok(logs.some((line) => line.includes("staff pan reveal denied")));
    assert.ok(logs.every((line) => !line.includes(FULL_PAN)));
  } finally {
    console.info = original;
  }
});

test("staff detail payload never includes raw PAN while reveal is disabled", () => {
  const visible = staffVisiblePan(FULL_PAN);
  assert.equal(visible.pan, "ABCDE****F");
  assert.equal(visible.maskedPan, "ABCDE****F");
  assert.equal(visible.fullPanAvailable, false);
  assert.notEqual(visible.pan, FULL_PAN);
});

test("consolidated workbook stays masked even when revealPan option is true", () => {
  const bytes = consolidatedRegistrationWorkbook(sampleRecord(), { revealPan: true });
  const book = XLSX.read(bytes, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(book.Sheets["School Details"], { header: 1 }) as string[][];
  const joined = rows.map((row) => row.join("|")).join("\n");
  assert.equal(book.SheetNames.length, 7);
  assert.ok(!joined.includes(FULL_PAN));
  assert.ok(joined.includes("ABCDE****F"));
});

test("schools CSV stays masked when revealPan flag is true", () => {
  const csv = registrationsToCsv([sampleRecord()], "schools", true);
  assert.ok(!csv.includes(FULL_PAN));
  assert.ok(csv.includes("ABCDE****F"));
  assert.equal(panValueForExport(FULL_PAN, true), "ABCDE****F");
});
