import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { GET as bookFileGet } from "@/app/api/learn/books/[bookId]/file/route";
import { loadCatalog } from "@/lib/portal/catalog.server";
import { booksForLearner, decideAccess, quoteFee, streamAcceptsClass } from "@/lib/portal/model";
import { openSession, sealSession } from "@/lib/portal/session";
import {
  accessFor,
  dashboard,
  readOwnAttempt,
  readStudent,
  registerStudent,
  reportPayment,
  reviewPayment,
  rotateSession,
  setPublication,
  staffOverview,
  startAttempt,
  submitAttempt,
  updateProfile,
  correctRegistration,
} from "@/lib/portal/store";
import { EBOOK_SALE_OPEN } from "@/lib/registration/fee";

process.env.TEJAS_PORTAL_DATA_DIR = mkdtempSync(path.join(tmpdir(), "tejas-portal-"));
process.env.TEJAS_PORTAL_SECRET = "portal-test-secret-value";
process.env.TEJAS_PORTAL_STORE = "file";

const baseStudent = {
  fullName: "Asha Rao",
  parentName: "Meera Rao",
  mobile: "9876543210",
  schoolName: "River School",
  password: "river-pass-8",
};

test("the catalog is a fresh extraction of the supplied booklets", () => {
  execFileSync("python3", ["scripts/extract_portal_content.py", "--verify"], { encoding: "utf8" });
  const fresh = execFileSync("python3", ["scripts/extract_portal_content.py", "--stdout"], { encoding: "utf8" });
  const saved = readFileSync(path.join(process.cwd(), "content/portal/catalog.json"), "utf8");
  assert.equal(fresh, saved);
  const catalog = loadCatalog();
  assert.equal(catalog.books.length, 2);
  assert.equal(catalog.tests.length, 10);
  assert.equal(catalog.tests.reduce((sum, item) => sum + item.questionCount, 0), 250);
  for (const item of catalog.tests) {
    assert.equal(item.questionCount, 25);
    assert.equal(item.questions.length, 25);
    assert.equal(item.publicationStatus, "awaiting_approval");
    assert.equal(item.answerKeyAvailable, true);
    assert.equal(item.explanationAvailable, true);
    item.questions.forEach((question, index) => {
      assert.equal(question.number, index + 1);
      assert.deepEqual(question.options.map((option) => option.key), ["A", "B", "C", "D"]);
      assert.equal(question.correctCompact, question.correctExplanationRow);
      assert.equal(question.correct, question.correctCompact);
      assert.ok(question.explanation && question.explanation.length > 10);
    });
  }
  const first = catalog.tests[0];
  assert.equal(first.questions.map((question) => question.correct).join(""), "CADCBCABADADABADBCBDBACDC");
  assert.equal(first.questions.filter((question) => question.correct === "A").length, 7);
  assert.equal(first.questions.filter((question) => question.correct === "B").length, 6);
  assert.equal(first.questions.filter((question) => question.correct === "C").length, 6);
  assert.equal(first.questions.filter((question) => question.correct === "D").length, 6);
  assert.equal(catalog.flags.some((flag) => flag.code === "class-mapping-conflict"), true);
  assert.equal(EBOOK_SALE_OPEN, false);
});

test("class lists follow the stream and the fee stays with one book", () => {
  const catalog = loadCatalog();
  assert.equal(streamAcceptsClass("english", 3), true);
  assert.equal(streamAcceptsClass("english", 2), false);
  assert.equal(streamAcceptsClass("mathematics", 10), true);
  assert.equal(streamAcceptsClass("technology", 5), false);
  assert.equal(streamAcceptsClass("technology", 6), true);
  assert.deepEqual(booksForLearner(catalog, "technology", 7).map((book) => book.id), ["ft-book-1"]);
  assert.deepEqual(booksForLearner(catalog, "technology", 9).map((book) => book.id), ["ft-book-2"]);
  assert.deepEqual(booksForLearner(catalog, "english", 7), []);
  const class7 = quoteFee(catalog, "technology", 7);
  assert.equal(class7.status, "payable");
  if (class7.status === "payable") {
    assert.equal(class7.bookId, "ft-book-1");
    assert.equal(class7.amountInr, 49);
    assert.equal(class7.includedMockTests, 5);
    assert.equal(class7.mockTestAmountInr, 0);
  }
  const class9 = quoteFee(catalog, "technology", 9);
  assert.equal(class9.status, "payable");
  if (class9.status === "payable") assert.equal(class9.bookId, "ft-book-2");
  assert.equal(quoteFee(catalog, "english", 5).status, "fee_not_approved");
  assert.equal(quoteFee(catalog, "mathematics", 5).status, "fee_not_approved");
  const denied = decideAccess({
    catalog,
    streamId: "technology",
    classLevel: 9,
    bookId: "ft-book-1",
    bookPublished: true,
    testPublished: true,
    paid: true,
  });
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.reason, "wrong_class");
});

test("a student keeps the registered stream and class, and content stays closed until payment and publication", async () => {
  const created = await registerStudent({ ...baseStudent, email: "asha@example.test", streamId: "technology", classLevel: 7 });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const blocked = await updateProfile(created.student.id, { classLevel: 10, streamId: "english" });
  assert.equal(blocked.ok, false);
  const stored = await readStudent(created.student.id);
  assert.equal(stored?.classLevel, 7);
  assert.equal(stored?.streamId, "technology");
  assert.ok(stored);
  if (!stored) return;

  const otherBook = await accessFor(stored, "ft-book-2", "ft-b2-mt01");
  assert.equal(otherBook.ok, false);
  if (!otherBook.ok) assert.equal(otherBook.reason, "wrong_class");
  const beforePay = await accessFor(stored, "ft-book-1", "ft-b1-mt01");
  assert.equal(beforePay.ok, false);
  if (!beforePay.ok) assert.equal(beforePay.reason, "unpublished");

  assert.equal((await setPublication({ actor: "staff", kind: "book", id: "ft-book-1", status: "published", reason: "Approved for this review environment." })).ok, true);
  assert.equal((await setPublication({ actor: "staff", kind: "test", id: "ft-b1-mt01", status: "published", reason: "Questions checked against the booklet." })).ok, true);
  const unpaid = await accessFor(stored, "ft-book-1", "ft-b1-mt01");
  assert.equal(unpaid.ok, false);
  if (!unpaid.ok) assert.equal(unpaid.reason, "unpaid");

  assert.equal((await reportPayment(stored.id, "UTR49ASHA01")).ok, true);
  const reported = await accessFor(stored, "ft-book-1");
  assert.equal(reported.ok, false);
  assert.equal((await reviewPayment({ actor: "staff", studentId: stored.id, bookId: "ft-book-1", decision: "verified", note: "Bank credit matched." })).ok, true);

  const open = await accessFor(stored, "ft-book-1", "ft-b1-mt01");
  assert.equal(open.ok, true);
  const started = await startAttempt(stored, "ft-b1-mt01");
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const packed = JSON.stringify(started);
  assert.equal(packed.includes("explanation"), false);
  assert.equal(packed.includes("correctCompact"), false);
  assert.equal(started.questions.length, 25);
  assert.equal("correct" in started.questions[0], false);

  const answers: Record<string, string> = {};
  for (const question of loadCatalog().tests[0].questions) {
    if (question.correct) answers[String(question.number)] = question.correct;
  }
  const submitted = await submitAttempt(stored, started.attemptId, answers);
  assert.equal(submitted.ok, true);
  if (!submitted.ok) return;
  assert.equal(submitted.score, 25);
  const own = await readOwnAttempt(stored.id, submitted.attemptId);
  assert.equal(own?.attempt.score, 25);
  const stranger = await registerStudent({ ...baseStudent, fullName: "Dev Iyer", email: "dev@example.test", streamId: "technology", classLevel: 9 });
  assert.equal(stranger.ok, true);
  if (!stranger.ok) return;
  assert.equal(await readOwnAttempt(stranger.student.id, submitted.attemptId), null);
  const class9 = await readStudent(stranger.student.id);
  assert.ok(class9);
  if (!class9) return;
  const class9View = await dashboard(class9);
  assert.deepEqual(class9View.books.map((book) => book.id), ["ft-book-2"]);
  assert.equal(class9View.books[0].canRead, false);

  const catalogStillClosed = JSON.parse(readFileSync(path.join(process.cwd(), "content/portal/catalog.json"), "utf8")) as { tests: { publicationStatus: string }[] };
  assert.equal(catalogStillClosed.tests.every((item) => item.publicationStatus === "awaiting_approval"), true);

  const corrected = await correctRegistration({
    actor: "staff",
    studentId: stored.id,
    classLevel: 9,
    reason: "School confirmed the class was entered as 7.",
  });
  assert.equal(corrected.ok, true);
  const moved = await readStudent(stored.id);
  assert.equal(moved?.classLevel, 9);
  const oldBook = await accessFor(moved!, "ft-book-1");
  assert.equal(oldBook.ok, false);
  if (!oldBook.ok) assert.equal(oldBook.reason, "wrong_class");
  const audit = (await staffOverview()).audit.find((item) => item.action === "correct-registration" && item.studentId === stored.id);
  assert.ok(audit);
  assert.equal(audit?.actor, "staff");
});

test("english registration does not invent a book or a fee", async () => {
  const created = await registerStudent({ ...baseStudent, fullName: "Nia Sen", email: "nia@example.test", streamId: "english", classLevel: 5 });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const student = await readStudent(created.student.id);
  assert.ok(student);
  if (!student) return;
  const view = await dashboard(student);
  assert.equal(view.books.length, 0);
  assert.equal(view.quote.status, "fee_not_approved");
  assert.equal((await reportPayment(student.id, "UTR49ENGLISH")).ok, false);
  assert.equal((await registerStudent({ ...baseStudent, email: "young@example.test", streamId: "technology", classLevel: 5 })).ok, false);
  assert.equal((await registerStudent({ ...baseStudent, email: "low@example.test", streamId: "english", classLevel: 2 })).ok, false);
});

test("the e-book file route refuses an anonymous request", async () => {
  const response = await bookFileGet(new Request("http://localhost/api/learn/books/ft-book-1/file"), { params: Promise.resolve({ bookId: "ft-book-1" }) });
  assert.equal(response.status, 401);
  const body = await response.text();
  assert.equal(body.includes("%PDF"), false);
});

test("a second sign-in replaces the only active session", async () => {
  const created = await registerStudent({ ...baseStudent, fullName: "Om Das", email: "om@example.test", streamId: "mathematics", classLevel: 4 });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const first = await sealSession(created.student.id, 1);
  const replacement = await rotateSession(created.student.id);
  assert.equal(replacement, 2);
  const second = await sealSession(created.student.id, replacement ?? 0);
  const stored = await readStudent(created.student.id);
  const openedFirst = await openSession(first);
  const openedSecond = await openSession(second);
  assert.equal(openedFirst?.studentId, created.student.id);
  assert.notEqual(openedFirst?.sessionVersion, stored?.sessionVersion);
  assert.equal(openedSecond?.sessionVersion, stored?.sessionVersion);
  assert.equal(await openSession(`${second}x`), null);
  assert.equal(await openSession(await sealSession(created.student.id, stored?.sessionVersion ?? 1, Date.now() - 1000)), null);
  const loggedOut = await rotateSession(created.student.id);
  const afterLogout = await readStudent(created.student.id);
  assert.equal(afterLogout?.sessionVersion, loggedOut);
  assert.notEqual(openedSecond?.sessionVersion, afterLogout?.sessionVersion);
});

test("payment status cannot be set by the student and a second report does not add an entitlement", async () => {
  const created = await registerStudent({ ...baseStudent, fullName: "Ria Sen", email: "ria@example.test", streamId: "technology", classLevel: 8 });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const ignored = await updateProfile(created.student.id, { fullName: "Ria Sen", status: "verified", paid: true } as never);
  assert.equal(ignored.ok, true);
  let student = await readStudent(created.student.id);
  assert.ok(student);
  if (!student) return;
  assert.equal((await accessFor(student, "ft-book-1")).ok, false);
  assert.equal((await reportPayment(student.id, "UTR49RIA001")).ok, true);
  assert.equal((await reportPayment(student.id, "UTR49RIA002")).ok, true);
  const overview = await staffOverview();
  const row = overview.students.find((item) => item.id === student?.id);
  assert.equal(row?.payment.filter((item) => item.bookId === "ft-book-1" && item.status !== "superseded").length, 1);
  assert.equal(row?.payment.find((item) => item.bookId === "ft-book-1")?.status, "reported");
  assert.equal((await reviewPayment({ actor: "staff", studentId: student.id, bookId: "ft-book-1", decision: "rejected", note: "The credit was not found." })).ok, true);
  student = await readStudent(created.student.id);
  assert.ok(student);
  if (!student) return;
  assert.equal((await setPublication({ actor: "staff", kind: "book", id: "ft-book-1", status: "published", reason: "Review publication of one book only." })).ok, true);
  const stillUnpaid = await accessFor(student, "ft-book-1");
  assert.equal(stillUnpaid.ok, false);
  if (!stillUnpaid.ok) assert.equal(stillUnpaid.reason, "unpaid");
  const book2 = (await staffOverview()).rows.filter((item) => item.book.startsWith("Book 2"));
  assert.equal(book2.every((item) => item.publicationStatus === "awaiting_approval"), true);
});

test("a submitted score is calculated by the server from the stored key", async () => {
  const created = await registerStudent({ ...baseStudent, fullName: "Kabir Das", email: "kabir@example.test", streamId: "technology", classLevel: 10 });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const student = await readStudent(created.student.id);
  assert.ok(student);
  if (!student) return;
  assert.equal((await reportPayment(student.id, "UTR49KABIR1")).ok, true);
  assert.equal((await reviewPayment({ actor: "staff", studentId: student.id, bookId: "ft-book-2", decision: "verified", note: "Matched the test credit." })).ok, true);
  assert.equal((await setPublication({ actor: "staff", kind: "book", id: "ft-book-2", status: "published", reason: "Review one book for scoring." })).ok, true);
  assert.equal((await setPublication({ actor: "staff", kind: "test", id: "ft-b2-mt01", status: "published", reason: "Review one test for scoring." })).ok, true);
  const bookOne = await accessFor(student, "ft-book-1", "ft-b1-mt01");
  assert.equal(bookOne.ok, false);
  if (!bookOne.ok) assert.equal(bookOne.reason, "wrong_class");
  const started = await startAttempt(student, "ft-b2-mt01");
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const test = loadCatalog().tests.find((item) => item.id === "ft-b2-mt01");
  assert.ok(test);
  const submitted = await submitAttempt(student, started.attemptId, { "1": "A", score: "25", correct: "A" });
  assert.equal(submitted.ok, true);
  if (!submitted.ok || !test) return;
  assert.equal(submitted.score, test.questions[0].correct === "A" ? 1 : 0);
  assert.notEqual(submitted.score, 25);
  const again = await submitAttempt(student, started.attemptId, { "1": "B" });
  assert.equal(again.ok, false);
  const retake = await startAttempt(student, "ft-b2-mt01");
  assert.equal(retake.ok, false);
});

test("a hosted portal does not store a student in a local file", async () => {
  const previousStore = process.env.TEJAS_PORTAL_STORE;
  const previousVercel = process.env.VERCEL;
  delete process.env.TEJAS_PORTAL_STORE;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  process.env.VERCEL = "1";
  try {
    const created = await registerStudent({ ...baseStudent, fullName: "Una Vail", email: "una@example.test", streamId: "english", classLevel: 4 });
    assert.equal(created.ok, false);
    if (!created.ok) assert.match(created.error, /database is not available/);
  } finally {
    process.env.TEJAS_PORTAL_STORE = previousStore;
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  }
});
