import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import {
  COMPLETE_REGISTRATION_COLUMNS,
  COMPLETE_WORKBOOK_SHEET_NAME,
  SCHOOL_FORM_FIELD_COVERAGE,
  buildCompleteRegistrationWorkbook,
  completeWorkbookSheetNames,
} from "@/lib/registration/complete-registration-workbook";
import type { RegistrationRecord } from "@/lib/registration/store";

function fakeRecord(partial: {
  reference: string;
  status: RegistrationRecord["payment"]["status"];
  receiptExt?: RegistrationRecord["receiptExt"];
  state?: string;
  district?: string;
  city?: string;
  pin?: string;
  enteredUtr?: string | null;
  transactionReference?: string | null;
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
      state: partial.state ?? "Maharashtra",
      district: partial.district ?? "Pune",
      city: partial.city ?? "Pune",
      pin: partial.pin ?? "411001",
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
      transactionReference: "transactionReference" in partial ? (partial.transactionReference ?? null) : "UTR-TXN-001",
      reviewNote: null,
      mode: "UPI",
      paidOn: "2026-11-02",
      payerName: "Payer",
      enteredUtr: "enteredUtr" in partial ? (partial.enteredUtr ?? null) : "UTR-ENTERED-001",
      extractedUtr: "UTR-OCR-001",
      approvalMethod: "staff",
      verificationLabel: null,
      history: [{ at: "2026-11-02T12:00:00.000Z", status: partial.status, note: null, actor: "staff" }],
    },
  };
}

test("complete workbook has exactly one worksheet and covers every SchoolForm field", () => {
  const records = [
    fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA1", status: "confirmed" }),
    fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA2", status: "rejected", receiptExt: null }),
    fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA3", status: "refund_pending" }),
  ];
  const bytes = buildCompleteRegistrationWorkbook(records, {
    origin: "https://tejas.dhe.org.in",
    scopeLabel: "Scope: all 3 registration record(s).",
    fileAvailability: {
      "TEJAS-2026-AAAAAAAAAAAAAAA1": { uploadAvailable: true, receiptAvailable: true },
      "TEJAS-2026-AAAAAAAAAAAAAAA2": { uploadAvailable: true, receiptAvailable: false },
      "TEJAS-2026-AAAAAAAAAAAAAAA3": { uploadAvailable: true, receiptAvailable: true },
    },
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
  for (const item of SCHOOL_FORM_FIELD_COVERAGE) {
    assert.ok(header.includes(item.column), `SchoolForm.${item.field} missing as ${item.column}`);
  }
  const data = rows[2]!;
  assert.equal(data[header.indexOf("Stored state (original)")], "Maharashtra");
  assert.equal(data[header.indexOf("Stored district (original)")], "Pune");
  assert.equal(data[header.indexOf("Stored city (original)")], "Pune");
  assert.equal(data[header.indexOf("Stored PIN (original)")], "411001");
  assert.notEqual(data[header.indexOf("State (derived from address)")], undefined);
  assert.equal(data[header.indexOf("Transaction reference")], "UTR-TXN-001");
  assert.equal(data[header.indexOf("Entered UTR")], "UTR-ENTERED-001");
  assert.equal(data[header.indexOf("OCR-extracted UTR")], "UTR-OCR-001");
  assert.equal(String(data[header.indexOf("PAN (masked)")]), "ABCDE****F");
  assert.equal(String(data[header.indexOf("PAN (masked)")]).includes("1234"), false);
  assert.equal(String(data[header.indexOf("PAN (masked)")]).includes("ABCDE1234F"), false);
});

test("missing upload or receipt produces unavailable label without hyperlink", () => {
  const missingUpload = fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA4", status: "reported" });
  const missingReceipt = fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA5", status: "awaiting_payment", receiptExt: "jpg" });
  const present = fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA6", status: "confirmed" });
  const bytes = buildCompleteRegistrationWorkbook([missingUpload, missingReceipt, present], {
    origin: "https://tejas.dhe.org.in",
    fileAvailability: {
      "TEJAS-2026-AAAAAAAAAAAAAAA4": { uploadAvailable: false, receiptAvailable: true },
      "TEJAS-2026-AAAAAAAAAAAAAAA5": { uploadAvailable: true, receiptAvailable: false },
      "TEJAS-2026-AAAAAAAAAAAAAAA6": { uploadAvailable: true, receiptAvailable: true },
    },
  });
  const book = XLSX.read(bytes, { type: "buffer" });
  const sheet = book.Sheets[COMPLETE_WORKBOOK_SHEET_NAME]!;
  const uploadCol = COMPLETE_REGISTRATION_COLUMNS.indexOf("Student upload download");
  const receiptCol = COMPLETE_REGISTRATION_COLUMNS.indexOf("Payment proof download");

  const missingUploadCell = sheet[XLSX.utils.encode_cell({ r: 2, c: uploadCol })] as XLSX.CellObject;
  assert.equal(String(missingUploadCell.v), "Student upload unavailable");
  assert.equal(missingUploadCell.l, undefined);

  const missingReceiptCell = sheet[XLSX.utils.encode_cell({ r: 3, c: receiptCol })] as XLSX.CellObject;
  assert.equal(String(missingReceiptCell.v), "Payment proof unavailable");
  assert.equal(missingReceiptCell.l, undefined);

  const presentUpload = sheet[XLSX.utils.encode_cell({ r: 4, c: uploadCol })] as XLSX.CellObject;
  const presentReceipt = sheet[XLSX.utils.encode_cell({ r: 4, c: receiptCol })] as XLSX.CellObject;
  assert.ok(presentUpload.l?.Target?.startsWith("https://tejas.dhe.org.in/api/register/admin/registrations/"));
  assert.ok(presentUpload.l?.Target?.includes("kind=upload"));
  assert.ok(presentReceipt.l?.Target?.includes("kind=receipt"));
  assert.ok(!JSON.stringify(book).includes("service_role"));
  assert.ok(!String(presentUpload.l?.Target ?? "").includes("supabase"));
});

test("complete workbook keeps gross, school share and TEJAS remittance independent", () => {
  const bytes = buildCompleteRegistrationWorkbook(
    [fakeRecord({ reference: "TEJAS-2026-AAAAAAAAAAAAAAA7", status: "confirmed" })],
    {
      origin: "https://tejas.dhe.org.in",
      fileAvailability: {
        "TEJAS-2026-AAAAAAAAAAAAAAA7": { uploadAvailable: true, receiptAvailable: true },
      },
    },
  );
  const book = XLSX.read(bytes, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<string[]>(book.Sheets[COMPLETE_WORKBOOK_SHEET_NAME]!, { header: 1 }) as string[][];
  const header = rows[1]!;
  const row = rows[2]!;
  assert.equal(row[header.indexOf("Gross amount (grossTotal)")], 150);
  assert.equal(row[header.indexOf("School share (schoolShare)")], 30);
  assert.equal(row[header.indexOf("TEJAS remittance (amountDue)")], 120);
});

test("blank stored geo fields stay blank and are not invented from address", () => {
  const record = fakeRecord({
    reference: "TEJAS-2026-AAAAAAAAAAAAAAA8",
    status: "confirmed",
    state: "",
    district: "",
    city: "",
    pin: "",
  });
  const bytes = buildCompleteRegistrationWorkbook([record], {
    origin: "https://tejas.dhe.org.in",
    fileAvailability: {
      "TEJAS-2026-AAAAAAAAAAAAAAA8": { uploadAvailable: true, receiptAvailable: false },
    },
  });
  const rows = XLSX.utils.sheet_to_json<string[]>(
    XLSX.read(bytes, { type: "buffer" }).Sheets[COMPLETE_WORKBOOK_SHEET_NAME]!,
    { header: 1 },
  ) as string[][];
  const header = rows[1]!;
  const row = rows[2]!;
  assert.equal(row[header.indexOf("Stored state (original)")], "");
  assert.equal(row[header.indexOf("Stored district (original)")], "");
  assert.equal(row[header.indexOf("Stored city (original)")], "");
  assert.equal(row[header.indexOf("Stored PIN (original)")], "");
  assert.ok(String(row[header.indexOf("State (derived from address)")]).length > 0);
});
