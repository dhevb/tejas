import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import * as XLSX from "xlsx";
import { adminConfigured, createSessionValue, sessionIsValid, tokenMatches } from "@/lib/registration/auth";
import { BOOK_PRICE, calculateFee, EBOOK_FEE, FEE_SCHOOL, FEE_TEJAS, FEE_TOTAL, ONLINE_EXAM_APPROVED, SCHOOL_SHARE_APPROVED } from "@/lib/registration/fee";
import { maskPan, parseIndianMobile, parsePan, validateDob } from "@/lib/registration/fields";
import { publicPaymentView, writePaymentConfig } from "@/lib/registration/payment";
import { registrationsToCsv } from "@/lib/registration/reports";
import { buildTemplateBuffer, parseStudentSheet } from "@/lib/registration/sheet";
import { STUDENT_COLUMNS } from "@/lib/registration/schema";
import { readPaymentSubmission, readSchoolForm } from "@/lib/registration/school";
import { GET as publicGet } from "@/app/api/register/[reference]/route";
import { GET as paymentGet } from "@/app/api/register/payment/route";
import { POST as submitPost } from "@/app/api/register/submit/route";
import { POST as receiptPost } from "@/app/api/register/[reference]/payment/route";
import { openBytes, sealBytes } from "@/lib/registration/seal";
import { readRegistration, staffSnapshot, toPublicSummary, updatePayment } from "@/lib/registration/store";

const dataDir = mkdtempSync(path.join(tmpdir(), "tejas-reg-"));
process.env.TEJAS_DATA_DIR = dataDir;
delete process.env.TEJAS_DATA_KEY;
delete process.env.TEJAS_ADMIN_TOKEN;

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
  assert.equal(extras.ebookAmount, 147);
  assert.equal(extras.amountDue, 1087);
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

test("payment details stay hidden until authorised", async () => {
  const hidden = publicPaymentView({
    activated: false,
    bankName: "State Bank",
    accountHolder: "TEJAS",
    accountNumber: "123456789012",
    ifsc: "SBIN0001234",
    upiId: "tejas@sbi",
    extraInstructions: "",
  });
  assert.equal(hidden.activated, false);
  assert.equal("accountNumber" in hidden, false);
  assert.match(hidden.message, /do not transfer money/i);
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
  body.set("principalDesignation", "Principal");
  body.set("coordinatorName", "Rahul Mehta");
  body.set("coordinatorMobile", "9876543210");
  body.set("coordinatorEmail", "rahul@river.example");
  body.set("coordinatorDesignation", "Coordinator");
  body.set("previousParticipation", "yes");
  body.set("previousReference", "DHE-2025-14");
  body.set("printedBooks", "no");
  body.set("bookQuantity", "0");
  body.set("ebookAccess", "no");
  body.set("representativeName", "Anita Verma");
  body.set("representativeDesignation", "Principal");
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
  assert.equal(missing.value, null);
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
});

test("payment proof is refused until account details are published, then checked on the server", async () => {
  const hidden = await paymentGet();
  const hiddenBody = await hidden.json() as { activated: boolean };
  assert.equal(hiddenBody.activated, false);
  assert.equal(JSON.stringify(hiddenBody).includes("998877665544"), false);

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

  process.env.TEJAS_PUBLISH_BANK_DETAILS = "true";
  const configError = await writePaymentConfig({
    activated: true,
    bankName: "State Bank of India",
    accountHolder: "Olympiad Collections",
    accountNumber: "998877665544",
    ifsc: "SBIN0001234",
    upiId: "pay@sbi",
    extraInstructions: "",
  });
  assert.equal(configError, null);

  function paidForm(amount: string, reference: string, fileName: string, bytes: Buffer) {
    const body = new FormData();
    schoolFields(body, "BBCCD1357K");
    body.set("paymentMode", "UPI");
    body.set("paymentDate", "2026-11-02");
    body.set("payerName", "Anita Verma");
    body.set("amountPaid", amount);
    body.set("transactionReference", reference);
    body.set("file", new File([new Uint8Array(sheet([student({ rollNumber: "8" })]))], "students.xlsx"));
    body.set("receipt", new File([new Uint8Array(bytes)], fileName));
    return body;
  }
  const jpeg = Buffer.alloc(32, 0);
  jpeg[0] = 0xff;
  jpeg[1] = 0xd8;
  jpeg[2] = 0xff;
  const mismatch = await submitPost(new Request("http://localhost/api/register/submit", {
    method: "POST",
    body: paidForm("149", "UPI654321", "proof.jpg", jpeg),
    headers: { "x-idempotency-key": "submission-key-0004" },
  }));
  assert.equal(mismatch.status, 400);
  const wrongType = await submitPost(new Request("http://localhost/api/register/submit", {
    method: "POST",
    body: paidForm("150", "UPI654321", "proof.txt", jpeg),
    headers: { "x-idempotency-key": "submission-key-0005" },
  }));
  assert.equal(wrongType.status, 400);
  const accepted = await submitPost(new Request("http://localhost/api/register/submit", {
    method: "POST",
    body: paidForm("150", "UPI654321", "proof.jpg", jpeg),
    headers: { "x-idempotency-key": "submission-key-0006" },
  }));
  const acceptedBody = await accepted.json() as { registration: { reference: string; paymentLabel: string; nextStep: string } };
  assert.equal(accepted.status, 201, JSON.stringify(acceptedBody));
  assert.equal(acceptedBody.registration.paymentLabel, "Verification Pending");
  assert.match(acceptedBody.registration.nextStep, /Payment proof received/);
  const duplicate = await submitPost(new Request("http://localhost/api/register/submit", {
    method: "POST",
    body: paidForm("150", "upi654321", "proof.jpg", jpeg),
    headers: { "x-idempotency-key": "submission-key-0007" },
  }));
  assert.equal(duplicate.status, 409);
  const shown = await paymentGet();
  const shownBody = await shown.json() as { activated: boolean; accountNumber?: string };
  assert.equal(shownBody.activated, true);
  assert.equal(shownBody.accountNumber, "998877665544");
  delete process.env.TEJAS_PUBLISH_BANK_DETAILS;
  const unpublished = await paymentGet();
  const unpublishedBody = await unpublished.json() as { activated: boolean };
  assert.equal(unpublishedBody.activated, false);
  assert.equal(JSON.stringify(unpublishedBody).includes("998877665544"), false);
});
