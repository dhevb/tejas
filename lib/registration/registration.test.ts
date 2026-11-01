import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import * as XLSX from "xlsx";
import { adminConfigured, createSessionValue, sessionIsValid, tokenMatches } from "@/lib/registration/auth";
import { BOOK_PRICE, calculateFee, EBOOK_FEE, EBOOK_SALE_OPEN, FEE_SCHOOL, FEE_TEJAS, FEE_TOTAL, ONLINE_EXAM_APPROVED, SCHOOL_SHARE_APPROVED } from "@/lib/registration/fee";
import { maskPan, parseIndianMobile, parsePan, validateDob } from "@/lib/registration/fields";
import { OFFICIAL_BANK, officialPublicPayment } from "@/lib/registration/official-bank";
import { durableStorageConfigured, paymentProofsAccepted, serverKeyName } from "@/lib/registration/durable";
import { testSupabaseConnection } from "@/lib/registration/supabase-status";
import { writePaymentConfig } from "@/lib/registration/payment";
import { registrationsToCsv } from "@/lib/registration/reports";
import { buildTemplateBuffer, parseStudentSheet } from "@/lib/registration/sheet";
import { STUDENT_COLUMNS } from "@/lib/registration/schema";
import { detectReceipt } from "@/lib/registration/receipt";
import { readPaymentSubmission, readSchoolForm } from "@/lib/registration/school";
import { GET as publicGet } from "@/app/api/register/[reference]/route";
import { GET as paymentGet } from "@/app/api/register/payment/route";
import { POST as submitPost } from "@/app/api/register/submit/route";
import { GET as staffFileGet } from "@/app/api/register/admin/registrations/[reference]/file/route";
import { POST as receiptPost } from "@/app/api/register/[reference]/payment/route";
import { openBytes, sealBytes } from "@/lib/registration/seal";
import { listStoredRegistrations, readRegistration, staffSnapshot, toPublicSummary, updatePayment } from "@/lib/registration/store";

const dataDir = mkdtempSync(path.join(tmpdir(), "tejas-reg-"));
process.env.TEJAS_DATA_DIR = dataDir;
delete process.env.TEJAS_DATA_KEY;
delete process.env.TEJAS_ADMIN_TOKEN;
delete process.env.TEJAS_ACCEPT_PAYMENT_PROOF;
for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_ANON_KEY", "SUPABASE_DB_URL", "DATABASE_URL"]) {
  delete process.env[name];
}

const headers = STUDENT_COLUMNS.map((column) => column.header);
const SCHOOL = "River School";

function sheet(rows: (string | number)[][], bookType: "xlsx" | "xls" | "csv" = "xlsx"): Buffer {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([headers, ...rows]), "Students");
  return XLSX.write(book, { type: "buffer", bookType }) as Buffer;
}

function student(overrides: Partial<Record<(typeof STUDENT_COLUMNS)[number]["key"], string>> = {}): string[] {
  const base = {
    fullName: "Aarav Sharma",
    parentName: "Meera Sharma",
    parentMobile: "9898989898",
    parentEmail: "meera@example.test",
    dob: "15-08-2015",
    className: "V",
    section: "A",
    rollNumber: "1",
    schoolName: SCHOOL,
    streams: "TEJAS English",
  };
  return STUDENT_COLUMNS.map((column) => overrides[column.key] ?? base[column.key]);
}

function registrations(buffer: Buffer, name = "students.xlsx") {
  return parseStudentSheet(buffer, name, SCHOOL);
}

test("fee is ₹150 per student-stream and unapproved shares are not deducted", () => {
  assert.equal(FEE_TOTAL, 150);
  assert.equal(FEE_TEJAS, 150);
  assert.equal(FEE_SCHOOL, 0);
  assert.equal(SCHOOL_SHARE_APPROVED, false);
  assert.equal(ONLINE_EXAM_APPROVED, false);
  assert.equal(BOOK_PRICE, 170);
  assert.equal(EBOOK_FEE, 49);
  assert.equal(EBOOK_SALE_OPEN, false);
  const one = calculateFee(1);
  assert.deepEqual([one.totalStudentFees, one.payableToTejas, one.schoolShare, one.amountDue], [150, 150, 0, 150]);
  assert.equal(one.schoolShareApproved, false);
  const two = calculateFee(2);
  assert.deepEqual([two.totalStudentFees, two.payableToTejas, two.schoolShare], [300, 300, 0]);
  const three = calculateFee(3);
  assert.deepEqual([three.totalStudentFees, three.payableToTejas, three.schoolShare], [450, 450, 0]);
  const fifty = calculateFee(50);
  assert.equal(fifty.schoolShare, 0);
  const extras = calculateFee(4, { printedBooks: 2, ebookAccess: 3 });
  assert.equal(extras.totalStudentFees, 600);
  assert.equal(extras.printedBookAmount, 340);
  assert.equal(extras.ebookAmount, 0);
  assert.equal(extras.ebookAccess, 0);
  assert.equal(extras.amountDue, 940);
  const example = calculateFee(30, { printedBooks: 5, ebookAccess: 20 });
  assert.equal(example.totalStudentFees, 4500);
  assert.equal(example.printedBookAmount, 850);
  assert.equal(example.ebookAmount, 0);
  assert.equal(example.amountDue, 5350);
});

test("one, two, and three streams are counted separately", () => {
  const one = registrations(sheet([student()]));
  assert.equal(one.rowErrors.length, 0);
  assert.equal(one.fee?.studentStreamRegistrations, 1);
  const two = registrations(sheet([student({ streams: "TEJAS English, TEJAS Mathematics" })]));
  assert.equal(two.fee?.payableToTejas, 300);
  const three = registrations(sheet([student({ streams: "TEJAS English, TEJAS Mathematics, TEJAS Future Tech" })]));
  assert.equal(three.students[0]?.streams.length, 3);
  assert.equal(three.fee?.totalStudentFees, 450);
  assert.equal(three.fee?.payableToTejas, 450);
});

test("mixed students keep their own stream counts", () => {
  const parsed = registrations(sheet([
    student(),
    student({ fullName: "Kavya Iyer", parentName: "Arun Iyer", dob: "02-02-2014", rollNumber: "2", streams: "TEJAS Mathematics, TEJAS Future Tech" }),
    student({ fullName: "Neel Kapoor", parentName: "Sonia Kapoor", dob: "09-09-2013", className: "8", section: "B", rollNumber: "3", streams: "Future Tech" }),
  ]));
  assert.equal(parsed.rowErrors.length, 0);
  assert.equal(parsed.students.length, 3);
  assert.equal(parsed.fee?.studentStreamRegistrations, 4);
  assert.equal(parsed.fee?.payableToTejas, 600);
});

test("blank roll number, parent mobile, and parent email are rejected", () => {
  assert.match(registrations(sheet([student({ rollNumber: " " })])).rowErrors[0]?.messages.join(" ") ?? "", /Roll number/);
  assert.match(registrations(sheet([student({ parentMobile: "" })])).rowErrors[0]?.messages.join(" ") ?? "", /mobile/i);
  assert.match(registrations(sheet([student({ parentEmail: "not-an-email" })])).rowErrors[0]?.messages.join(" ") ?? "", /email/i);
});

test("missing, invalid, and out-of-range dates are rejected", () => {
  assert.equal(registrations(sheet([student({ dob: "" })])).rowErrors[0]?.messages.some((message) => /missing/i.test(message)), true);
  assert.equal(registrations(sheet([student({ dob: "31-02-2015" })])).rowErrors[0]?.messages.some((message) => /real calendar date/i.test(message)), true);
  assert.equal(validateDob("01-01-1990").ok, false);
  assert.equal(validateDob("15/08/2015").ok && validateDob("15/08/2015").ok ? (validateDob("15/08/2015") as { value: string }).value : "", "15-08-2015");
});

test("classes outside III–X are rejected for each selected stream", () => {
  for (const className of ["II", "2", "XI", "11"]) {
    const parsed = registrations(sheet([student({ className, streams: "TEJAS English, TEJAS Future Tech" })]));
    assert.equal(parsed.students.length, 0, className);
    assert.match(parsed.rowErrors[0]?.messages.join(" ") ?? "", /not eligible/);
    assert.match(parsed.rowErrors[0]?.messages.join(" ") ?? "", /TEJAS English/);
    assert.match(parsed.rowErrors[0]?.messages.join(" ") ?? "", /TEJAS Future Tech/);
  }
  assert.equal(registrations(sheet([student({ className: "III" })])).students.length, 1);
  assert.equal(registrations(sheet([student({ className: "10" })])).students.length, 1);
});

test("duplicate students and duplicate roll numbers are reported", () => {
  const same = registrations(sheet([student({ rollNumber: "4" }), student({ rollNumber: "9" })]));
  assert.equal(same.students.length, 0);
  assert.match(same.rowErrors.map((error) => error.messages.join(" ")).join(" "), /matches row|repeated/);
  const rolls = registrations(sheet([
    student({ rollNumber: "4" }),
    student({ fullName: "Kavya Iyer", parentName: "Arun Iyer", dob: "02-02-2014", rollNumber: "4" }),
  ]));
  assert.equal(rolls.students.length, 0);
  assert.match(rolls.rowErrors.map((error) => error.messages.join(" ")).join(" "), /Roll number 4/);
});

test("bad headers, unknown streams, blank names, and a different school are rejected", () => {
  const badHeaders = XLSX.utils.aoa_to_sheet([["Name", "Class"], ["Aarav", "5"]]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, badHeaders, "Students");
  const parsed = registrations(XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer);
  assert.match(parsed.formErrors[0] ?? "", /column headings|missing required columns/i);
  assert.match(registrations(sheet([student({ streams: "TEJAS Science" })])).rowErrors[0]?.messages.join(" ") ?? "", /not a TEJAS stream/);
  assert.match(registrations(sheet([student({ fullName: "" })])).rowErrors[0]?.messages.join(" ") ?? "", /blank/i);
  assert.match(registrations(sheet([student({ streams: "" })])).rowErrors[0]?.messages.join(" ") ?? "", /at least one stream/i);
  assert.match(registrations(sheet([student({ schoolName: "Another School" })])).rowErrors[0]?.messages.join(" ") ?? "", /does not match/);
});

test("the sample example row cannot be submitted", () => {
  const parsed = parseStudentSheet(buildTemplateBuffer(), "template.xlsx", "Example School");
  assert.equal(parsed.students.length, 0);
  assert.match(parsed.rowErrors[0]?.messages.join(" ") ?? "", /sample example/i);
  const headersInTemplate = XLSX.read(buildTemplateBuffer(), { type: "buffer" }).Sheets.Students;
  const first = XLSX.utils.sheet_to_json<string[]>(headersInTemplate, { header: 1 })[0] as string[];
  assert.deepEqual(first, headers);
});

test("csv and xls uploads use the same rules", () => {
  const row = student({ fullName: "Kabir Das", parentName: "Leela Das", dob: "20-01-2016" });
  const csv = registrations(sheet([row], "csv"), "students.csv");
  const xls = registrations(sheet([row], "xls"), "students.xls");
  assert.equal(csv.students.length, 1, csv.formErrors.join(" ") + csv.rowErrors.map((error) => error.messages.join(" ")).join(" "));
  assert.equal(xls.students.length, 1, xls.formErrors.join(" ") + xls.rowErrors.map((error) => error.messages.join(" ")).join(" "));
  assert.equal(csv.fee?.payableToTejas, 150);
  assert.equal(xls.fee?.payableToTejas, 150);
});

test("unsupported, oversized, and macro files are refused", () => {
  assert.match(registrations(Buffer.from("hello"), "notes.txt").formErrors[0] ?? "", /xlsx, \.xls, or \.csv/);
  const big = Buffer.alloc(10 * 1024 * 1024 + 1, 65);
  big[0] = 0x50;
  big[1] = 0x4b;
  assert.match(registrations(big, "students.xlsx").formErrors[0] ?? "", /10 MB/);
  const macro = Buffer.concat([buildTemplateBuffer(), Buffer.from("vbaProject")]);
  assert.match(registrations(macro, "students.xlsx").formErrors[0] ?? "", /macros/);
});

test("the authorised SBI account is published and proof upload stays closed", async () => {
  const shown = officialPublicPayment(paymentProofsAccepted());
  assert.equal(shown.detailsPublished, true);
  assert.equal(shown.proofsAccepted, false);
  assert.equal(shown.accountHolder, "Department of Holistic Education");
  assert.equal(shown.accountNumber, OFFICIAL_BANK.accountNumber);
  assert.equal(shown.accountNumber, "42529022841");
  assert.equal(shown.bankName, "State Bank of India");
  assert.equal(shown.branch, "Chandigarh Main Branch");
  assert.equal(shown.ifsc, "SBIN0000628");
  assert.equal(shown.upiId, "holisticeducation@sbi");
  assert.match(shown.message, /Payment-proof submission will open/);
  const error = await writePaymentConfig({
    activated: true,
    bankName: "Example Bank",
    accountHolder: "Test Holder",
    accountNumber: "123456789012",
    ifsc: "SBIN0001234",
    upiId: "demo@upi",
    extraInstructions: "",
  });
  assert.match(error ?? "", /Placeholder/);
});

const PAN = "AAACB2468H";

function schoolFields(body: FormData, pan = PAN) {
  body.set("schoolName", SCHOOL);
  body.set("schoolAddress", "12 Station Road, Mohali");
  body.set("state", "Punjab");
  body.set("district", "Sahibzada Ajit Singh Nagar");
  body.set("city", "Mohali");
  body.set("pin", "140301");
  body.set("pan", pan);
  body.set("schoolEmail", "office@river.example");
  body.set("schoolMobile", "9812345678");
  body.set("affiliationBoard", "CBSE");
  body.set("affiliationHasNumber", "yes");
  body.set("affiliationNumber", "1630123");
  body.set("schoolCategory", "Private");
  body.set("principalName", "Anita Verma");
  body.set("principalMobile", "9811111111");
  body.set("principalEmail", "principal@river.example");
  body.set("coordinatorName", "Rahul Mehta");
  body.set("coordinatorMobile", "9876543210");
  body.set("coordinatorEmail", "rahul@river.example");
  body.set("coordinatorDesignation", "Coordinator");
  body.set("previousParticipation", "yes");
  body.set("previousReference", "DHE-2025-14");
  body.set("printedBooks", "no");
  body.set("bookQuantity", "0");
  body.set("ebookAccess", "no");
  for (const key of ["accurate", "studentsChecked", "streamsCorrect", "feeUnderstood", "paymentGenuine", "authorised", "rules"]) {
    body.set(key, "yes");
  }
}

test("school fields, PAN, and Indian mobile numbers are checked", () => {
  assert.equal(parseIndianMobile("+91 98765 43210"), "9876543210");
  assert.equal(parseIndianMobile("1234567890"), null);
  assert.equal(parsePan(" aaacb2468h "), PAN);
  assert.equal(parsePan("ABCDE1234F"), null);
  assert.equal(parsePan("AAAAA0000A"), null);
  assert.equal(parsePan("ABCDE1234A"), null);
  assert.equal(maskPan(PAN), "AAACB****H");
  const missing = readSchoolForm({
    schoolName: " ",
    schoolAddress: "",
    principalName: "",
    principalMobile: "",
    principalEmail: "not-an-email",
    coordinatorName: "",
    coordinatorMobile: "111",
    coordinatorEmail: "",
    pan: "",
    previousParticipation: "",
    printedBooks: "",
    ebookAccess: "",
    authorised: "",
  });
  assert.ok(missing.errors.schoolName);
  assert.ok(missing.errors.pan);
  assert.ok(missing.errors.principalMobile);
  assert.ok(missing.errors.coordinatorMobile);
  assert.ok(missing.errors.principalEmail);
  assert.ok(missing.errors.printedBooks);
  assert.equal(missing.errors.principalDesignation, undefined);
  assert.equal(missing.errors.representativeName, undefined);
  assert.equal(missing.errors.representativeDesignation, undefined);
  assert.equal(missing.value, null);
  const extra = new FormData();
  schoolFields(extra);
  extra.set("principalDesignation", "Headmaster");
  extra.set("representativeName", "Not Collected");
  extra.set("representativeDesignation", "Not Collected");
  const cleaned = readSchoolForm(extra).value;
  assert.equal(cleaned?.principalName, "Anita Verma");
  assert.equal(cleaned?.principalDesignation, "Principal");
  assert.equal(cleaned?.representativeName, null);
  assert.equal(cleaned?.representativeDesignation, null);
  const books = readSchoolForm({ ...Object.fromEntries(new FormData() as never) });
  const withBooks = new FormData();
  schoolFields(withBooks);
  withBooks.set("printedBooks", "yes");
  withBooks.set("bookQuantity", "");
  const bookResult = readSchoolForm(withBooks);
  assert.equal(bookResult.errors.bookQuantity, "Enter how many printed books are required.");
  assert.equal(books.value, null);
  const paid = readPaymentSubmission(withBooks, 150);
  assert.equal(paid.value, null);
  assert.ok(paid.errors.paymentMode);
  const ebookYes = new FormData();
  schoolFields(ebookYes);
  ebookYes.set("ebookAccess", "yes");
  assert.equal(readSchoolForm(ebookYes).value?.ebookAccess, "no");
});

test("submission stores a reference, ignores a repeated post, and hides student details", async () => {
  const bytes = sheet([
    student(),
    student({ fullName: "Kavya Iyer", parentName: "Arun Iyer", dob: "02-02-2014", rollNumber: "2", streams: "TEJAS English, TEJAS Mathematics" }),
  ]);
  const formData = () => {
    const body = new FormData();
    schoolFields(body);
    body.set("payableToTejas", "1");
    body.set("file", new File([new Uint8Array(bytes)], "students.xlsx"));
    return body;
  };
  const key = "submission-key-0001";
  const send = () => submitPost(new Request("http://localhost/api/register/submit", { method: "POST", body: formData(), headers: { "x-idempotency-key": key } }));
  const first = await send();
  const saved = (await first.json()) as { registration: { reference: string; payableToTejas: number; amountDue: number; studentCount: number; studentStreamRegistrations: number; emailSent: boolean } };
  assert.equal(first.status, 201);
  assert.equal(saved.registration.studentCount, 2);
  assert.equal(saved.registration.studentStreamRegistrations, 3);
  assert.equal(saved.registration.payableToTejas, 450);
  assert.equal(saved.registration.amountDue, 450);
  assert.equal(saved.registration.emailSent, false);
  const second = await send();
  const repeated = (await second.json()) as { registration: { reference: string } };
  assert.equal(repeated.registration.reference, saved.registration.reference);
  const folders = await readdir(path.join(dataDir, "registrations"));
  assert.equal(folders.length, 1);
  const record = await readRegistration(saved.registration.reference);
  assert.equal(record?.students.length, 2);
  assert.equal(record?.school.previousReference, "DHE-2025-14");
  const summary = JSON.stringify(toPublicSummary(record!));
  assert.equal(summary.includes("Aarav"), false);
  assert.equal(summary.includes("15-08-2015"), false);
  assert.equal(summary.includes("Meera"), false);
  assert.equal(summary.includes(PAN), false);
  assert.equal(record?.school.pan, PAN);
  assert.equal(record?.school.panDuplicate, false);
  const fetched = await publicGet(new Request("http://localhost"), { params: Promise.resolve({ reference: saved.registration.reference }) });
  const payload = await fetched.json() as { registration: { schoolName: string } };
  assert.equal(JSON.stringify(payload).includes("dateOfBirth"), false);
  const receipt = await receiptPost(new Request("http://localhost", { method: "POST", body: new FormData() }), { params: Promise.resolve({ reference: saved.registration.reference }) });
  assert.equal(receipt.status, 400);
  const students = record?.students ?? [];
  const fee = calculateFee(students.reduce((sum, item) => sum + item.streams.length, 0));
  assert.equal(fee.payableToTejas, record?.fee.payableToTejas);
  assert.equal(students.every((item) => item.streams.length >= 1), true);
});

test("a data key encrypts registration bytes at rest", () => {
  process.env.TEJAS_DATA_KEY = "ab".repeat(32);
  const sealed = sealBytes(Buffer.from("Aarav Sharma"));
  assert.equal(sealed.includes(Buffer.from("Aarav")), false);
  assert.equal(openBytes(sealed).toString(), "Aarav Sharma");
  delete process.env.TEJAS_DATA_KEY;
});

test("staff access has no default password", () => {
  assert.equal(adminConfigured(), false);
  assert.equal(tokenMatches("password"), false);
  process.env.TEJAS_ADMIN_TOKEN = "correct-horse-battery";
  assert.equal(tokenMatches("password"), false);
  assert.equal(tokenMatches("correct-horse-battery"), true);
  const session = createSessionValue();
  assert.equal(sessionIsValid(session), true);
  assert.equal(sessionIsValid("v1.1.forged"), false);
  delete process.env.TEJAS_ADMIN_TOKEN;
});

test("a second school with the same PAN is flagged, and listings mask it", async () => {
  const bytes = sheet([student({ fullName: "Kabir Das", parentName: "Leela Das", dob: "20-01-2016", rollNumber: "9" })]);
  const body = new FormData();
  schoolFields(body);
  body.set("file", new File([new Uint8Array(bytes)], "students.xlsx"));
  const response = await submitPost(new Request("http://localhost/api/register/submit", {
    method: "POST",
    body,
    headers: { "x-idempotency-key": "submission-key-0002" },
  }));
  const saved = (await response.json()) as { registration: { reference: string } };
  assert.equal(response.status, 201);
  const record = await readRegistration(saved.registration.reference);
  assert.equal(record?.school.panDuplicate, true);
  const snapshot = await staffSnapshot();
  const listed = JSON.stringify(snapshot.registrations);
  assert.equal(listed.includes(PAN), false);
  assert.equal(listed.includes("AAACB****H"), true);
  const csv = registrationsToCsv([record!], "schools", false);
  assert.equal(csv.includes(PAN), false);
  assert.equal(registrationsToCsv([record!], "schools", true).includes(PAN), true);
  assert.equal(registrationsToCsv([record!], "ebooks", false).includes("not activated"), true);
  const updated = await updatePayment(saved.registration.reference, "rejected", "Amount did not match the bank statement.");
  assert.equal(updated?.payment.status, "rejected");
  assert.equal(updated?.payment.history?.some((event) => event.status === "rejected"), true);
  const before = updated?.payment.history?.length ?? 0;
  const amountDue = updated?.fee.amountDue;
  const repeated = await updatePayment(saved.registration.reference, "rejected", "Amount did not match the bank statement.");
  assert.equal(repeated?.payment.history?.length, before);
  assert.equal(repeated?.fee.amountDue, amountDue);
  assert.equal(repeated?.reference, updated?.reference);
  const verified = await updatePayment(saved.registration.reference, "confirmed", null);
  const verifiedAgain = await updatePayment(saved.registration.reference, "confirmed", null);
  assert.equal(verifiedAgain?.payment.history?.length, verified?.payment.history?.length);
  assert.equal(verifiedAgain?.payment.history?.filter((event) => event.status === "confirmed").length, 1);
  assert.equal(verifiedAgain?.fee.amountDue, amountDue);
});

test("payment proof stays closed while the official account is public", async () => {
  const shown = await paymentGet();
  const shownBody = await shown.json() as { proofsAccepted: boolean; accountNumber: string; ifsc: string; upiId: string; branch: string };
  assert.equal(shownBody.proofsAccepted, false);
  assert.equal(shownBody.accountNumber, "42529022841");
  assert.equal(shownBody.ifsc, "SBIN0000628");
  assert.equal(shownBody.upiId, "holisticeducation@sbi");
  assert.equal(shownBody.branch, "Chandigarh Main Branch");
  assert.equal(JSON.stringify(shownBody).includes("998877665544"), false);

  const upi = new FormData();
  upi.set("paymentMode", "UPI");
  upi.set("paymentDate", "2026-11-02");
  upi.set("payerName", "Anita Verma");
  upi.set("amountPaid", "150");
  upi.set("transactionReference", "UPI654321");
  assert.equal(readPaymentSubmission(upi, 150).value?.mode, "UPI");
  upi.set("paymentMode", "Cheque");
  assert.equal(readPaymentSubmission(upi, 150).value, null);
  upi.set("transactionReference", "123456");
  assert.equal(readPaymentSubmission(upi, 150).value?.transactionReference, "123456");

  process.env.TEJAS_ACCEPT_PAYMENT_PROOF = "true";
  assert.equal(paymentProofsAccepted(), false);
  delete process.env.TEJAS_ACCEPT_PAYMENT_PROOF;

  const early = new FormData();
  schoolFields(early, "BBCCD1357K");
  early.set("transactionReference", "UPI123456");
  early.set("file", new File([new Uint8Array(sheet([student({ rollNumber: "8" })]))], "students.xlsx"));
  const blocked = await submitPost(new Request("http://localhost/api/register/submit", {
    method: "POST",
    body: early,
    headers: { "x-idempotency-key": "submission-key-0003" },
  }));
  assert.equal(blocked.status, 400);

  const clean = new FormData();
  schoolFields(clean, "BBCCD1357K");
  clean.set("file", new File([new Uint8Array(sheet([student({ rollNumber: "8" })]))], "students.xlsx"));
  const savedResponse = await submitPost(new Request("http://localhost/api/register/submit", {
    method: "POST",
    body: clean,
    headers: { "x-idempotency-key": "submission-key-0004" },
  }));
  const saved = await savedResponse.json() as { registration: { reference: string; paymentLabel: string; nextStep: string } };
  assert.equal(savedResponse.status, 201, JSON.stringify(saved));
  assert.equal(saved.registration.paymentLabel, "Payment Pending");
  const pendingRecord = await readRegistration(saved.registration.reference);
  assert.equal(pendingRecord?.school.representativeName, null);
  assert.equal(pendingRecord?.school.representativeDesignation, null);
  assert.equal(pendingRecord?.payment.history?.[0]?.note, "Payment Pending");
  assert.equal(JSON.stringify(toPublicSummary(pendingRecord!)).includes("representative"), false);
  assert.match(saved.registration.nextStep, /Payment-proof submission is not open yet/);
  const stored = await listStoredRegistrations();
  assert.equal(stored.some((item) => item.payment.status === "pending_instructions"), true);
});

test("a hosted site does not confirm a registration when the database is not configured", async () => {
  const root = path.join(dataDir, "registrations");
  const before = await readdir(root).catch(() => [] as string[]);
  const previous = process.env.VERCEL;
  process.env.VERCEL = "1";
  try {
    const body = new FormData();
    schoolFields(body, "CCDEE2468P");
    body.set("file", new File([new Uint8Array(sheet([student({ fullName: "Nisha Rao", parentName: "Om Rao", rollNumber: "21" })]))], "students.xlsx"));
    const response = await submitPost(new Request("http://localhost/api/register/submit", {
      method: "POST",
      body,
      headers: { "x-idempotency-key": "submission-key-hosted1" },
    }));
    const payload = await response.json() as { ok: boolean; formErrors?: string[] };
    assert.equal(response.status, 503);
    assert.equal(payload.ok, false);
    assert.equal(JSON.stringify(payload).includes("not configured"), false);
    const after = await readdir(root).catch(() => [] as string[]);
    assert.deepEqual(after, before);
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});

test("the server key uses SUPABASE_SECRET_KEY only as a fallback and opens proof upload with durable storage", async () => {
  const previous = {
    url: process.env.SUPABASE_URL,
    role: process.env.SUPABASE_SERVICE_ROLE_KEY,
    secret: process.env.SUPABASE_SECRET_KEY,
    anon: process.env.ANON,
    proof: process.env.TEJAS_ACCEPT_PAYMENT_PROOF,
  };
  const restore = () => {
    for (const [name, value] of Object.entries({
      SUPABASE_URL: previous.url,
      SUPABASE_SERVICE_ROLE_KEY: previous.role,
      SUPABASE_SECRET_KEY: previous.secret,
      ANON: previous.anon,
      TEJAS_ACCEPT_PAYMENT_PROOF: previous.proof,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  };
  try {
    process.env.SUPABASE_URL = "https://exampleproject.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SECRET_KEY = "s".repeat(24);
    process.env.ANON = "a".repeat(40);
    delete process.env.TEJAS_ACCEPT_PAYMENT_PROOF;
    assert.equal(serverKeyName(), "SUPABASE_SECRET_KEY");
    assert.equal(durableStorageConfigured(), true);
    assert.equal(paymentProofsAccepted(), true);
    process.env.SUPABASE_SERVICE_ROLE_KEY = "r".repeat(24);
    assert.equal(serverKeyName(), "SUPABASE_SERVICE_ROLE_KEY");
    const calls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input);
      calls.push(url);
      const status = url.includes("/admin/users") ? 200 : 200;
      return new Response(null, { status });
    }) as typeof fetch;
    const status = await testSupabaseConnection();
    globalThis.fetch = original;
    assert.equal(status.connected, true);
    assert.equal(status.reason, "ok");
    assert.equal(status.keyName, "SUPABASE_SERVICE_ROLE_KEY");
    assert.equal(JSON.stringify(status).includes("r".repeat(24)), false);
    assert.equal(calls.length, 3);
  } finally {
    restore();
  }
});

test("payment proof files are checked and an unauthorised download is refused", async () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const pdf = Buffer.from("%PDF-1.4\ntrailer");
  assert.equal(detectReceipt(jpeg, "proof.jpg"), "jpg");
  assert.equal(detectReceipt(jpeg, "proof.jpeg"), "jpg");
  assert.equal(detectReceipt(png, "proof.png"), "png");
  assert.equal(detectReceipt(pdf, "proof.pdf"), "pdf");
  assert.equal(detectReceipt(Buffer.from("<html>not a receipt!!</html>"), "proof.jpg"), null);
  assert.equal(detectReceipt(jpeg, "proof.webp"), null);
  const denied = await staffFileGet(
    new Request("http://localhost/api/register/admin/registrations/TEJAS-2026-ABCDEFGHJKLMNPQRSTU2/file?kind=receipt"),
    { params: Promise.resolve({ reference: "TEJAS-2026-ABCDEFGHJKLMNPQRSTU2" }) },
  );
  assert.equal(denied.status, 401);
});

test("a payment proof is stored as verification pending and is not marked verified", async () => {
  const schoolBody = new FormData();
  schoolFields(schoolBody);
  schoolBody.set("printedBooks", "yes");
  schoolBody.set("bookQuantity", "2");
  const school = readSchoolForm(schoolBody).value;
  assert.ok(school);
  const reference = "TEJAS-2026-ABCDEFGHJKLMNPQRSTU2";
  const fee = calculateFee(1, { printedBooks: 2, ebookAccess: 5 });
  const record = {
    reference,
    createdAt: "2026-11-01T00:00:00.000Z",
    school,
    students: [],
    fee,
    payment: { status: "pending_instructions" as const, transactionReference: null, reviewNote: null, history: [] },
    uploadExt: "xlsx" as const,
    receiptExt: null,
  };
  const previous = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "s".repeat(24);
  const calls: string[] = [];
  const bodies: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push(`${method} ${url}`);
    if (init?.body) bodies.push(String(init.body));
    if (method === "GET" && url.includes("select=record_snapshot")) {
      return new Response(JSON.stringify([{ record_snapshot: record, reference }]), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (method === "GET" && url.includes("transaction_reference=ilike")) {
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (method === "GET" && url.includes("select=status")) {
      return new Response(JSON.stringify([{ status: "pending_instructions" }]), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (method === "GET") {
      return new Response(JSON.stringify([{ id: "row-1" }]), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (method === "POST" && url.includes("/storage/v1/object/")) {
      return new Response(JSON.stringify({ Key: "ok" }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (method === "PATCH") {
      return new Response(JSON.stringify([{ id: "row-1", status: "reported" }]), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (method === "DELETE") return new Response(null, { status: 204 });
    return new Response(JSON.stringify([]), { status: 201, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  const restore = () => {
    globalThis.fetch = original;
    if (previous.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
  };
  try {
    const bad = new FormData();
    bad.set("paymentMode", "UPI");
    bad.set("paymentDate", "2026-11-02");
    bad.set("payerName", "Anita Verma");
    bad.set("amountPaid", String(fee.amountDue));
    bad.set("transactionReference", "UPI654321");
    bad.set("receipt", new File([new TextEncoder().encode("<html>not a receipt!!</html>")], "proof.jpg", { type: "image/jpeg" }));
    const rejected = await receiptPost(new Request(`http://localhost/api/register/${reference}/payment`, { method: "POST", body: bad }), {
      params: Promise.resolve({ reference }),
    });
    assert.equal(rejected.status, 400);
    assert.equal(calls.some((call) => call.includes("/storage/v1/object/")), false);

    const good = new FormData();
    good.set("paymentMode", "UPI");
    good.set("paymentDate", "2026-11-02");
    good.set("payerName", "Anita Verma");
    good.set("amountPaid", String(fee.amountDue));
    good.set("transactionReference", "UPI654321");
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
    good.set("receipt", new File([new Uint8Array(jpeg)], "proof.jpg", { type: "image/jpeg" }));
    const accepted = await receiptPost(new Request(`http://localhost/api/register/${reference}/payment`, { method: "POST", body: good }), {
      params: Promise.resolve({ reference }),
    });
    const payload = await accepted.json() as { registration?: { paymentStatus?: string; paymentLabel?: string } };
    assert.equal(accepted.status, 200, JSON.stringify(payload));
    assert.equal(payload.registration?.paymentStatus, "reported");
    assert.equal(payload.registration?.paymentLabel, "Payment Submitted / Verification Pending");
    assert.equal(JSON.stringify(payload).includes("/storage/"), false);
    assert.equal(calls.some((call) => call.includes("/storage/v1/object/tejas-payment-proofs/")), true);
    assert.equal(bodies.some((body) => body.includes("\"status\":\"reported\"") && body.includes("Registration fee and printed books")), true);
    assert.equal(bodies.some((body) => body.includes("\"status\":\"confirmed\"")), false);
  } finally {
    restore();
  }
});

test("registration with proof upload open still saves a pending payment and ignores the browser total", async () => {
  const englishNames = ["Aarav", "Kavya", "Neel", "Ishaan", "Meera", "Rohan", "Anaya", "Vihaan", "Diya", "Kabir"];
  const mixedNames = ["Aditi", "Arjun", "Myra", "Devansh", "Sara", "Kunal", "Ira", "Yash", "Pihu", "Omkar"];
  const rows = [
    ...englishNames.map((name, index) => student({
      fullName: `${name} Sharma`,
      parentName: `${name} Parent`,
      dob: "15-08-2015",
      rollNumber: String(index + 1),
      streams: "TEJAS English",
    })),
    ...mixedNames.map((name, index) => student({
      fullName: `${name} Iyer`,
      parentName: `${name} Guardian`,
      dob: "02-02-2014",
      rollNumber: String(index + 11),
      streams: "TEJAS English, TEJAS Mathematics",
    })),
  ];
  const previous = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "s".repeat(24);
  type StoredSnapshot = { reference: string; school: { representativeName: string | null }; payment: { status: string } };
  let idem: { idempotency_key: string; payload_hash: string; reference: string } | null = null;
  const state: { snapshot: StoredSnapshot | null } = { snapshot: null };
  let paymentPosts = 0;
  let failPayments = false;
  const paymentBodies: string[] = [];
  const bookBodies: string[] = [];
  const original = globalThis.fetch;
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const path = new URL(url).pathname;
    const body = typeof init?.body === "string" ? init.body : "";
    if (method === "DELETE") return new Response(null, { status: 204 });
    if (method === "GET" && path.endsWith("/tejas_idempotency")) {
      const key = decodeURIComponent(/idempotency_key=eq\.([^&]+)/.exec(url)?.[1] ?? "");
      return json(idem && idem.idempotency_key === key ? [idem] : []);
    }
    if (method === "GET" && path.endsWith("/tejas_schools")) return json([]);
    if (method === "GET" && path.endsWith("/tejas_registrations")) {
      const reference = decodeURIComponent(/reference=eq\.([^&]+)/.exec(url)?.[1] ?? "");
      return json(state.snapshot && state.snapshot.reference === reference ? [{ record_snapshot: state.snapshot, reference }] : []);
    }
    if (method === "GET" && path.endsWith("/tejas_payments")) return json([]);
    if (method === "POST" && path.endsWith("/tejas_schools")) return json([{ id: "school-1" }], 201);
    if (method === "POST" && path.endsWith("/tejas_registrations")) {
      const parsed = JSON.parse(body) as { record_snapshot: StoredSnapshot };
      state.snapshot = parsed.record_snapshot;
      return json([{ id: "reg-1" }], 201);
    }
    if (method === "POST" && path.endsWith("/tejas_students")) return json([{ id: `student-${paymentPosts}-${body.length}` }], 201);
    if (method === "POST" && path.endsWith("/tejas_payments")) {
      if (failPayments) return json({ message: "no" }, 400);
      paymentPosts += 1;
      paymentBodies.push(body);
      return json([{ id: "pay-1", registration_id: "reg-1" }], 201);
    }
    if (method === "POST" && path.endsWith("/tejas_book_orders")) {
      bookBodies.push(body);
      return json([], 201);
    }
    if (method === "POST" && path.endsWith("/tejas_idempotency")) {
      idem = JSON.parse(body);
      return json([], 201);
    }
    if (method === "POST" && url.includes("/storage/v1/object/")) return json({ Key: "ok" });
    return json([], 201);
  }) as typeof fetch;
  const restore = () => {
    globalThis.fetch = original;
    if (previous.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
  };
  const formData = () => {
    const body = new FormData();
    schoolFields(body, "DDEFF4680K");
    body.set("printedBooks", "yes");
    body.set("bookQuantity", "5");
    body.set("payableToTejas", "1");
    body.set("amountDue", "1");
    body.set("principalDesignation", "Headmaster");
    body.set("representativeName", "Not Collected");
    body.set("representativeDesignation", "Not Collected");
    body.set("file", new File([new Uint8Array(sheet(rows))], "students.xlsx"));
    return body;
  };
  try {
    const key = "submission-key-open-proof";
    const send = () => submitPost(new Request("http://localhost/api/register/submit", {
      method: "POST",
      body: formData(),
      headers: { "x-idempotency-key": key, "x-forwarded-for": "198.51.100.24" },
    }));
    const first = await send();
    const saved = await first.json() as {
      ok: boolean;
      registration: {
        reference: string;
        amountDue: number;
        payableToTejas: number;
        printedBookAmount: number;
        studentStreamRegistrations: number;
        paymentLabel: string;
        paymentStatus: string;
      };
    };
    assert.equal(first.status, 201, JSON.stringify(saved));
    assert.equal(saved.ok, true);
    assert.equal(saved.registration.studentStreamRegistrations, 30);
    assert.equal(saved.registration.payableToTejas, 4500);
    assert.equal(saved.registration.printedBookAmount, 850);
    assert.equal(saved.registration.amountDue, 5350);
    assert.equal(saved.registration.paymentStatus, "pending_instructions");
    assert.equal(saved.registration.paymentLabel, "Payment Pending");
    assert.equal(JSON.stringify(saved).includes("Not Collected"), false);
    assert.equal(JSON.stringify(saved).includes("Headmaster"), false);
    const payment = JSON.parse(paymentBodies[0] ?? "{}") as { registration_id: string; status: string; amount_due: number; history: { note: string }[] };
    assert.equal(paymentPosts, 1);
    assert.equal(payment.registration_id, "reg-1");
    assert.equal(payment.status, "pending_instructions");
    assert.equal(payment.amount_due, 5350);
    assert.equal(payment.history[0]?.note, "Payment Pending");
    assert.equal(bookBodies[0]?.includes('"quantity":5'), true);
    assert.equal(bookBodies[0]?.includes('"amount":850'), true);
    assert.equal(state.snapshot?.school.representativeName, null);
    const second = await send();
    const repeated = await second.json() as { registration: { reference: string } };
    assert.equal(second.status, 200);
    assert.equal(repeated.registration.reference, saved.registration.reference);
    assert.equal(paymentPosts, 1);

    failPayments = true;
    const failed = await submitPost(new Request("http://localhost/api/register/submit", {
      method: "POST",
      body: formData(),
      headers: { "x-idempotency-key": "submission-key-open-fail", "x-forwarded-for": "198.51.100.25" },
    }));
    const failure = await failed.json() as { ok: boolean; registration?: { reference: string } };
    assert.equal(failed.status, 503);
    assert.equal(failure.ok, false);
    assert.equal(failure.registration, undefined);
    assert.equal(paymentPosts, 1);
  } finally {
    restore();
  }
});
