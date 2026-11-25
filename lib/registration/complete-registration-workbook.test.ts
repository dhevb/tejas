import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import {
  COMPLETE_REGISTRATION_COLUMNS,
  COMPLETE_WORKBOOK_SHEET_NAME,
  buildCompleteRegistrationWorkbook,
  completeWorkbookSheetNames,
} from "@/lib/registration/complete-registration-workbook";
import type { RegistrationRecord } from "@/lib/registration/store";

function fakeRecord(partial: {
  reference: string;
  status: RegistrationRecord["payment"]["status"];
  receiptExt?: RegistrationRecord["receiptExt"];
}): RegistrationRecord {
  return {
    reference: partial.reference,
    createdAt: "2026-11-01T10:00:00.000Z",
    channel: "school-registration",
    uploadExt: "xlsx",
    receiptExt: "receiptExt" in partial ? (partial.receiptExt ?? null) : "jpg",
    school: {
      schoolName: `School ${partial.reference}`,
      schoolAddress: "KV No.1, Pune, Maharashtra 411001",
      state: "",
      district: "",
      city: "",
      pin: "",
      pan: "ABCDE1234F",
      panHolder: "school",
      panDuplicate: false,
      schoolEmail: "school@example.test",
      schoolMobile: "9876543210",
      affiliationBoard: "CBSE",
      affiliationNumber: "123",
      schoolCategory: "Private",
      principalName: "Principal",
      principalMobile: "9876543211",
      principalEmail: "principal@example.test",
      principalDesignation: "Principal",
      coordinatorName: "Coordinator",
      coordinatorMobile: "9876543212",
      coordinatorEmail: "coord@example.test",
      coordinatorDesignation: "Teacher",
      previousParticipation: false,
      previousReference: null,
      printedBooks: "no",
      bookQuantity: 0,
      ebookAccess: "no",
      representativeName: null,
      representativeDesignation: null,
    },
    students: [
      {
        row: 2,
        fullName: "Ada",
        parentName: "Parent",
        parentMobile: "9000000001",
        parentEmail: "parent@example.test",
        dateOfBirth: "15-08-2015",
        classLabel: "V",
        classNumber: 5,
        section: "A",
        rollNumber: "1",
        schoolName: `School ${partial.reference}`,
        streams: ["english"],
      },
    ],
    fee: {
      studentStreamRegistrations: 1,
      totalStudentFees: 150,
      registrationSchoolShare: 30,
      registrationPayable: 120,
      payableToTejas: 120,
      schoolShare: 30,
      schoolShareApproved: true,
      printedBooks: 0,
      printedBookAmount: 0,
      bookSchoolShare: 0,
      bookPayable: 0,
      ebookAccess: 0,
      ebookAmount: 0,
      grossTotal: 150,
      amountDue: 120,
    },
    payment: {
      status: partial.status,
      transactionReference: "UTRTEST001",
      reviewNote: null,
      mode: "UPI",
      paidOn: "2026-11-02",
      payerName: "Payer",
      enteredUtr: "UTRTEST001",
      extractedUtr: "UTRTEST001",
      approvalMethod: "staff",
      verificationLabel: null,
      history: [{ at: "2026-11-02T12:00:00.000Z", status: partial.status, note: null, actor: "staff" }],
    },
  };
}

test("complete workbook has exactly one worksheet and one row per registration", () => {
  const records = [
    fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA1", status: "confirmed" }),
    fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA2", status: "rejected", receiptExt: null }),
    fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA3", status: "refund_pending" }),
  ];
  const bytes = buildCompleteRegistrationWorkbook(records, {
    origin: "https://tejas.example.test",
    scopeLabel: "Scope: all 3 registration record(s).",
  });
  assert.deepEqual(completeWorkbookSheetNames(bytes), [COMPLETE_WORKBOOK_SHEET_NAME]);
  const book = XLSX.read(bytes, { type: "buffer" });
  const sheet = book.Sheets[COMPLETE_WORKBOOK_SHEET_NAME]!;
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];
  assert.equal(rows.length, 5); // banner + header + 3 data
  const header = rows[1]!;
  for (const column of COMPLETE_REGISTRATION_COLUMNS) {
    assert.ok(header.includes(column), `missing column ${column}`);
  }
  const statuses = rows.slice(2).map((row) => row[header.indexOf("Payment status code")]);
  assert.deepEqual(statuses, ["confirmed", "rejected", "refund_pending"]);
});

test("complete workbook embeds owner-route hyperlinks and unavailable proof text", () => {
  const withProof = fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA4", status: "reported" });
  const withoutProof = fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA5", status: "awaiting_payment", receiptExt: null });
  const bytes = buildCompleteRegistrationWorkbook([withProof, withoutProof], {
    origin: "https://preview.example.test",
  });
  const book = XLSX.read(bytes, { type: "buffer" });
  const sheet = book.Sheets[COMPLETE_WORKBOOK_SHEET_NAME]!;
  const uploadCell = sheet[XLSX.utils.encode_cell({ r: 2, c: COMPLETE_REGISTRATION_COLUMNS.indexOf("Student upload download") })] as XLSX.CellObject;
  const proofCell = sheet[XLSX.utils.encode_cell({ r: 2, c: COMPLETE_REGISTRATION_COLUMNS.indexOf("Payment proof download") })] as XLSX.CellObject;
  const missingProof = sheet[XLSX.utils.encode_cell({ r: 3, c: COMPLETE_REGISTRATION_COLUMNS.indexOf("Payment proof download") })] as XLSX.CellObject;
  assert.ok(uploadCell.l?.Target?.includes("/api/register/admin/registrations/TEJAS-2026-AAAAAAAAAAAAAAA4/file?kind=upload"));
  assert.ok(proofCell.l?.Target?.includes("/api/register/admin/registrations/TEJAS-2026-AAAAAAAAAAAAAAA4/file?kind=receipt"));
  assert.equal(String(missingProof.v), "Payment proof unavailable");
  assert.equal(missingProof.l, undefined);
  assert.ok(!JSON.stringify(bytes).includes("service_role"));
  assert.ok(!String(uploadCell.l?.Target ?? "").includes("supabase"));
});

test("complete workbook keeps gross, school share and TEJAS remittance independent", () => {
  const bytes = buildCompleteRegistrationWorkbook(
    [fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA6", status: "confirmed" })],
    { origin: "https://tejas.example.test" },
  );
  const book = XLSX.read(bytes, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<string[]>(book.Sheets[COMPLETE_WORKBOOK_SHEET_NAME]!, { header: 1 }) as string[][];
  const header = rows[1]!;
  const row = rows[2]!;
  assert.equal(row[header.indexOf("Gross amount (grossTotal)")], 150);
  assert.equal(row[header.indexOf("School share (schoolShare)")], 30);
  assert.equal(row[header.indexOf("TEJAS remittance (amountDue)")], 120);
});
