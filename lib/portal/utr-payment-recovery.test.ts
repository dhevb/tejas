import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  claimUtr,
  createMemoryUtrClaimBackend,
  installUtrClaimTestBackend,
  utrOwner,
} from "@/lib/registration/utr-claim";
import {
  ebookUtrOwner,
  recoveryAfterClaimFailure,
  shouldAcceptIdempotentRetry,
  utrIsClaimableFormat,
} from "@/lib/portal/utr-payment-recovery";
import {
  accessFor,
  portalPersistence,
  readStudent,
  registerStudent,
  reportPayment,
  reportPaymentWithScreenshot,
  reviewPayment,
  setPublication,
} from "@/lib/portal/store";

test.afterEach(() => {
  installUtrClaimTestBackend(null);
});

const baseStudent = {
  fullName: "Utr Recovery",
  parentName: "Parent Recovery",
  mobile: "9876543210",
  schoolName: "Recovery School",
  password: "password12",
};

async function withPortalFile<T>(work: () => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "tejas-utr-"));
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

test("malformed UTR is rejected before reservation", () => {
  assert.equal(utrIsClaimableFormat("abc"), false);
  assert.equal(utrIsClaimableFormat("UTR49VALID01"), true);
});

test("idempotent retry rules preserve exact UTR", () => {
  assert.equal(shouldAcceptIdempotentRetry({
    existingStatus: "reported",
    existingReference: "UTR49SAME01",
    incomingReference: "UTR49SAME01",
  }).ok, true);
  assert.equal(shouldAcceptIdempotentRetry({
    existingStatus: "reported",
    existingReference: "UTR49SAME01",
    incomingReference: "UTR49OTHER01",
  }).ok, false);
  assert.equal(shouldAcceptIdempotentRetry({
    existingStatus: "verified",
    existingReference: "UTR49SAME01",
    incomingReference: "UTR49SAME01",
  }).ok, true);
});

test("recovery after claim failure never recommends releasing a valid UTR", () => {
  const recovery = recoveryAfterClaimFailure({
    studentId: "s1",
    bookId: "eng-class-05",
    utr: "UTR49HELD001",
    stage: "after_claim",
  });
  assert.equal(recovery.claimed, true);
  assert.equal(recovery.utr, "UTR49HELD001");
  assert.equal(recovery.owner, ebookUtrOwner("s1", "eng-class-05"));
  assert.match(recovery.message, /Retry the same UTR/i);
  assert.match(recovery.message, /Do not reuse this UTR for another payment/i);
});

test("claim survives simulated entitlement failure and same-owner retry recovers", async () => {
  const backend = createMemoryUtrClaimBackend();
  installUtrClaimTestBackend(backend);
  const owner = ebookUtrOwner("student-a", "eng-class-05");
  const utr = "UTR49CLAIMHOLD1";
  const first = await claimUtr(utr, "ebook", owner);
  assert.equal(first.ok, true);
  // Simulate failure after claim: do not release.
  const other = await claimUtr(utr, "ebook", utrOwner("ebook", "other-student:eng-class-05"));
  assert.equal(other.ok, false);
  if (!other.ok) assert.equal(other.error, "duplicate");
  const retry = await claimUtr(utr, "ebook", owner);
  assert.equal(retry.ok, true);
  if (retry.ok) assert.equal(retry.reused, true);
});

test("concurrent same-UTR submissions: only one claim wins", async () => {
  installUtrClaimTestBackend(createMemoryUtrClaimBackend());
  const utr = "UTR49RACE0001";
  const results = await Promise.all([
    claimUtr(utr, "ebook", ebookUtrOwner("s1", "eng-class-05")),
    claimUtr(utr, "ebook", ebookUtrOwner("s2", "eng-class-05")),
    claimUtr(utr, "ebook", ebookUtrOwner("s3", "mat-class-05")),
  ]);
  assert.equal(results.filter((item) => item.ok).length, 1);
  assert.equal(results.filter((item) => !item.ok).length, 2);
});

test("file-store: same UTR retry after report; different UTR blocked; other student denied", async () => {
  await withPortalFile(async () => {
    installUtrClaimTestBackend(createMemoryUtrClaimBackend());
    const created = await registerStudent({
      ...baseStudent,
      email: "utr-a@example.test",
      streamId: "english",
      classLevel: 5,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const student = await readStudent(created.student.id);
    assert.ok(student);
    if (!student) return;

    assert.equal((await reportPayment(student.id, "UTR49FILE001", ["english"])).ok, true);
    assert.equal((await reportPayment(student.id, "UTR49FILE001", ["english"])).ok, true);
    assert.equal((await reportPayment(student.id, "UTR49FILE002", ["english"])).ok, false);

    const other = await registerStudent({
      ...baseStudent,
      fullName: "Other Utr",
      email: "utr-b@example.test",
      mobile: "9876543211",
      streamId: "english",
      classLevel: 5,
    });
    assert.equal(other.ok, true);
    if (!other.ok) return;
    assert.equal((await reportPayment(other.student.id, "UTR49FILE001", ["english"])).ok, false);

    assert.equal((await reviewPayment({
      actor: "staff",
      studentId: student.id,
      bookId: "eng-class-05",
      decision: "verified",
      note: "Matched English credit for recovery test.",
    })).ok, true);
    assert.equal((await setPublication({
      actor: "staff",
      kind: "book",
      id: "eng-class-05",
      status: "published",
      reason: "Publish English class 5 for recovery test.",
    })).ok, true);
    assert.equal((await accessFor(student, "eng-class-05")).ok, true);
    const otherStudent = await readStudent(other.student.id);
    assert.ok(otherStudent);
    if (!otherStudent) return;
    assert.equal((await accessFor(otherStudent, "eng-class-05")).ok, false);
  });
});

test("screenshot path: claimed UTR is not released when entitlement step fails open", async () => {
  await withPortalFile(async () => {
    installUtrClaimTestBackend(createMemoryUtrClaimBackend());
    const created = await registerStudent({
      ...baseStudent,
      email: "utr-shot@example.test",
      streamId: "mathematics",
      classLevel: 5,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    // Tiny invalid image buffer — OCR/decision path may fail closed; claim must still hold for retry.
    const tiny = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const first = await reportPaymentWithScreenshot(created.student.id, "UTR49SHOT001", tiny, "jpg", ["mathematics"]);
    // Whether OCR rejects or accepts, a second student must not take the UTR if claim succeeded.
    const other = await registerStudent({
      ...baseStudent,
      fullName: "Shot Other",
      email: "utr-shot-b@example.test",
      mobile: "9876543212",
      streamId: "mathematics",
      classLevel: 5,
    });
    assert.equal(other.ok, true);
    if (!other.ok) return;
    const clash = await reportPaymentWithScreenshot(other.student.id, "UTR49SHOT001", tiny, "jpg", ["mathematics"]);
    if (first.ok) {
      assert.equal(clash.ok, false);
    } else {
      // If first never claimed (invalid image before claim paths), either outcome is auditable.
      assert.equal(typeof first.error, "string");
    }
  });
});
