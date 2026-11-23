import assert from "node:assert/strict";
import test from "node:test";
import { loadCatalog } from "@/lib/portal/catalog.server";
import { isContentQaAccount } from "@/lib/portal/content-qa";
import { booksForContentQa, booksForLearner, decideAccess } from "@/lib/portal/model";

test("content QA allowlist is exact-email only", () => {
  const previous = process.env.TEJAS_CONTENT_QA_EMAIL;
  process.env.TEJAS_CONTENT_QA_EMAIL = "tejas-content-qa@dhe.org.in";
  try {
    assert.equal(isContentQaAccount("tejas-content-qa@dhe.org.in"), true);
    assert.equal(isContentQaAccount("TEJAS-Content-QA@dhe.org.in"), true);
    assert.equal(isContentQaAccount("other@dhe.org.in"), false);
    assert.equal(isContentQaAccount(""), false);
    assert.equal(isContentQaAccount(null), false);
  } finally {
    if (previous === undefined) delete process.env.TEJAS_CONTENT_QA_EMAIL;
    else process.env.TEJAS_CONTENT_QA_EMAIL = previous;
  }
});

test("content QA may open published books across streams without payment", () => {
  const catalog = loadCatalog();
  const eng = catalog.books.find((book) => book.id === "eng-class-05");
  const mat = catalog.books.find((book) => book.id === "mat-class-10");
  const ft = catalog.books.find((book) => book.id === "ft-book-1");
  assert.ok(eng && mat && ft);

  const ordinary = decideAccess({
    catalog,
    streamId: "technology",
    classLevel: 7,
    bookId: "eng-class-05",
    bookPublished: true,
    testPublished: false,
    paid: true,
  });
  assert.equal(ordinary.ok, false);

  const qaEng = decideAccess({
    catalog,
    streamId: "technology",
    classLevel: 7,
    bookId: "eng-class-05",
    bookPublished: true,
    testPublished: false,
    paid: false,
    contentQa: true,
  });
  assert.equal(qaEng.ok, true);

  const qaMat = decideAccess({
    catalog,
    streamId: "technology",
    classLevel: 7,
    bookId: "mat-class-10",
    bookPublished: true,
    testPublished: false,
    paid: false,
    contentQa: true,
  });
  assert.equal(qaMat.ok, true);

  const qaUnpublished = decideAccess({
    catalog,
    streamId: "technology",
    classLevel: 7,
    bookId: "ft-book-2",
    bookPublished: false,
    testPublished: false,
    paid: false,
    contentQa: true,
  });
  assert.equal(qaUnpublished.ok, false);
  if (!qaUnpublished.ok) assert.equal(qaUnpublished.reason, "unpublished");
});

test("content QA dashboard lists every catalog book while learners stay stream-locked", () => {
  const catalog = loadCatalog();
  assert.equal(booksForContentQa(catalog).length, catalog.books.length);
  assert.equal(booksForLearner(catalog, "english", 5).length, 1);
  assert.equal(booksForLearner(catalog, "english", 5)[0]?.id, "eng-class-05");
  assert.equal(booksForLearner(catalog, "mathematics", 5).every((book) => book.streamId === "mathematics"), true);
});
