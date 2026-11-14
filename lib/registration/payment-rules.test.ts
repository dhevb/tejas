import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { POST as individualBookPost } from "@/app/api/books/individual/route";
import { POST as bookProofPost } from "@/app/api/books/[reference]/payment/route";
import { POST as schoolBookPost } from "@/app/api/books/school/route";
import { POST as individualPost } from "@/app/api/register/individual/route";
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
