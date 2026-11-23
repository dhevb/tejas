import assert from "node:assert/strict";
import test from "node:test";
import { loadCatalog } from "@/lib/portal/catalog.server";
import { decideAccess, quoteFee, testsForBook } from "@/lib/portal/model";
import { calculateEbookPurchase } from "@/lib/registration/fee";

test("five mock tests per paid stream and unpaid stream access stays closed", () => {
  const catalog = loadCatalog();
  const quote = quoteFee(catalog, "english", 5);
  assert.equal(quote.status, "payable");
  if (quote.status !== "payable") return;
  assert.equal(quote.amountInr, 49);
  assert.equal(quote.includedMockTests, 5);
  assert.equal(testsForBook(catalog, quote.bookId).length, 5);

  const unpaid = decideAccess({
    catalog,
    streamId: "english",
    classLevel: 5,
    bookId: quote.bookId,
    bookPublished: true,
    testPublished: true,
    paid: false,
  });
  assert.equal(unpaid.ok, false);
  if (!unpaid.ok) assert.equal(unpaid.reason, "unpaid");

  const otherStream = decideAccess({
    catalog,
    streamId: "mathematics",
    classLevel: 5,
    bookId: quote.bookId,
    bookPublished: true,
    testPublished: true,
    paid: true,
  });
  assert.equal(otherStream.ok, false);
  if (!otherStream.ok) assert.equal(otherStream.reason, "wrong_stream");

  const paid = decideAccess({
    catalog,
    streamId: "english",
    classLevel: 5,
    bookId: quote.bookId,
    bookPublished: true,
    testPublished: true,
    paid: true,
  });
  assert.equal(paid.ok, true);

  assert.equal(calculateEbookPurchase(2).mockTestsIncluded, 10);

  const math10 = quoteFee(catalog, "mathematics", 10);
  assert.equal(math10.status, "payable");
  if (math10.status === "payable") {
    assert.equal(math10.includedMockTests, 5);
    assert.equal(testsForBook(catalog, math10.bookId).length, 5);
    const unpaidMath = decideAccess({
      catalog,
      streamId: "mathematics",
      classLevel: 10,
      bookId: math10.bookId,
      bookPublished: true,
      testPublished: true,
      paid: false,
    });
    assert.equal(unpaidMath.ok, false);
    const paidMath = decideAccess({
      catalog,
      streamId: "mathematics",
      classLevel: 10,
      bookId: math10.bookId,
      bookPublished: true,
      testPublished: true,
      paid: true,
    });
    assert.equal(paidMath.ok, true);
  }
});

test("no printed-book workflow remains in fee helpers for the current release", async () => {
  const fee = await import("@/lib/registration/fee");
  assert.equal(fee.PRINTED_BOOKS_AVAILABLE, false);
  assert.equal(fee.calculateFee(1, { printedBooks: 9 }).printedBooks, 0);
  const form = await import("node:fs").then((fs) => fs.readFileSync("app/schools/register/school-registration-form.tsx", "utf8"));
  assert.match(form, /Printed-book orders are not offered/);
  assert.equal(form.includes("/schools/books"), false);
});
