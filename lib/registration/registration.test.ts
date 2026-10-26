import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import * as XLSX from "xlsx";
import { adminConfigured, createSessionValue, sessionIsValid, tokenMatches } from "@/lib/registration/auth";
import { calculateFee, FEE_SCHOOL, FEE_TEJAS, FEE_TOTAL } from "@/lib/registration/fee";
import { parseIndianMobile, validateDob } from "@/lib/registration/fields";
import { publicPaymentView, writePaymentConfig } from "@/lib/registration/payment";
import { buildTemplateBuffer, parseStudentSheet } from "@/lib/registration/sheet";
import { STUDENT_COLUMNS } from "@/lib/registration/schema";
import { readSchoolForm } from "@/lib/registration/school";
import { GET as publicGet } from "@/app/api/register/[reference]/route";
import { POST as submitPost } from "@/app/api/register/submit/route";
import { POST as receiptPost } from "@/app/api/register/[reference]/payment/route";
import { openBytes, sealBytes } from "@/lib/registration/seal";
import { readRegistration, toPublicSummary } from "@/lib/registration/store";

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
    dob: "15-08-2015",
    className: "V",
    section: "A",
    rollNumber: "",
    schoolName: SCHOOL,
    streams: "TEJAS English",
  };
  return STUDENT_COLUMNS.map((column) => overrides[column.key] ?? base[column.key]);
}

function registrations(buffer: Buffer, name = "students.xlsx") {
  return parseStudentSheet(buffer, name, SCHOOL);
}

test("fee is ₹100, ₹80, and ₹20 per student-stream, not per student", () => {
  const one = calculateFee(1);
  assert.deepEqual([one.totalStudentFees, one.payableToTejas, one.schoolShare], [100, 80, 20]);
  assert.equal(one.payableToTejas, 1 * FEE_TEJAS);
  assert.notEqual(one.payableToTejas, 1 * FEE_TOTAL);
  const two = calculateFee(2);
  assert.deepEqual([two.totalStudentFees, two.payableToTejas, two.schoolShare], [200, 160, 40]);
  const three = calculateFee(3);
  assert.deepEqual([three.totalStudentFees, three.payableToTejas, three.schoolShare], [300, 240, 60]);
  const fifty = calculateFee(50);
  assert.deepEqual([fifty.totalStudentFees, fifty.payableToTejas, fifty.schoolShare], [5000, 4000, 1000]);
  assert.equal(fifty.schoolShare, 50 * FEE_SCHOOL);
});

test("one, two, and three streams are counted separately", () => {
  const one = registrations(sheet([student()]));
  assert.equal(one.rowErrors.length, 0);
  assert.equal(one.fee?.studentStreamRegistrations, 1);
  const two = registrations(sheet([student({ streams: "TEJAS English, TEJAS Mathematics" })]));
  assert.equal(two.fee?.payableToTejas, 160);
  const three = registrations(sheet([student({ streams: "TEJAS English, TEJAS Mathematics, TEJAS Future Tech" })]));
  assert.equal(three.students[0]?.streams.length, 3);
  assert.equal(three.fee?.totalStudentFees, 300);
  assert.equal(three.fee?.payableToTejas, 240);
});

test("mixed students keep their own stream counts", () => {
  const parsed = registrations(sheet([
    student(),
    student({ fullName: "Kavya Iyer", parentName: "Arun Iyer", dob: "02-02-2014", rollNumber: "2", streams: "TEJAS Mathematics, TEJAS Future Tech" }),
    student({ fullName: "Neel Kapoor", parentName: "Sonia Kapoor", dob: "09-09-2013", className: "8", section: "B", streams: "Future Tech" }),
  ]));
  assert.equal(parsed.rowErrors.length, 0);
  assert.equal(parsed.students.length, 3);
  assert.equal(parsed.fee?.studentStreamRegistrations, 4);
  assert.equal(parsed.fee?.payableToTejas, 320);
});

test("blank roll number is accepted", () => {
  const parsed = registrations(sheet([student({ rollNumber: "" })]));
  assert.equal(parsed.students[0]?.rollNumber, "");
  assert.equal(parsed.rowErrors.length, 0);
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
  assert.equal(csv.fee?.payableToTejas, 80);
  assert.equal(xls.fee?.payableToTejas, 80);
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

test("school fields and Indian mobile numbers are checked", () => {
  assert.equal(parseIndianMobile("+91 98765 43210"), "9876543210");
  assert.equal(parseIndianMobile("1234567890"), null);
  const missing = readSchoolForm({
    schoolName: "",
    schoolAddress: "",
    principalName: "",
    principalEmail: "not-an-email",
    coordinatorName: "",
    coordinatorMobile: "111",
    coordinatorEmail: "",
    previousParticipation: "",
    previousReference: "",
    authorised: "",
    privacy: "",
  });
  assert.ok(missing.errors.schoolName);
  assert.ok(missing.errors.coordinatorMobile);
  assert.ok(missing.errors.principalEmail);
  assert.equal(missing.value, null);
});

test("submission stores a reference, ignores a repeated post, and hides student details", async () => {
  const bytes = sheet([
    student(),
    student({ fullName: "Kavya Iyer", parentName: "Arun Iyer", dob: "02-02-2014", streams: "TEJAS English, TEJAS Mathematics" }),
  ]);
  const formData = () => {
    const body = new FormData();
    body.set("schoolName", SCHOOL);
    body.set("schoolAddress", "12 Station Road, Mohali");
    body.set("principalName", "Anita Verma");
    body.set("principalEmail", "principal@river.example");
    body.set("coordinatorName", "Rahul Mehta");
    body.set("coordinatorMobile", "9876543210");
    body.set("coordinatorEmail", "rahul@river.example");
    body.set("previousParticipation", "yes");
    body.set("previousReference", "DHE-2025-14");
    body.set("authorised", "yes");
    body.set("privacy", "yes");
    body.set("payableToTejas", "1");
    body.set("file", new File([new Uint8Array(bytes)], "students.xlsx"));
    return body;
  };
  const key = "submission-key-0001";
  const send = () => submitPost(new Request("http://localhost/api/register/submit", { method: "POST", body: formData(), headers: { "x-idempotency-key": key } }));
  const first = await send();
  const saved = (await first.json()) as { registration: { reference: string; payableToTejas: number; studentCount: number; studentStreamRegistrations: number; emailSent: boolean } };
  assert.equal(first.status, 201);
  assert.equal(saved.registration.studentCount, 2);
  assert.equal(saved.registration.studentStreamRegistrations, 3);
  assert.equal(saved.registration.payableToTejas, 240);
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
