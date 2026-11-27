import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadCatalog } from "@/lib/portal/catalog.server";
import {
  booksForLibrary,
  booksForStreamSyllabus,
  decideAccess,
  quoteFee,
  quoteFeesForStreams,
} from "@/lib/portal/model";
import {
  accessFor,
  dashboard,
  portalPersistence,
  readStudent,
  registerStudent,
  reportPayment,
  reviewPayment,
  setPublication,
} from "@/lib/portal/store";

const baseStudent = {
  fullName: "Asha Verma",
  parentName: "Ravi Verma",
  mobile: "9876543210",
  schoolName: "TEJAS Demo School",
  password: "password12",
};

async function withPortalFile<T>(work: () => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "tejas-portal-"));
  const previous = {
    store: process.env.TEJAS_PORTAL_STORE,
    dir: process.env.TEJAS_PORTAL_DATA_DIR,
    vercel: process.env.VERCEL,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  process.env.TEJAS_PORTAL_STORE = "file";
  process.env.TEJAS_PORTAL_DATA_DIR = dir;
  delete process.env.VERCEL;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    assert.equal(portalPersistence(), "file");
    return await work();
  } finally {
    await rm(dir, { recursive: true, force: true });
    if (previous.store === undefined) delete process.env.TEJAS_PORTAL_STORE;
    else process.env.TEJAS_PORTAL_STORE = previous.store;
    if (previous.dir === undefined) delete process.env.TEJAS_PORTAL_DATA_DIR;
    else process.env.TEJAS_PORTAL_DATA_DIR = previous.dir;
    if (previous.vercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous.vercel;
    if (previous.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
  }
}

test("multi-stream quotes are ₹49 per selected stream", () => {
  const catalog = loadCatalog();
  const one = quoteFeesForStreams(catalog, ["english"], 7);
  assert.equal(one.status, "payable");
  if (one.status === "payable") assert.equal(one.amountInr, 49);
  const three = quoteFeesForStreams(catalog, ["english", "mathematics", "technology"], 7);
  assert.equal(three.status, "payable");
  if (three.status === "payable") {
    assert.equal(three.amountInr, 147);
    assert.equal(three.lines.length, 3);
  }
});

test("Future Tech syllabus includes Book 1 for class 9–10 Book 2 applicants", () => {
  const catalog = loadCatalog();
  assert.deepEqual(booksForStreamSyllabus(catalog, "technology", 7).map((book) => book.id), ["ft-book-1"]);
  assert.deepEqual(booksForStreamSyllabus(catalog, "technology", 9).map((book) => book.id), ["ft-book-1", "ft-book-2"]);
  assert.deepEqual(booksForLibrary(catalog, ["technology"], 9).map((book) => book.id), ["ft-book-1", "ft-book-2"]);
  const openBook1 = decideAccess({
    catalog,
    streamId: "technology",
    classLevel: 9,
    bookId: "ft-book-1",
    bookPublished: true,
    testPublished: false,
    paid: true,
    entitledStreamIds: ["technology"],
  });
  assert.equal(openBook1.ok, true);
  const denyEnglish = decideAccess({
    catalog,
    streamId: "technology",
    classLevel: 9,
    bookId: "eng-class-09",
    bookPublished: true,
    testPublished: false,
    paid: true,
    entitledStreamIds: ["technology"],
  });
  assert.equal(denyEnglish.ok, false);
});

test("one email can register and unlock multiple streams without overwriting", async () => {
  await withPortalFile(async () => {
    const created = await registerStudent({
      ...baseStudent,
      email: "multi@example.test",
      streamIds: ["english", "mathematics", "technology"],
      classLevel: 7,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const student = await readStudent(created.student.id);
    assert.ok(student);
    if (!student) return;
    const before = await dashboard(student);
    assert.equal(before.books.some((book) => book.id === "eng-class-07"), true);
    assert.equal(before.books.some((book) => book.id === "mat-class-07"), true);
    assert.equal(before.books.some((book) => book.id === "ft-book-1"), true);
    assert.equal(before.books.every((book) => book.canRead === false), true);

    // One exact UTR per stream — grouped single-UTR multi-stream is refused until schema approval.
    assert.equal((await reportPayment(student.id, "UTR49MULTI1", ["english", "mathematics", "technology"])).ok, false);
    assert.equal((await reportPayment(student.id, "UTR49MULTI1", ["english"])).ok, true);
    assert.equal((await reportPayment(student.id, "UTR49MULTI2", ["mathematics"])).ok, true);
    assert.equal((await reportPayment(student.id, "UTR49MULTI3", ["technology"])).ok, true);
    assert.equal((await reviewPayment({ actor: "staff", studentId: student.id, bookId: "eng-class-07", decision: "verified", note: "Matched English credit." })).ok, true);
    assert.equal((await reviewPayment({ actor: "staff", studentId: student.id, bookId: "mat-class-07", decision: "verified", note: "Matched Maths credit." })).ok, true);
    assert.equal((await reviewPayment({ actor: "staff", studentId: student.id, bookId: "ft-book-1", decision: "verified", note: "Matched Future Tech credit." })).ok, true);
    assert.equal((await setPublication({ actor: "staff", kind: "book", id: "eng-class-07", status: "published", reason: "Publish English class 7 book." })).ok, true);
    assert.equal((await setPublication({ actor: "staff", kind: "book", id: "mat-class-07", status: "published", reason: "Publish Maths class 7 book." })).ok, true);
    assert.equal((await setPublication({ actor: "staff", kind: "book", id: "ft-book-1", status: "published", reason: "Publish Future Tech book 1." })).ok, true);

    assert.equal((await accessFor(student, "eng-class-07")).ok, true);
    assert.equal((await accessFor(student, "mat-class-07")).ok, true);
    assert.equal((await accessFor(student, "ft-book-1")).ok, true);
    assert.equal((await accessFor(student, "eng-class-08")).ok, false);

    const again = await reportPayment(student.id, "UTR49MULTI2", ["english"]);
    assert.equal(again.ok, false);
  });
});

test("Future Tech Book 2 payment unlocks Book 1 without a second charge", async () => {
  await withPortalFile(async () => {
    const created = await registerStudent({
      ...baseStudent,
      email: "ftbook2@example.test",
      streamId: "technology",
      classLevel: 9,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const student = await readStudent(created.student.id);
    assert.ok(student);
    if (!student) return;
    const unpaid = await dashboard(student);
    assert.deepEqual(unpaid.books.map((book) => book.id).sort(), ["ft-book-1", "ft-book-2"]);
    assert.equal(unpaid.books.find((book) => book.id === "ft-book-1")?.syllabusCompanion, true);
    assert.equal(unpaid.books.find((book) => book.id === "ft-book-1")?.amountInr, 0);
    assert.equal(quoteFee(loadCatalog(), "technology", 9).status === "payable"
      && quoteFee(loadCatalog(), "technology", 9).status === "payable"
      ? quoteFee(loadCatalog(), "technology", 9).amountInr
      : 0, 49);

    assert.equal((await reportPayment(student.id, "UTR49FTBOOK2")).ok, true);
    assert.equal((await reviewPayment({ actor: "staff", studentId: student.id, bookId: "ft-book-2", decision: "verified", note: "Matched Future Tech credit." })).ok, true);
    assert.equal((await setPublication({ actor: "staff", kind: "book", id: "ft-book-1", status: "published", reason: "Publish Future Tech book 1 for syllabus." })).ok, true);
    assert.equal((await setPublication({ actor: "staff", kind: "book", id: "ft-book-2", status: "published", reason: "Publish Future Tech book 2 for syllabus." })).ok, true);

    assert.equal((await accessFor(student, "ft-book-1")).ok, true);
    assert.equal((await accessFor(student, "ft-book-2")).ok, true);
    assert.equal((await accessFor(student, "eng-class-09")).ok, false);
    assert.equal((await setPublication({ actor: "staff", kind: "test", id: "ft-b1-mt01", status: "published", reason: "Publish Book 1 mock." })).ok, true);
    assert.equal((await setPublication({ actor: "staff", kind: "test", id: "ft-b2-mt01", status: "published", reason: "Publish Book 2 mock." })).ok, true);
    const companionMock = await accessFor(student, "ft-book-1", "ft-b1-mt01");
    assert.equal(companionMock.ok, false);
    assert.equal((await accessFor(student, "ft-book-2", "ft-b2-mt01")).ok, true);
    const paidView = await dashboard(student);
    assert.equal(paidView.books.every((book) => book.canRead), true);
    assert.equal(paidView.books.find((book) => book.id === "ft-book-1")?.tests.every((test) => test.canStart === false), true);
    assert.equal(paidView.books.find((book) => book.id === "ft-book-2")?.tests.some((test) => test.id === "ft-b2-mt01" && test.canStart), true);
  });
});

test("pending payment does not grant access and one stream does not unlock another", async () => {
  await withPortalFile(async () => {
    const created = await registerStudent({
      ...baseStudent,
      email: "pending@example.test",
      streamIds: ["english", "mathematics"],
      classLevel: 5,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const student = await readStudent(created.student.id);
    assert.ok(student);
    if (!student) return;
    assert.equal((await reportPayment(student.id, "UTR49PEND01", ["english"])).ok, true);
    assert.equal((await setPublication({ actor: "staff", kind: "book", id: "eng-class-05", status: "published", reason: "Publish English class 5." })).ok, true);
    assert.equal((await setPublication({ actor: "staff", kind: "book", id: "mat-class-05", status: "published", reason: "Publish Maths class 5." })).ok, true);
    const pending = await accessFor(student, "eng-class-05");
    assert.equal(pending.ok, false);
    if (!pending.ok) assert.equal(pending.reason, "unpaid");
    assert.equal((await reviewPayment({ actor: "staff", studentId: student.id, bookId: "eng-class-05", decision: "verified", note: "Matched English only." })).ok, true);
    assert.equal((await accessFor(student, "eng-class-05")).ok, true);
    const maths = await accessFor(student, "mat-class-05");
    assert.equal(maths.ok, false);
    if (!maths.ok) assert.equal(maths.reason, "unpaid");
  });
});

test("different students sharing an email are not created as duplicates", async () => {
  await withPortalFile(async () => {
    const first = await registerStudent({
      ...baseStudent,
      email: "shared@example.test",
      streamId: "english",
      classLevel: 6,
    });
    assert.equal(first.ok, true);
    const second = await registerStudent({
      ...baseStudent,
      fullName: "Other Student",
      email: "shared@example.test",
      streamId: "mathematics",
      classLevel: 6,
    });
    assert.equal(second.ok, false);
  });
});
