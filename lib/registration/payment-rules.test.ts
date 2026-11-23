import assert from "node:assert/strict";
import test from "node:test";
import { matchBeneficiary, normaliseBeneficiary, OFFICIAL_BENEFICIARY_FULL } from "@/lib/registration/beneficiary-match";
import {
  BOOK_SHARE_APPROVED,
  calculateEbookPurchase,
  calculateFee,
  calculateIndividualRegistration,
  EBOOK_FEE,
  FEE_SCHOOL,
  FEE_TEJAS,
  FEE_TOTAL,
  PRINTED_BOOKS_AVAILABLE,
} from "@/lib/registration/fee";
import { decideScreenshotPayment, utrsMatch } from "@/lib/registration/payment-decision";
import { parsePaymentScreenshotText, renderUtrPng, extractUtr } from "@/lib/registration/screenshot-ocr";
import {
  claimUtr,
  createMemoryUtrClaimBackend,
  installUtrClaimTestBackend,
  releaseUtr,
  utrKey,
  utrOwner,
} from "@/lib/registration/utr-claim";

test("school registration fee is ₹150 with ₹30 school share and ₹120 to TEJAS", () => {
  assert.equal(FEE_TOTAL, 150);
  assert.equal(FEE_SCHOOL, 30);
  assert.equal(FEE_TEJAS, 120);
  const one = calculateFee(1);
  assert.deepEqual(
    [one.totalStudentFees, one.registrationSchoolShare, one.payableToTejas, one.amountDue, one.printedBooks],
    [150, 30, 120, 120, 0],
  );
  const three = calculateFee(3);
  assert.deepEqual([three.totalStudentFees, three.schoolShare, three.amountDue], [450, 90, 360]);
});

test("individual registration pays full ₹150 per stream with no school share", () => {
  assert.deepEqual(calculateIndividualRegistration(1), {
    units: 1,
    total: 150,
    schoolShare: 0,
    payableToTejas: 150,
    panRequired: false,
  });
  assert.deepEqual(calculateIndividualRegistration(2), {
    units: 2,
    total: 300,
    schoolShare: 0,
    payableToTejas: 300,
    panRequired: false,
  });
  assert.deepEqual(calculateIndividualRegistration(3), {
    units: 3,
    total: 450,
    schoolShare: 0,
    payableToTejas: 450,
    panRequired: false,
  });
  assert.throws(() => calculateIndividualRegistration(0));
});

test("e-book purchase is ₹49 per stream with five mock tests each", () => {
  assert.equal(EBOOK_FEE, 49);
  assert.deepEqual(calculateEbookPurchase(1), {
    streams: 1,
    amountDue: 49,
    ebookCount: 1,
    mockTestsIncluded: 5,
    feePerStream: 49,
  });
  assert.deepEqual(calculateEbookPurchase(2), {
    streams: 2,
    amountDue: 98,
    ebookCount: 2,
    mockTestsIncluded: 10,
    feePerStream: 49,
  });
  assert.deepEqual(calculateEbookPurchase(3), {
    streams: 3,
    amountDue: 147,
    ebookCount: 3,
    mockTestsIncluded: 15,
    feePerStream: 49,
  });
});

test("printed-book extras are ignored in the current release", () => {
  assert.equal(PRINTED_BOOKS_AVAILABLE, false);
  assert.equal(BOOK_SHARE_APPROVED, false);
  const withBooks = calculateFee(2, { printedBooks: 5, ebookAccess: 2 });
  assert.equal(withBooks.printedBooks, 0);
  assert.equal(withBooks.printedBookAmount, 0);
  assert.equal(withBooks.ebookAccess, 0);
  assert.equal(withBooks.amountDue, 240);
});

test("exact UTR match and mismatch", () => {
  assert.equal(utrsMatch("AXIS CN 123456", "AXISCN123456"), true);
  assert.equal(utrsMatch("axiscn123456", "AXISCN123456"), true);
  assert.equal(utrsMatch("AXISCN123456", "AXISCN999999"), false);
  assert.equal(utrsMatch("AXISCN123456", null), false);
});

test("UTR parse rejects missing or unreadable values for auto-approval", () => {
  const missing = decideScreenshotPayment({
    enteredUtr: "AXISCN123456",
    extractedUtr: null,
    extractedBeneficiary: OFFICIAL_BENEFICIARY_FULL,
    extractedAmount: 120,
    paymentStatus: "success",
    expectedAmount: 120,
    ocrConfidence: "high",
    purpose: "registration",
    utrAlreadyUsed: false,
    ocrSource: "tesseractjs",
  });
  assert.equal(missing.outcome, "exception");
  assert.equal(missing.checks.utr, "unreadable");

  const mismatch = decideScreenshotPayment({
    enteredUtr: "AXISCN123456",
    extractedUtr: "AXISCN999999",
    extractedBeneficiary: "TEJAS OLYMPIAD",
    extractedAmount: 120,
    paymentStatus: "success",
    expectedAmount: 120,
    ocrConfidence: "high",
    purpose: "registration",
    utrAlreadyUsed: false,
    ocrSource: "tesseractjs",
  });
  assert.equal(mismatch.outcome, "exception");
  assert.equal(mismatch.checks.utr, "mismatch");
});

test("beneficiary allowlist accepts full name, Trust omission, and verified truncations", () => {
  assert.equal(matchBeneficiary(OFFICIAL_BENEFICIARY_FULL, "ebook").ok, true);
  assert.equal(matchBeneficiary("Vidya Bharti Institute of Training and Research", "ebook").ok, true);
  assert.equal(matchBeneficiary("Vidya Bharti Institute", "ebook").ok, true);
  assert.equal(matchBeneficiary("V.B. Educational Trust", "ebook").ok, true);
  assert.equal(matchBeneficiary("TEJAS OLYMPIAD", "registration").ok, true);
});

test("ambiguous or unrelated beneficiary names are rejected", () => {
  assert.equal(matchBeneficiary(null, "ebook").ok, false);
  const unknown = matchBeneficiary("UNKNOWN", "ebook");
  assert.equal(unknown.ok, false);
  if (!unknown.ok) assert.equal(unknown.reason, "ambiguous");
  const unrelated = matchBeneficiary("Some Random Shop", "ebook");
  assert.equal(unrelated.ok, false);
  if (!unrelated.ok) assert.equal(unrelated.reason, "unrelated");
  assert.equal(matchBeneficiary("Cash", "ebook").ok, false);
});

test("OCR low confidence, wrong amount, and pending/failed screenshots stay exceptions", () => {
  const low = decideScreenshotPayment({
    enteredUtr: "AXISCN123456",
    extractedUtr: "AXISCN123456",
    extractedBeneficiary: OFFICIAL_BENEFICIARY_FULL,
    extractedAmount: 49,
    paymentStatus: "success",
    expectedAmount: 49,
    ocrConfidence: "low",
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: "tesseractjs",
  });
  assert.equal(low.outcome, "exception");

  const wrongAmount = decideScreenshotPayment({
    enteredUtr: "AXISCN123456",
    extractedUtr: "AXISCN123456",
    extractedBeneficiary: OFFICIAL_BENEFICIARY_FULL,
    extractedAmount: 40,
    paymentStatus: "success",
    expectedAmount: 49,
    ocrConfidence: "high",
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: "tesseractjs",
  });
  assert.equal(wrongAmount.checks.amount, "mismatch");

  const pending = decideScreenshotPayment({
    enteredUtr: "AXISCN123456",
    extractedUtr: "AXISCN123456",
    extractedBeneficiary: OFFICIAL_BENEFICIARY_FULL,
    extractedAmount: 49,
    paymentStatus: "pending",
    expectedAmount: 49,
    ocrConfidence: "high",
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: "tesseractjs",
  });
  assert.equal(pending.checks.status, "pending");
  assert.equal(pending.outcome, "exception");
});

test("fixture OCR source can never auto-approve", () => {
  const decision = decideScreenshotPayment({
    enteredUtr: "AXISCN123456",
    extractedUtr: "AXISCN123456",
    extractedBeneficiary: OFFICIAL_BENEFICIARY_FULL,
    extractedAmount: 49,
    paymentStatus: "success",
    expectedAmount: 49,
    ocrConfidence: "high",
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: "fixture",
  });
  assert.equal(decision.outcome, "exception");
});

test("successful screenshot with all conditions is auto-approved without bank-verified label", () => {
  const decision = decideScreenshotPayment({
    enteredUtr: "AXISCN123456",
    extractedUtr: "AXISCN123456",
    extractedBeneficiary: "Vidya Bharti Institute of Training and Research",
    extractedAmount: 98,
    paymentStatus: "success",
    expectedAmount: 98,
    ocrConfidence: "high",
    purpose: "ebook",
    utrAlreadyUsed: false,
    ocrSource: "tesseractjs",
  });
  assert.equal(decision.outcome, "automatic");
  assert.equal(decision.approvalMethod, "screenshot_ocr_automatic");
  assert.equal(decision.verificationLabel, "screenshot_ocr_match");
  assert.match(decision.reason, /not bank-statement confirmation/i);
});

test("duplicate UTR across channels is rejected", async () => {
  installUtrClaimTestBackend(createMemoryUtrClaimBackend());
  try {
    const first = await claimUtr("AXISCN555555", "school-registration", utrOwner("school-registration", "REF-A"));
    assert.equal(first.ok, true);
    const second = await claimUtr("AXISCN555555", "ebook", utrOwner("ebook", "REF-B"));
    assert.equal(second.ok, false);
    if (!second.ok) assert.equal(second.error, "duplicate");
    await releaseUtr("AXISCN555555", utrOwner("school-registration", "REF-A"));
  } finally {
    installUtrClaimTestBackend(null);
  }
});

test("concurrent duplicate UTR submissions: only one claim wins", async () => {
  installUtrClaimTestBackend(createMemoryUtrClaimBackend());
  try {
    const utr = "RACEUTR123456";
    const results = await Promise.all([
      claimUtr(utr, "school-registration", utrOwner("school-registration", "A")),
      claimUtr(utr, "individual-registration", utrOwner("individual-registration", "B")),
      claimUtr(utr, "ebook", utrOwner("ebook", "C")),
    ]);
    const wins = results.filter((item) => item.ok);
    const losses = results.filter((item) => !item.ok);
    assert.equal(wins.length, 1);
    assert.equal(losses.length, 2);
    assert.equal(utrKey(utr), "RACEUTR123456");
  } finally {
    installUtrClaimTestBackend(null);
  }
});

test("fixture UTR PNG is readable and payment text parser finds fields", () => {
  const png = renderUtrPng("AXISCN777777");
  const extracted = extractUtr(png);
  assert.equal(extracted.utr, "AXISCN777777");
  const parsed = parsePaymentScreenshotText(
    "Payment successful\nPaid to: Vidya Bharti Institute of Training and Research Trust\nAmount: ₹49\nUTR: AXISCN777777",
  );
  assert.equal(parsed.utr, "AXISCN777777");
  assert.equal(parsed.amountInr, 49);
  assert.equal(parsed.paymentStatus, "success");
  assert.equal(parsed.confidence, "high");
  assert.equal(normaliseBeneficiary(parsed.beneficiary ?? ""), normaliseBeneficiary(OFFICIAL_BENEFICIARY_FULL));
});
