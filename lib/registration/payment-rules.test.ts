import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { POST as individualBookPost } from "@/app/api/books/individual/route";
import { POST as bookProofPost } from "@/app/api/books/[reference]/payment/route";
import { POST as schoolBookPost } from "@/app/api/books/school/route";
import { GET as caseList } from "@/app/api/register/admin/cases/route";
import { GET as proofGet } from "@/app/api/register/admin/proof/route";
import { POST as individualPost } from "@/app/api/register/individual/route";
import { POST as submitPost } from "@/app/api/register/submit/route";
import { createSessionValue } from "@/lib/registration/auth";
import { registerStudent, submitEbookProof } from "@/lib/portal/store";
import { MAX_RECEIPT_BYTES } from "@/lib/registration/schema";
import { claimUtr, releaseUtr, utrOwner } from "@/lib/registration/utr-claim";
import { calculateIndividualRegistration, calculatePrintedBooks, FEE_SCHOOL, FEE_TEJAS, FEE_TOTAL } from "@/lib/registration/fee";
import { lookupTrustedTransaction } from "@/lib/registration/bank-reconciliation";
import { BOOK_BANK, REGISTRATION_BANK } from "@/lib/registration/official-bank";
import { decidePayment, receivingAccount, utrsMatch } from "@/lib/registration/payment-decision";
import { detectScreenshot } from "@/lib/registration/receipt";
import { extractUtr, renderUtrPng } from "@/lib/registration/screenshot-ocr";

const dataDir = mkdtempSync(path.join(tmpdir(), "tejas-pay-"));
if (!process.env.TEJAS_DATA_DIR) process.env.TEJAS_DATA_DIR = dataDir;
delete process.env.TEJAS_DATA_KEY;
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

test("school and individual registration amounts stay on their own rules", () => {
  assert.equal(FEE_TOTAL, 150);
  assert.equal(FEE_SCHOOL, 30);
  assert.equal(FEE_TEJAS, 120);
  const one = calculateIndividualRegistration(1);
  const two = calculateIndividualRegistration(2);
  const three = calculateIndividualRegistration(3);
  assert.deepEqual([one.total, one.schoolShare, one.payableToTejas], [150, 0, 150]);
  assert.deepEqual([two.total, two.schoolShare, two.payableToTejas], [300, 0, 300]);
  assert.deepEqual([three.total, three.schoolShare, three.payableToTejas], [450, 0, 450]);
  assert.equal(one.schoolShare, 0);
  assert.throws(() => calculateIndividualRegistration(0));
});

test("printed book prices, school share, and the PAN threshold use the gross price", () => {
  const one = calculatePrintedBooks(1, "school");
  const two = calculatePrintedBooks(2, "school");
  const ten = calculatePrintedBooks(10, "school");
  const twelve = calculatePrintedBooks(12, "school");
  const own = calculatePrintedBooks(1, "individual");
  const ownTwo = calculatePrintedBooks(2, "individual");
  assert.deepEqual([one.total, one.schoolShare, one.payableToTejas, one.panRequired], [170, 34, 136, false]);
  assert.deepEqual([two.total, two.schoolShare, two.payableToTejas], [340, 68, 272]);
  assert.equal(ten.total, 1700);
  assert.equal(ten.panRequired, false);
  assert.equal(calculatePrintedBooks(11, "individual").panRequired, false);
  assert.equal(twelve.total, 2040);
  assert.equal(twelve.panRequired, true);
  assert.equal(calculatePrintedBooks(15, "school").panRequired, true);
  assert.deepEqual([own.total, own.schoolShare, own.payableToTejas], [170, 0, 170]);
  assert.deepEqual([ownTwo.total, ownTwo.schoolShare, ownTwo.payableToTejas], [340, 0, 340]);
  assert.equal(receivingAccount("school-registration"), REGISTRATION_BANK.accountNumber);
  assert.equal(receivingAccount("individual-registration"), REGISTRATION_BANK.accountNumber);
  assert.equal(receivingAccount("school-book"), BOOK_BANK.accountNumber);
  assert.equal(receivingAccount("ebook"), BOOK_BANK.accountNumber);
  assert.notEqual(REGISTRATION_BANK.accountNumber, BOOK_BANK.accountNumber);
});

test("screenshot UTR matching never approves without a trusted bank credit", () => {
  const expected = { expectedAmount: 120, expectedAccount: REGISTRATION_BANK.accountNumber };
  const matched = decidePayment({ enteredUtr: "NEFT123456", extractedUtr: "NEFT 123456", bank: lookupTrustedTransaction("NEFT123456"), ...expected });
  assert.equal(matched.outcome, "staff_review");
  assert.equal(matched.bankResult, "unavailable");
  assert.equal(utrsMatch("NEFT123456", "NEFT 123456"), true);
  const mismatch = decidePayment({ enteredUtr: "NEFT123456", extractedUtr: "NEFT654321", bank: { available: true, transaction: null }, ...expected });
  assert.equal(mismatch.bankResult, "utr_mismatch");
  const unreadable = decidePayment({ enteredUtr: "NEFT123456", extractedUtr: null, bank: { available: true, transaction: null }, ...expected });
  assert.equal(unreadable.bankResult, "unreadable");
  const wrongAmount = decidePayment({
    enteredUtr: "NEFT123456",
    extractedUtr: "NEFT123456",
    expectedAmount: 120,
    expectedAccount: REGISTRATION_BANK.accountNumber,
    bank: { available: true, transaction: { status: "settled", amount: 150, accountNumber: REGISTRATION_BANK.accountNumber, alreadyUsed: false } },
  });
  assert.equal(wrongAmount.bankResult, "amount_mismatch");
  const wrongAccount = decidePayment({
    enteredUtr: "NEFT123456",
    extractedUtr: "NEFT123456",
    expectedAmount: 120,
    expectedAccount: REGISTRATION_BANK.accountNumber,
    bank: { available: true, transaction: { status: "settled", amount: 120, accountNumber: BOOK_BANK.accountNumber, alreadyUsed: false } },
  });
  assert.equal(wrongAccount.bankResult, "account_mismatch");
  const duplicate = decidePayment({
    enteredUtr: "NEFT123456",
    extractedUtr: "NEFT123456",
    ...expected,
    bank: { available: true, transaction: { status: "settled", amount: 120, accountNumber: REGISTRATION_BANK.accountNumber, alreadyUsed: true } },
  });
  assert.equal(duplicate.bankResult, "duplicate");
  const pending = decidePayment({
    enteredUtr: "NEFT123456",
    extractedUtr: "NEFT123456",
    ...expected,
    bank: { available: true, transaction: { status: "pending", amount: 120, accountNumber: REGISTRATION_BANK.accountNumber, alreadyUsed: false } },
  });
  assert.equal(pending.bankResult, "pending");
  const reversed = decidePayment({
    enteredUtr: "NEFT123456",
    extractedUtr: "NEFT123456",
    ...expected,
    bank: { available: true, transaction: { status: "reversed", amount: 120, accountNumber: REGISTRATION_BANK.accountNumber, alreadyUsed: false } },
  });
  assert.equal(reversed.outcome, "staff_review");
  const approved = decidePayment({
    enteredUtr: "NEFT123456",
    extractedUtr: "NEFT123456",
    ...expected,
    bank: { available: true, transaction: { status: "settled", amount: 120, accountNumber: REGISTRATION_BANK.accountNumber, alreadyUsed: false } },
  });
  assert.equal(approved.outcome, "automatic");
  assert.equal(approved.approvalMethod, "automatic");
});

test("the screenshot reader matches a painted UTR and rejects a file that is not an image", () => {
  const png = renderUtrPng("NEFT123456");
  assert.equal(detectScreenshot(png, "proof.png"), "png");
  assert.equal(extractUtr(png).utr, "NEFT123456");
  const blank = renderUtrPng("AAAAAA");
  assert.equal(extractUtr(blank).utr, "AAAAAA");
  const unread = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(extractUtr(unread).utr, null);
  assert.equal(detectScreenshot(Buffer.from("%PDF-1.7\ntrailer"), "proof.pdf"), null);
  assert.equal(detectScreenshot(Buffer.from("<html>not a receipt!!</html>"), "proof.jpg"), null);
});

test("individual registration charges the full fee and a repeat key does not create another one", async () => {
  const body = () => {
    const form = new FormData();
    form.set("fullName", "Aarav Sharma");
    form.set("parentName", "Meera Sharma");
    form.set("dateOfBirth", "15-08-2015");
    form.set("className", "V");
    form.set("schoolName", "River School");
    form.set("section", "A");
    form.set("rollNumber", "1");
    form.set("mobile", "9876543210");
    form.set("email", "meera@example.test");
    form.set("streams", "TEJAS English, TEJAS Mathematics");
    return form;
  };
  const first = await individualPost(new Request("http://localhost/api/register/individual", { method: "POST", body: body(), headers: { "x-idempotency-key": "individual-fee-key" } }));
  const saved = await first.json() as { registration: { totalStudentFees: number; registrationSchoolShare: number; amountDue: number; reference: string; channel: string } };
  assert.equal(first.status, 201, JSON.stringify(saved));
  assert.equal(saved.registration.totalStudentFees, 300);
  assert.equal(saved.registration.registrationSchoolShare, 0);
  assert.equal(saved.registration.amountDue, 300);
  assert.equal(saved.registration.channel, "individual");
  const second = await individualPost(new Request("http://localhost/api/register/individual", { method: "POST", body: body(), headers: { "x-idempotency-key": "individual-fee-key" } }));
  const repeated = await second.json() as { registration: { reference: string } };
  assert.equal(repeated.registration.reference, saved.registration.reference);
  const duplicate = await individualPost(new Request("http://localhost/api/register/individual", { method: "POST", body: body() }));
  assert.equal(duplicate.status, 409);
});

test("book orders keep the school share off individual orders and require PAN only above ₹2,000", async () => {
  const school = new FormData();
  school.set("schoolName", "River School");
  school.set("phone", "9876543210");
  school.set("email", "office@river.example");
  school.set("deliveryAddress", "12 Station Road, Mohali");
  school.set("district", "Mohali");
  school.set("state", "Punjab");
  school.set("pin", "140301");
  school.set("contactName", "Rahul Mehta");
  school.set("contactMobile", "9876543211");
  school.set("contactEmail", "rahul@river.example");
  school.set("qty-english-3", "1");
  const one = await schoolBookPost(new Request("http://localhost/api/books/school", { method: "POST", body: school }));
  const oneBody = await one.json() as { order: { total: number; schoolShare: number; payableToTejas: number; panRequired: boolean; reference: string } };
  assert.equal(one.status, 201, JSON.stringify(oneBody));
  assert.deepEqual([oneBody.order.total, oneBody.order.schoolShare, oneBody.order.payableToTejas, oneBody.order.panRequired], [170, 34, 136, false]);

  const large = new FormData();
  large.set("schoolName", "River School");
  large.set("phone", "9876543210");
  large.set("email", "office@river.example");
  large.set("deliveryAddress", "12 Station Road, Mohali");
  large.set("district", "Mohali");
  large.set("state", "Punjab");
  large.set("pin", "140301");
  large.set("contactName", "Rahul Mehta");
  large.set("contactMobile", "9876543211");
  large.set("contactEmail", "rahul@river.example");
  large.set("qty-mathematics-4", "12");
  const missingPan = await schoolBookPost(new Request("http://localhost/api/books/school", { method: "POST", body: large }));
  assert.equal(missingPan.status, 400);
  large.set("pan", "AAACB2468H");
  const withPan = await schoolBookPost(new Request("http://localhost/api/books/school", { method: "POST", body: large }));
  const withPanBody = await withPan.json() as { order: { total: number; payableToTejas: number; panRequired: boolean; panProvided: boolean } };
  assert.equal(withPan.status, 201, JSON.stringify(withPanBody));
  assert.equal(withPanBody.order.total, 2040);
  assert.equal(withPanBody.order.payableToTejas, 1632);
  assert.equal(withPanBody.order.panRequired, true);
  assert.equal(withPanBody.order.panProvided, true);
  assert.equal(JSON.stringify(withPanBody).includes("AAACB2468H"), false);

  const own = new FormData();
  own.set("studentName", "Kavya Iyer");
  own.set("parentName", "Arun Iyer");
  own.set("mobile", "9898989898");
  own.set("email", "arun@example.test");
  own.set("schoolName", "River School");
  own.set("className", "VI");
  own.set("streamId", "technology");
  own.set("quantity", "2");
  own.set("deliveryAddress", "12 Station Road, Mohali");
  own.set("district", "Mohali");
  own.set("state", "Punjab");
  own.set("pin", "140301");
  const ownResponse = await individualBookPost(new Request("http://localhost/api/books/individual", { method: "POST", body: own }));
  const ownBody = await ownResponse.json() as { order: { total: number; schoolShare: number; payableToTejas: number; reference: string } };
  assert.equal(ownResponse.status, 201, JSON.stringify(ownBody));
  assert.deepEqual([ownBody.order.total, ownBody.order.schoolShare, ownBody.order.payableToTejas], [340, 0, 340]);

  const proof = new FormData();
  proof.set("paymentMode", "NEFT");
  proof.set("paymentDate", "2026-11-14");
  proof.set("payerName", "Arun Iyer");
  proof.set("amountPaid", "1");
  proof.set("transactionReference", "NEFT123456");
  proof.set("receipt", new File([new Uint8Array(renderUtrPng("NEFT123456"))], "proof.png", { type: "image/png" }));
  const wrongAmount = await bookProofPost(new Request("http://localhost/api/books/pay", { method: "POST", body: proof }), { params: Promise.resolve({ reference: ownBody.order.reference }) });
  assert.equal(wrongAmount.status, 400);
  proof.set("amountPaid", "340");
  const accepted = await bookProofPost(new Request("http://localhost/api/books/pay", { method: "POST", body: proof }), { params: Promise.resolve({ reference: ownBody.order.reference }) });
  const acceptedBody = await accepted.json() as { verified?: boolean; paymentStatus?: string };
  assert.equal(accepted.status, 200, JSON.stringify(acceptedBody));
  assert.equal(acceptedBody.verified, false);
  assert.equal(acceptedBody.paymentStatus, "reported");
  const missingShot = new FormData();
  missingShot.set("paymentMode", "NEFT");
  missingShot.set("paymentDate", "2026-11-14");
  missingShot.set("payerName", "Arun Iyer");
  missingShot.set("amountPaid", "340");
  missingShot.set("transactionReference", "NEFT999999");
  const noFile = await bookProofPost(new Request("http://localhost/api/books/pay", { method: "POST", body: missingShot }), { params: Promise.resolve({ reference: ownBody.order.reference }) });
  assert.equal(noFile.status, 400);
});

test("one UTR can be claimed once, including by two simultaneous requests", async () => {
  const first = await claimUtr("neft 445566", "school-registration", utrOwner("school-registration", "TEJAS-2026-CLAIMONEAAAAAAAAA"));
  assert.equal(first.ok, true);
  const sameText = await claimUtr("NEFT445566", "ebook", utrOwner("ebook", "student:ft-book-1"));
  assert.equal(sameText.ok, false);
  const again = await claimUtr("NEFT445566", "school-registration", utrOwner("school-registration", "TEJAS-2026-CLAIMONEAAAAAAAAA"));
  assert.equal(again.ok, true);
  if (again.ok) assert.equal(again.reused, true);
  await releaseUtr("NEFT445566", utrOwner("school-registration", "TEJAS-2026-CLAIMONEAAAAAAAAA"));
  const afterRelease = await claimUtr("NEFT445566", "individual-book", utrOwner("individual-book", "TEJAS-2026-CLAIMTWOAAAAAAAAA"));
  assert.equal(afterRelease.ok, true);
  await releaseUtr("NEFT445566", utrOwner("individual-book", "TEJAS-2026-CLAIMTWOAAAAAAAAA"));
  const [left, right] = await Promise.all([
    claimUtr("IMPS778899", "school-book", utrOwner("school-book", "TEJAS-2026-CLAIMSIDEAAAAAAAA")),
    claimUtr("imps 778899", "ebook", utrOwner("ebook", "other:ft-book-1")),
  ]);
  assert.equal([left.ok, right.ok].filter(Boolean).length, 1);
});

test("a registration submission cannot store a PDF or mark itself paid", async () => {
  const form = new FormData();
  form.set("transactionReference", "NEFT123456");
  form.set("receipt", new File([Buffer.from("%PDF-1.7\n")], "proof.pdf", { type: "application/pdf" }));
  const response = await submitPost(new Request("http://localhost/api/register/submit", {
    method: "POST",
    body: form,
    headers: { "x-idempotency-key": "legacy-proof-bypass-01", "x-forwarded-for": "utr-legacy" },
  }));
  const body = await response.json() as { ok?: boolean; formErrors?: string[]; registration?: { paymentStatus?: string } };
  assert.equal(response.status, 400);
  assert.equal(body.registration, undefined);
  assert.equal(body.formErrors?.join(" ").includes("Please upload your payment screenshot and enter the UTR number."), true);
});

test("book screenshots are private and hosted book orders are not hidden", async () => {
  const own = new FormData();
  own.set("studentName", "Meera Nair");
  own.set("parentName", "Arun Nair");
  own.set("mobile", "9898989898");
  own.set("email", "meera-proof@example.test");
  own.set("schoolName", "River School");
  own.set("className", "VI");
  own.set("streamId", "english");
  own.set("quantity", "1");
  own.set("deliveryAddress", "12 Station Road, Mohali");
  own.set("district", "Mohali");
  own.set("state", "Punjab");
  own.set("pin", "140301");
  const saved = await individualBookPost(new Request("http://localhost/api/books/individual", { method: "POST", body: own, headers: { "x-forwarded-for": "proof-view" } }));
  const savedBody = await saved.json() as { order: { reference: string; payableToTejas: number } };
  assert.equal(saved.status, 201, JSON.stringify(savedBody));
  assert.equal(savedBody.order.payableToTejas, 170);
  const png = renderUtrPng("IMPS445566");
  const proof = new FormData();
  proof.set("paymentMode", "IMPS");
  proof.set("paymentDate", "2026-11-14");
  proof.set("payerName", "Arun Nair");
  proof.set("amountPaid", "170");
  proof.set("transactionReference", "IMPS445566");
  proof.set("receipt", new File([new Uint8Array(png)], "proof.png", { type: "image/png" }));
  const accepted = await bookProofPost(new Request("http://localhost/api/books/pay", { method: "POST", body: proof, headers: { "x-forwarded-for": "proof-view" } }), { params: Promise.resolve({ reference: savedBody.order.reference }) });
  const acceptedBody = await accepted.json() as { verified?: boolean };
  assert.equal(accepted.status, 200, JSON.stringify(acceptedBody));
  assert.equal(acceptedBody.verified, false);
  const hidden = await proofGet(new Request(`http://localhost/api/register/admin/proof?kind=book&reference=${savedBody.order.reference}`));
  assert.equal(hidden.status, 401);
  process.env.TEJAS_ADMIN_TOKEN = "correct-horse-battery";
  try {
    const cookie = `tejas_staff=${createSessionValue()}`;
    const opened = await proofGet(new Request(`http://localhost/api/register/admin/proof?kind=book&reference=${savedBody.order.reference}`, { headers: { cookie } }));
    assert.equal(opened.status, 200);
    assert.equal(opened.headers.get("cache-control"), "private, no-store");
    assert.equal(Buffer.from(await opened.arrayBuffer()).equals(png), true);
    const listed = await caseList(new Request("http://localhost/api/register/admin/cases", { headers: { cookie } }));
    const listedBody = await listed.json() as { orders: { reference: string; total: number; payableToTejas?: number }[] };
    assert.equal(listed.status, 200);
    assert.equal(listedBody.orders.some((order) => order.reference === savedBody.order.reference && order.total === 170), true);
    const other = await proofGet(new Request("http://localhost/api/register/admin/proof?kind=book&reference=TEJAS-2026-ZZZZZZZZZZZZZZZZZZZZ", { headers: { cookie } }));
    assert.equal(other.status, 404);
  } finally {
    delete process.env.TEJAS_ADMIN_TOKEN;
  }
});

test("screenshot types stay limited to images and an e-book proof does not unlock a second entitlement", async () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
  const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([20, 0, 0, 0]), Buffer.from("WEBP"), Buffer.alloc(8)]);
  assert.equal(detectScreenshot(jpeg, "proof.jpg"), "jpg");
  assert.equal(detectScreenshot(renderUtrPng("NEFT123456"), "proof.png"), "png");
  assert.equal(detectScreenshot(webp, "proof.webp"), "webp");
  assert.equal(detectScreenshot(Buffer.from("%PDF-1.7\ntrailer"), "proof.pdf"), null);
  const huge = Buffer.alloc(MAX_RECEIPT_BYTES + 1);
  huge[0] = 0xff; huge[1] = 0xd8; huge[2] = 0xff;
  const order = new FormData();
  order.set("studentName", "Kabir Das");
  order.set("parentName", "Leela Das");
  order.set("mobile", "9898989898");
  order.set("email", "kabir-proof@example.test");
  order.set("schoolName", "River School");
  order.set("className", "VII");
  order.set("streamId", "mathematics");
  order.set("quantity", "1");
  order.set("deliveryAddress", "12 Station Road, Mohali");
  order.set("district", "Mohali");
  order.set("state", "Punjab");
  order.set("pin", "140301");
  const saved = await individualBookPost(new Request("http://localhost/api/books/individual", { method: "POST", body: order, headers: { "x-forwarded-for": "file-types" } }));
  const savedBody = await saved.json() as { order: { reference: string } };
  assert.equal(saved.status, 201, JSON.stringify(savedBody));
  const pdf = new FormData();
  pdf.set("paymentMode", "NEFT");
  pdf.set("paymentDate", "2026-11-14");
  pdf.set("payerName", "Leela Das");
  pdf.set("amountPaid", "170");
  pdf.set("transactionReference", "NEFT667788");
  pdf.set("receipt", new File([Buffer.from("%PDF-1.7\ntrailer")], "proof.pdf", { type: "application/pdf" }));
  const rejectedPdf = await bookProofPost(new Request("http://localhost/api/books/pay", { method: "POST", body: pdf, headers: { "x-forwarded-for": "file-types" } }), { params: Promise.resolve({ reference: savedBody.order.reference }) });
  assert.equal(rejectedPdf.status, 400);
  const oversized = new FormData();
  oversized.set("paymentMode", "NEFT");
  oversized.set("paymentDate", "2026-11-14");
  oversized.set("payerName", "Leela Das");
  oversized.set("amountPaid", "170");
  oversized.set("transactionReference", "NEFT667788");
  oversized.set("receipt", new File([new Uint8Array(huge)], "proof.jpg", { type: "image/jpeg" }));
  const rejectedSize = await bookProofPost(new Request("http://localhost/api/books/pay", { method: "POST", body: oversized, headers: { "x-forwarded-for": "file-types" } }), { params: Promise.resolve({ reference: savedBody.order.reference }) });
  assert.equal(rejectedSize.status, 413);

  const created = await registerStudent({ fullName: "Asha Rao", parentName: "Meera Rao", mobile: "9876543210", schoolName: "River School", password: "river-pass-8", email: "utr-ebook@example.test", streamId: "technology", classLevel: 7 });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const shot = renderUtrPng("NEFT889900");
  const first = await submitEbookProof(created.student.id, "NEFT889900", shot, "proof.png");
  assert.equal(first.ok, true);
  if (first.ok) assert.equal(first.verified, false);
  const second = await submitEbookProof(created.student.id, "NEFT889900", shot, "proof.png");
  assert.equal(second.ok, true);
  const other = await registerStudent({ fullName: "Dev Iyer", parentName: "Meera Rao", mobile: "9876543210", schoolName: "River School", password: "river-pass-8", email: "utr-ebook-2@example.test", streamId: "technology", classLevel: 7 });
  assert.equal(other.ok, true);
  if (!other.ok) return;
  const blocked = await submitEbookProof(other.student.id, "NEFT889900", shot, "proof.png");
  assert.equal(blocked.ok, false);
  const overview = await (await import("@/lib/portal/store")).staffOverview();
  const payments = overview.students.find((student) => student.id === created.student.id)?.payment.filter((item) => item.bookId === "ft-book-1" && item.status !== "superseded");
  assert.equal(payments?.length, 1);
  assert.equal(payments?.[0]?.enteredUtr, "NEFT889900");
  assert.equal(payments?.[0]?.extractedUtr, "NEFT889900");
  assert.equal(payments?.[0]?.bankResult, "unavailable");
  assert.equal(payments?.[0]?.status, "reported");
});

test("staff can list hosted book orders from the case table", async () => {
  const previous = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    token: process.env.TEJAS_ADMIN_TOKEN,
  };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "s".repeat(24);
  process.env.TEJAS_ADMIN_TOKEN = "correct-horse-battery";
  const original = globalThis.fetch;
  const snapshot = {
    kind: "book",
    reference: "TEJAS-2026-ABCDEFGHJKLMNPQRST23",
    channel: "school-book",
    schoolName: "Hosted School",
    lines: [{ streamId: "english", classNumber: 3, quantity: 1 }],
    pan: "AAACB2468H",
    charge: { units: 1, total: 170, schoolShare: 34, payableToTejas: 136, panRequired: false },
    payment: { status: "reported", enteredUtr: "NEFT100001", extractedUtr: null, bankResult: "unavailable", reviewReason: "No trusted bank transaction source is connected, so the payment stays with staff.", receivingAccount: "535402010016278", approvalMethod: "pending" },
    proofExt: "png",
  };
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("tejas_staff_sessions")) return new Response(JSON.stringify({ code: "PGRST205" }), { status: 404, headers: { "content-type": "application/json" } });
    if (url.includes("tejas_case_files")) return new Response(JSON.stringify([{ record_snapshot: snapshot }]), { status: 200, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const hidden = await caseList(new Request("http://localhost/api/register/admin/cases"));
    assert.equal(hidden.status, 401);
    const listed = await caseList(new Request("http://localhost/api/register/admin/cases", { headers: { cookie: `tejas_staff=${createSessionValue()}` } }));
    const body = await listed.json() as { orders?: { reference: string; total: number; schoolShare: number; expectedAmount: number; lines: { quantity: number }[]; maskedPan: string }[] };
    assert.equal(listed.status, 200, JSON.stringify(body));
    assert.equal(body.orders?.[0]?.reference, snapshot.reference);
    assert.deepEqual([body.orders?.[0]?.total, body.orders?.[0]?.schoolShare, body.orders?.[0]?.expectedAmount], [170, 34, 136]);
    assert.equal(body.orders?.[0]?.lines[0]?.quantity, 1);
    assert.equal(JSON.stringify(body).includes("AAACB2468H"), false);
  } finally {
    globalThis.fetch = original;
    if (previous.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
    if (previous.token === undefined) delete process.env.TEJAS_ADMIN_TOKEN;
    else process.env.TEJAS_ADMIN_TOKEN = previous.token;
  }
});
