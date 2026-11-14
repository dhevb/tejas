import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseIndianMobile } from "@/lib/registration/fields";
import { portalDataDir } from "@/lib/portal/paths";
import { streamById, type StreamId } from "@/lib/registration/schema";
import { loadCatalog } from "@/lib/portal/catalog.server";
import {
  booksForLearner,
  contentChecked,
  decideAccess,
  publicationOf,
  quoteFee,
  scoreAnswers,
  streamAcceptsClass,
  testsForBook,
  toPublicQuestion,
  type PortalCatalog,
  type PublicationStatus,
  type PublicQuestion,
} from "@/lib/portal/model";
import { hashPassword, passwordIsAcceptable, passwordMatches } from "@/lib/portal/session";
import { durableStorageConfigured } from "@/lib/registration/durable";
import { PortalUnavailable } from "@/lib/portal/supabase-rest";

const DATABASE_UNAVAILABLE = "The student portal database is not available.";

export function portalPersistence(): "file" | "remote" | "unavailable" {
  if (process.env.TEJAS_PORTAL_STORE === "file") return "file";
  if (durableStorageConfigured()) return "remote";
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") return "unavailable";
  return "file";
}

export { PortalUnavailable };

export type PaymentState = "unpaid" | "reported" | "verified" | "rejected" | "superseded";

export type PortalStudent = {
  id: string;
  createdAt: string;
  fullName: string;
  parentName: string;
  mobile: string;
  email: string;
  schoolName: string;
  passwordHash: string;
  passwordSalt: string;
  streamId: StreamId;
  classLevel: number;
  /** Incremented on each sign-in and on logout. Older cookies stop matching. */
  sessionVersion: number;
};

export type Entitlement = {
  id: string;
  studentId: string;
  bookId: string;
  amountInr: number;
  includedMockTests: number;
  mockTestAmountInr: 0;
  status: PaymentState;
  transactionReference: string | null;
  reportedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  note: string | null;
};

export type Attempt = {
  id: string;
  studentId: string;
  testId: string;
  bookId: string;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string;
  answers: Record<string, string>;
  score: number | null;
  maxScore: number;
  status: "open" | "submitted" | "expired";
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  studentId: string | null;
  reason: string;
  before: unknown;
  after: unknown;
};

type Database = {
  students: PortalStudent[];
  entitlements: Entitlement[];
  attempts: Attempt[];
  audit: AuditEvent[];
  publication: { books: Record<string, PublicationStatus>; tests: Record<string, PublicationStatus> };
};

const EMPTY: Database = { students: [], entitlements: [], attempts: [], audit: [], publication: { books: {}, tests: {} } };

function portalFile(): string {
  return path.join(portalDataDir(), "portal.json");
}

let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

async function readDb(): Promise<Database> {
  try {
    const parsed = JSON.parse(await readFile(portalFile(), "utf8")) as Database;
    parsed.students ??= [];
    parsed.entitlements ??= [];
    parsed.attempts ??= [];
    parsed.audit ??= [];
    parsed.publication ??= { books: {}, tests: {} };
    parsed.publication.books ??= {};
    parsed.publication.tests ??= {};
    return parsed;
  } catch {
    return structuredClone(EMPTY);
  }
}

async function writeDb(db: Database): Promise<void> {
  const file = portalFile();
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(db), { mode: 0o600 });
  await rename(temporary, file);
}

export type PublicStudent = {
  id: string;
  fullName: string;
  parentName: string;
  mobile: string;
  email: string;
  schoolName: string;
  streamId: StreamId;
  streamName: string;
  classLevel: number;
};

export function toPublicStudent(student: PortalStudent): PublicStudent {
  return {
    id: student.id,
    fullName: student.fullName,
    parentName: student.parentName,
    mobile: student.mobile,
    email: student.email,
    schoolName: student.schoolName,
    streamId: student.streamId,
    streamName: streamById(student.streamId).name,
    classLevel: student.classLevel,
  };
}

const NAME_RE = /^[\p{L}][\p{L} .'-]{0,78}[\p{L}.]$/u;

function cleanName(value: unknown, label: string): string | { error: string } {
  if (typeof value !== "string" || !NAME_RE.test(value.trim())) return { error: `Enter the ${label}.` };
  return value.trim().replace(/\s+/g, " ");
}

function cleanSchool(value: unknown): string | { error: string } {
  if (typeof value !== "string") return { error: "Enter the school name." };
  const school = value.trim().replace(/\s+/g, " ");
  if (school.length < 3 || school.length > 120) return { error: "Enter the school name." };
  return school;
}

function cleanEmail(value: unknown): string | { error: string } {
  if (typeof value !== "string") return { error: "Enter a valid email address." };
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return { error: "Enter a valid email address." };
  return email;
}

export type RegisterInput = {
  fullName?: unknown;
  parentName?: unknown;
  mobile?: unknown;
  email?: unknown;
  schoolName?: unknown;
  password?: unknown;
  streamId?: unknown;
  classLevel?: unknown;
};

export async function registerStudent(input: RegisterInput): Promise<{ ok: true; student: PublicStudent } | { ok: false; error: string }> {
  if ("streamLocked" in input || "classLocked" in input || "fee" in input || "paid" in input) {
    return { ok: false, error: "Stream, class and payment are set by the server." };
  }
  const fullName = cleanName(input.fullName, "student name");
  if (typeof fullName !== "string") return { ok: false, error: fullName.error };
  const parentName = cleanName(input.parentName, "parent or guardian name");
  if (typeof parentName !== "string") return { ok: false, error: parentName.error };
  const schoolName = cleanSchool(input.schoolName);
  if (typeof schoolName !== "string") return { ok: false, error: schoolName.error };
  const email = cleanEmail(input.email);
  if (typeof email !== "string") return { ok: false, error: email.error };
  const mobile = typeof input.mobile === "string" ? parseIndianMobile(input.mobile) : null;
  if (!mobile) return { ok: false, error: "Enter a valid Indian mobile number." };
  if (typeof input.password !== "string" || !passwordIsAcceptable(input.password)) {
    return { ok: false, error: "Use a password of 8 to 72 characters." };
  }
  const streamId = input.streamId;
  if (streamId !== "english" && streamId !== "mathematics" && streamId !== "technology") {
    return { ok: false, error: "Select a stream." };
  }
  const classLevel = typeof input.classLevel === "number" ? input.classLevel : Number(input.classLevel);
  if (!Number.isInteger(classLevel) || !streamAcceptsClass(streamId, classLevel)) {
    return { ok: false, error: "Select a class offered for this stream." };
  }
  const mode = portalPersistence();
  if (mode === "unavailable") return { ok: false, error: DATABASE_UNAVAILABLE };
  if (mode === "remote") {
    const { remoteRegister } = await import("@/lib/portal/remote-store");
    return remoteRegister({ fullName, parentName, mobile, email, schoolName, password: input.password, streamId, classLevel });
  }
  return withLock(async () => {
    const db = await readDb();
    if (db.students.some((student) => student.email === email)) return { ok: false, error: "An account with this email already exists." };
    const password = hashPassword(input.password as string);
    const student: PortalStudent = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      fullName,
      parentName,
      mobile,
      email,
      schoolName,
      passwordHash: password.hash,
      passwordSalt: password.salt,
      streamId,
      classLevel,
      sessionVersion: 1,
    };
    db.students.push(student);
    const quote = quoteFee(loadCatalog(), streamId, classLevel);
    if (quote.status === "payable") {
      db.entitlements.push({
        id: randomUUID(),
        studentId: student.id,
        bookId: quote.bookId,
        amountInr: quote.amountInr,
        includedMockTests: quote.includedMockTests,
        mockTestAmountInr: 0,
        status: "unpaid",
        transactionReference: null,
        reportedAt: null,
        verifiedAt: null,
        verifiedBy: null,
        note: null,
      });
    }
    db.audit.push(event("student", "register", student.id, "Student registered. Stream and class were stored from the form and locked.", null, {
      streamId,
      classLevel,
    }));
    await writeDb(db);
    return { ok: true as const, student: toPublicStudent(student) };
  });
}

export async function authenticate(emailInput: unknown, password: unknown): Promise<{ ok: true; student: PublicStudent } | { ok: false; error: string; unavailable?: boolean }> {
  const mode = portalPersistence();
  const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
  if (!email || typeof password !== "string") return { ok: false, error: "The email or password was not accepted." };
  if (mode === "unavailable") return { ok: false, error: DATABASE_UNAVAILABLE, unavailable: true };
  if (mode === "remote") {
    const { remoteAuthenticate } = await import("@/lib/portal/remote-store");
    return remoteAuthenticate(email, password);
  }
  const db = await readDb();
  const student = db.students.find((item) => item.email === email);
  if (!student || !passwordMatches(password, student.passwordSalt, student.passwordHash)) return { ok: false, error: "The email or password was not accepted." };
  return { ok: true, student: toPublicStudent(student) };
}

export async function readStudent(id: string): Promise<PortalStudent | null> {
  const mode = portalPersistence();
  if (mode === "unavailable") throw new PortalUnavailable();
  if (mode === "remote") {
    const { remoteReadStudent } = await import("@/lib/portal/remote-store");
    return remoteReadStudent(id);
  }
  const db = await readDb();
  const student = db.students.find((item) => item.id === id);
  if (!student) return null;
  student.sessionVersion ??= 1;
  return student;
}

/** Replace the one active session for this account. Earlier cookies no longer match. */
export async function rotateSession(studentId: string): Promise<number | null> {
  const mode = portalPersistence();
  if (mode === "unavailable") throw new PortalUnavailable();
  if (mode === "remote") {
    const { remoteRotateSession } = await import("@/lib/portal/remote-store");
    return remoteRotateSession(studentId);
  }
  return withLock(async () => {
    const db = await readDb();
    const student = db.students.find((item) => item.id === studentId);
    if (!student) return null;
    student.sessionVersion = (student.sessionVersion ?? 1) + 1;
    await writeDb(db);
    return student.sessionVersion;
  });
}

export type ProfileInput = {
  fullName?: unknown;
  parentName?: unknown;
  mobile?: unknown;
  schoolName?: unknown;
  password?: unknown;
  streamId?: unknown;
  classLevel?: unknown;
};

export async function updateProfile(studentId: string, input: ProfileInput): Promise<{ ok: true; student: PublicStudent } | { ok: false; error: string }> {
  if ("streamId" in input || "classLevel" in input) {
    return { ok: false, error: "Stream and class cannot be changed from the student account." };
  }
  const mode = portalPersistence();
  if (mode === "unavailable") return { ok: false, error: DATABASE_UNAVAILABLE };
  if (mode === "remote") {
    const patch: Record<string, string> = {};
    if (input.fullName !== undefined) {
      const fullName = cleanName(input.fullName, "student name");
      if (typeof fullName !== "string") return { ok: false, error: fullName.error };
      patch.full_name = fullName;
    }
    if (input.parentName !== undefined) {
      const parentName = cleanName(input.parentName, "parent or guardian name");
      if (typeof parentName !== "string") return { ok: false, error: parentName.error };
      patch.parent_name = parentName;
    }
    if (input.schoolName !== undefined) {
      const schoolName = cleanSchool(input.schoolName);
      if (typeof schoolName !== "string") return { ok: false, error: schoolName.error };
      patch.school_name = schoolName;
    }
    if (input.mobile !== undefined) {
      const mobile = typeof input.mobile === "string" ? parseIndianMobile(input.mobile) : null;
      if (!mobile) return { ok: false, error: "Enter a valid Indian mobile number." };
      patch.mobile = mobile;
    }
    if (input.password !== undefined) {
      if (typeof input.password !== "string" || !passwordIsAcceptable(input.password)) return { ok: false, error: "Use a password of 8 to 72 characters." };
      const password = hashPassword(input.password);
      patch.password_hash = password.hash;
      patch.password_salt = password.salt;
    }
    const { remoteUpdateProfile } = await import("@/lib/portal/remote-store");
    return remoteUpdateProfile(studentId, patch);
  }
  return withLock(async () => {
    const db = await readDb();
    const student = db.students.find((item) => item.id === studentId);
    if (!student) return { ok: false, error: "Account not found." };
    if (input.fullName !== undefined) {
      const fullName = cleanName(input.fullName, "student name");
      if (typeof fullName !== "string") return { ok: false, error: fullName.error };
      student.fullName = fullName;
    }
    if (input.parentName !== undefined) {
      const parentName = cleanName(input.parentName, "parent or guardian name");
      if (typeof parentName !== "string") return { ok: false, error: parentName.error };
      student.parentName = parentName;
    }
    if (input.schoolName !== undefined) {
      const schoolName = cleanSchool(input.schoolName);
      if (typeof schoolName !== "string") return { ok: false, error: schoolName.error };
      student.schoolName = schoolName;
    }
    if (input.mobile !== undefined) {
      const mobile = typeof input.mobile === "string" ? parseIndianMobile(input.mobile) : null;
      if (!mobile) return { ok: false, error: "Enter a valid Indian mobile number." };
      student.mobile = mobile;
    }
    if (input.password !== undefined) {
      if (typeof input.password !== "string" || !passwordIsAcceptable(input.password)) return { ok: false, error: "Use a password of 8 to 72 characters." };
      const password = hashPassword(input.password);
      student.passwordHash = password.hash;
      student.passwordSalt = password.salt;
    }
    await writeDb(db);
    return { ok: true as const, student: toPublicStudent(student) };
  });
}

function event(actor: string, action: string, studentId: string | null, reason: string, before: unknown, after: unknown): AuditEvent {
  return { id: randomUUID(), at: new Date().toISOString(), actor, action, studentId, reason, before, after };
}

export async function correctRegistration(input: {
  actor: string;
  studentId: string;
  streamId?: StreamId;
  classLevel?: number;
  reason: string;
}): Promise<{ ok: true; student: PublicStudent } | { ok: false; error: string }> {
  const reason = input.reason.trim();
  if (reason.length < 10) return { ok: false, error: "Record a reason of at least 10 characters." };
  if (!input.streamId && input.classLevel === undefined) return { ok: false, error: "Choose the corrected stream or class." };
  const mode = portalPersistence();
  if (mode === "unavailable") return { ok: false, error: DATABASE_UNAVAILABLE };
  if (mode === "remote") {
    const student = await readStudent(input.studentId);
    if (!student) return { ok: false, error: "Account not found." };
    const nextStream = input.streamId ?? student.streamId;
    const nextClass = input.classLevel ?? student.classLevel;
    if (!streamAcceptsClass(nextStream, nextClass)) return { ok: false, error: "That class is not offered for the selected stream." };
    const quote = quoteFee(loadCatalog(), nextStream, nextClass);
    const { remoteCorrect } = await import("@/lib/portal/remote-store");
    const saved = await remoteCorrect({
      actor: input.actor,
      studentId: input.studentId,
      streamId: nextStream,
      classLevel: nextClass,
      bookId: quote.status === "payable" ? quote.bookId : null,
      amountInr: quote.status === "payable" ? quote.amountInr : 0,
      includedMockTests: quote.status === "payable" ? quote.includedMockTests : 0,
      reason,
    });
    if (!saved.ok) return saved;
    const updated = await readStudent(input.studentId);
    if (!updated) return { ok: false, error: "Account not found." };
    return { ok: true as const, student: toPublicStudent(updated) };
  }
  return withLock(async () => {
    const db = await readDb();
    const student = db.students.find((item) => item.id === input.studentId);
    if (!student) return { ok: false, error: "Account not found." };
    const nextStream = input.streamId ?? student.streamId;
    const nextClass = input.classLevel ?? student.classLevel;
    if (!streamAcceptsClass(nextStream, nextClass)) return { ok: false, error: "That class is not offered for the selected stream." };
    const before = { streamId: student.streamId, classLevel: student.classLevel };
    student.streamId = nextStream;
    student.classLevel = nextClass;
    for (const entitlement of db.entitlements) {
      if (entitlement.studentId === student.id && entitlement.status !== "superseded") {
        entitlement.status = "superseded";
        entitlement.note = "Superseded because staff corrected the stream or class.";
      }
    }
    const quote = quoteFee(loadCatalog(), nextStream, nextClass);
    if (quote.status === "payable") {
      db.entitlements.push({
        id: randomUUID(),
        studentId: student.id,
        bookId: quote.bookId,
        amountInr: quote.amountInr,
        includedMockTests: quote.includedMockTests,
        mockTestAmountInr: 0,
        status: "unpaid",
        transactionReference: null,
        reportedAt: null,
        verifiedAt: null,
        verifiedBy: null,
        note: "Created after a staff correction. Earlier payment does not transfer.",
      });
    }
    db.audit.push(event(input.actor, "correct-registration", student.id, reason, before, { streamId: nextStream, classLevel: nextClass }));
    await writeDb(db);
    return { ok: true as const, student: toPublicStudent(student) };
  });
}

function activeEntitlement(db: Database, studentId: string, bookId: string): Entitlement | undefined {
  return db.entitlements.find((item) => item.studentId === studentId && item.bookId === bookId && item.status !== "superseded");
}

export async function reportPayment(studentId: string, transactionReference: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const reference = transactionReference.trim();
  if (reference.length < 6 || reference.length > 80) return { ok: false, error: "Enter the transaction reference." };
  const mode = portalPersistence();
  if (mode === "unavailable") return { ok: false, error: DATABASE_UNAVAILABLE };
  if (mode === "remote") {
    const student = await readStudent(studentId);
    if (!student) return { ok: false, error: "Account not found." };
    const quote = quoteFee(loadCatalog(), student.streamId, student.classLevel);
    if (quote.status !== "payable") return { ok: false, error: "There is no approved e-book fee for this account." };
    const { remoteReportPayment } = await import("@/lib/portal/remote-store");
    return remoteReportPayment(studentId, quote.bookId, reference, quote.amountInr);
  }
  return withLock(async () => {
    const db = await readDb();
    const student = db.students.find((item) => item.id === studentId);
    if (!student) return { ok: false, error: "Account not found." };
    const quote = quoteFee(loadCatalog(), student.streamId, student.classLevel);
    if (quote.status !== "payable") return { ok: false, error: "There is no approved e-book fee for this account." };
    const entitlement = activeEntitlement(db, student.id, quote.bookId);
    if (!entitlement) return { ok: false, error: "No entitlement record exists for this e-book." };
    if (entitlement.amountInr !== quote.amountInr || entitlement.mockTestAmountInr !== 0) {
      return { ok: false, error: "The stored fee does not match the approved price." };
    }
    if (entitlement.status === "verified") return { ok: false, error: "Payment is already verified." };
    entitlement.status = "reported";
    entitlement.transactionReference = reference;
    entitlement.reportedAt = new Date().toISOString();
    entitlement.note = "Reported by the student. Content stays locked until staff verification.";
    db.audit.push(event("student", "report-payment", student.id, "Student reported a payment reference.", null, { bookId: quote.bookId, amountInr: quote.amountInr }));
    await writeDb(db);
    return { ok: true as const };
  });
}

export async function reviewPayment(input: {
  actor: string;
  studentId: string;
  bookId: string;
  decision: "verified" | "rejected";
  note: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const note = input.note.trim();
  if (note.length < 5) return { ok: false, error: "Record a verification note." };
  const mode = portalPersistence();
  if (mode === "unavailable") return { ok: false, error: DATABASE_UNAVAILABLE };
  if (mode === "remote") {
    const { remoteReviewPayment } = await import("@/lib/portal/remote-store");
    return remoteReviewPayment(input);
  }
  return withLock(async () => {
    const db = await readDb();
    const entitlement = activeEntitlement(db, input.studentId, input.bookId);
    if (!entitlement || entitlement.status === "unpaid") return { ok: false, error: "No reported payment exists for this e-book." };
    entitlement.status = input.decision;
    entitlement.note = note;
    entitlement.verifiedAt = new Date().toISOString();
    entitlement.verifiedBy = input.actor;
    db.audit.push(event(input.actor, "review-payment", input.studentId, note, null, { bookId: input.bookId, decision: input.decision }));
    await writeDb(db);
    return { ok: true as const };
  });
}

export async function setPublication(input: {
  actor: string;
  kind: "book" | "test";
  id: string;
  status: PublicationStatus;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const reason = input.reason.trim();
  if (reason.length < 10) return { ok: false, error: "Record why this publication status is changing." };
  const catalog = loadCatalog();
  if (input.kind === "book" && !catalog.books.some((book) => book.id === input.id)) return { ok: false, error: "Unknown book." };
  if (input.kind === "test") {
    const test = catalog.tests.find((item) => item.id === input.id);
    if (!test) return { ok: false, error: "Unknown mock test." };
    if (input.status === "published" && !contentChecked(test)) return { ok: false, error: "This test cannot be published until its questions, options and answer key are complete." };
  }
  if (input.status !== "published" && input.status !== "awaiting_approval") return { ok: false, error: "Unknown publication status." };
  const mode = portalPersistence();
  if (mode === "unavailable") return { ok: false, error: DATABASE_UNAVAILABLE };
  if (mode === "remote") {
    const { remoteSetPublication } = await import("@/lib/portal/remote-store");
    return remoteSetPublication(input);
  }
  return withLock(async () => {
    const db = await readDb();
    const bucket = input.kind === "book" ? db.publication.books : db.publication.tests;
    const before = bucket[input.id] ?? "awaiting_approval";
    bucket[input.id] = input.status;
    db.audit.push(event(input.actor, "set-publication", null, reason, { kind: input.kind, id: input.id, status: before }, { status: input.status }));
    await writeDb(db);
    return { ok: true as const };
  });
}

function paidFor(db: Database, studentId: string, bookId: string): boolean {
  return db.entitlements.some((item) => item.studentId === studentId && item.bookId === bookId && item.status === "verified");
}

export async function publicBookPublication(): Promise<
  | {
      ok: true;
      feeInr: number;
      books: {
        id: string;
        number: number;
        title: string;
        classes: number[];
        published: boolean;
        publishedTests: number;
        totalTests: number;
      }[];
    }
  | { ok: false }
> {
  try {
    const mode = portalPersistence();
    if (mode === "unavailable") return { ok: false };
    const catalog = loadCatalog();
    const publication = mode === "remote"
      ? await (await import("@/lib/portal/remote-store")).remotePublicationMap()
      : (await readDb()).publication;
    return {
      ok: true,
      feeInr: catalog.feeInr,
      books: catalog.books.map((book) => {
        const tests = testsForBook(catalog, book.id);
        return {
          id: book.id,
          number: book.bookNumber,
          title: book.title,
          classes: [...book.assignedClasses],
          published: publicationOf(book.publicationStatus, publication.books[book.id]) === "published",
          publishedTests: tests.filter((test) => publicationOf(test.publicationStatus, publication.tests[test.id]) === "published").length,
          totalTests: tests.length,
        };
      }),
    };
  } catch {
    return { ok: false };
  }
}

export async function accessFor(student: PortalStudent, bookId: string, testId?: string | null) {
  if (portalPersistence() === "unavailable") {
    const catalog = loadCatalog();
    return decideAccess({
      catalog,
      streamId: student.streamId,
      classLevel: student.classLevel,
      bookId,
      testId,
      bookPublished: false,
      testPublished: false,
      paid: false,
    });
  }
  if (portalPersistence() === "remote") {
    const { remoteAccessFor } = await import("@/lib/portal/remote-store");
    return remoteAccessFor(student, bookId, testId);
  }
  const db = await readDb();
  const catalog = loadCatalog();
  const bookPublished = publicationOf(catalog.books.find((book) => book.id === bookId)?.publicationStatus ?? "awaiting_approval", db.publication.books[bookId]) === "published";
  const testPublished = testId
    ? publicationOf(catalog.tests.find((test) => test.id === testId)?.publicationStatus ?? "awaiting_approval", db.publication.tests[testId]) === "published"
    : false;
  return decideAccess({
    catalog,
    streamId: student.streamId,
    classLevel: student.classLevel,
    bookId,
    testId,
    bookPublished,
    testPublished,
    paid: paidFor(db, student.id, bookId),
  });
}

export type DashboardBook = {
  id: string;
  title: string;
  bookNumber: number;
  assignedClasses: number[];
  publicationStatus: PublicationStatus;
  paymentStatus: PaymentState | "none";
  amountInr: number;
  includedMockTests: number;
  canRead: boolean;
  tests: {
    id: string;
    number: number;
    title: string;
    paperCode: string;
    questionCount: number;
    publicationStatus: PublicationStatus;
    canStart: boolean;
    latestScore: number | null;
    latestMax: number | null;
    attempts: number;
  }[];
};

export async function dashboard(student: PortalStudent): Promise<{
  student: PublicStudent;
  quote: ReturnType<typeof quoteFee>;
  books: DashboardBook[];
  history: { id: string; testId: string; status: Attempt["status"]; score: number | null; maxScore: number; submittedAt: string | null }[];
}> {
  if (portalPersistence() === "unavailable") throw new PortalUnavailable();
  if (portalPersistence() === "remote") {
    const { remoteDashboard } = await import("@/lib/portal/remote-store");
    return remoteDashboard(student);
  }
  const db = await readDb();
  const catalog = loadCatalog();
  const quote = quoteFee(catalog, student.streamId, student.classLevel);
  const books = booksForLearner(catalog, student.streamId, student.classLevel).map((book) => {
    const entitlement = activeEntitlement(db, student.id, book.id);
    const bookStatus = publicationOf(book.publicationStatus, db.publication.books[book.id]);
    const paymentStatus: PaymentState | "none" = entitlement?.status ?? "none";
    const paid = paymentStatus === "verified";
    return {
      id: book.id,
      title: book.title,
      bookNumber: book.bookNumber,
      assignedClasses: book.assignedClasses,
      publicationStatus: bookStatus,
      paymentStatus,
      amountInr: entitlement?.amountInr ?? quote.amountInr,
      includedMockTests: testsForBook(catalog, book.id).length,
      canRead: bookStatus === "published" && paid,
      tests: testsForBook(catalog, book.id).map((test) => {
        const testStatus = publicationOf(test.publicationStatus, db.publication.tests[test.id]);
        const mine = db.attempts.filter((attempt) => attempt.studentId === student.id && attempt.testId === test.id && attempt.status === "submitted");
        const latest = mine.at(-1);
        return {
          id: test.id,
          number: test.number,
          title: test.title,
          paperCode: test.paperCode,
          questionCount: test.questionCount,
          publicationStatus: testStatus,
          canStart: bookStatus === "published" && testStatus === "published" && paid && contentChecked(test),
          latestScore: latest?.score ?? null,
          latestMax: latest?.maxScore ?? null,
          attempts: mine.length,
        };
      }),
    };
  });
  const history = db.attempts
    .filter((attempt) => attempt.studentId === student.id)
    .map((attempt) => ({ id: attempt.id, testId: attempt.testId, status: attempt.status, score: attempt.score, maxScore: attempt.maxScore, submittedAt: attempt.submittedAt }));
  return { student: toPublicStudent(student), quote, books, history };
}

export async function startAttempt(student: PortalStudent, testId: string): Promise<{ ok: true; attemptId: string; expiresAt: string; questions: PublicQuestion[]; timeMinutes: number } | { ok: false; error: string; reason?: string }> {
  const catalog = loadCatalog();
  const test = catalog.tests.find((item) => item.id === testId);
  if (!test) return { ok: false, error: "This mock test is not available.", reason: "unknown" };
  if (portalPersistence() === "remote") {
    const { remoteStartAttempt } = await import("@/lib/portal/remote-store");
    return remoteStartAttempt(student, testId);
  }
  const decision = await accessFor(student, test.bookId, test.id);
  if (!decision.ok) return { ok: false, error: "This mock test is not available for this account.", reason: decision.reason };
  return withLock(async () => {
    const db = await readDb();
    const now = Date.now();
    const mine = db.attempts.filter((attempt) => attempt.studentId === student.id && attempt.testId === test.id);
    const open = mine.find((attempt) => attempt.status === "open");
    if (open && new Date(open.expiresAt).getTime() > now) {
      return { ok: true as const, attemptId: open.id, expiresAt: open.expiresAt, questions: test.questions.map(toPublicQuestion), timeMinutes: test.timeMinutes };
    }
    if (open) open.status = "expired";
    if (process.env.TEJAS_PORTAL_RETAKES !== "allow" && mine.length > 0) {
      await writeDb(db);
      return { ok: false as const, error: "Another attempt is not open. A retake has not been approved." };
    }
    const attempt: Attempt = {
      id: randomUUID(),
      studentId: student.id,
      testId: test.id,
      bookId: test.bookId,
      startedAt: new Date(now).toISOString(),
      submittedAt: null,
      expiresAt: new Date(now + test.timeMinutes * 60 * 1000).toISOString(),
      answers: {},
      score: null,
      maxScore: test.questions.length,
      status: "open",
    };
    db.attempts.push(attempt);
    await writeDb(db);
    return { ok: true as const, attemptId: attempt.id, expiresAt: attempt.expiresAt, questions: test.questions.map(toPublicQuestion), timeMinutes: test.timeMinutes };
  });
}

export async function submitAttempt(student: PortalStudent, attemptId: string, answers: Record<string, string>): Promise<{ ok: true; attemptId: string; score: number; maxScore: number } | { ok: false; error: string }> {
  if (portalPersistence() === "remote") {
    const { remoteSubmitAttempt } = await import("@/lib/portal/remote-store");
    return remoteSubmitAttempt(student, attemptId, answers);
  }
  return withLock(async () => {
    const db = await readDb();
    const attempt = db.attempts.find((item) => item.id === attemptId && item.studentId === student.id);
    if (!attempt) return { ok: false, error: "This attempt was not found." };
    if (attempt.status !== "open") return { ok: false, error: "This attempt is already closed." };
    if (Date.now() > new Date(attempt.expiresAt).getTime()) {
      attempt.status = "expired";
      await writeDb(db);
      return { ok: false, error: "The time allowed for this attempt has ended." };
    }
    const decision = await accessFor(student, attempt.bookId, attempt.testId);
    if (!decision.ok || !decision.test) {
      return { ok: false, error: "This mock test is not available for this account." };
    }
    const cleaned: Record<string, string> = {};
    for (const question of decision.test.questions) {
      const value = answers[String(question.number)];
      if (value === "A" || value === "B" || value === "C" || value === "D") cleaned[String(question.number)] = value;
    }
    const scored = scoreAnswers(decision.test, cleaned);
    attempt.answers = cleaned;
    attempt.score = scored.score;
    attempt.maxScore = scored.maxScore;
    attempt.submittedAt = new Date().toISOString();
    attempt.status = "submitted";
    await writeDb(db);
    return { ok: true as const, attemptId: attempt.id, score: scored.score, maxScore: scored.maxScore };
  });
}

export async function readOwnAttempt(studentId: string, attemptId: string): Promise<{ attempt: Attempt; questions: ReturnType<typeof scoreAnswers>["detail"]; explanations: { number: number; explanation: string | null; chapter: string }[] } | null> {
  if (portalPersistence() === "remote") {
    const { remoteReadOwnAttempt } = await import("@/lib/portal/remote-store");
    return remoteReadOwnAttempt(studentId, attemptId);
  }
  const db = await readDb();
  const attempt = db.attempts.find((item) => item.id === attemptId && item.studentId === studentId);
  if (!attempt || attempt.status !== "submitted") return null;
  const test = loadCatalog().tests.find((item) => item.id === attempt.testId);
  if (!test) return null;
  const scored = scoreAnswers(test, attempt.answers);
  return {
    attempt,
    questions: scored.detail,
    explanations: test.questions.map((question) => ({ number: question.number, explanation: question.explanation, chapter: question.chapter })),
  };
}

export type InventoryRow = {
  stream: string;
  classes: string;
  book: string;
  mockTest: string;
  sourceFilename: string;
  questionCount: number | null;
  answerKey: string;
  explanations: string;
  uploadStatus: string;
  reviewStatus: string;
  publicationStatus: PublicationStatus;
};

export async function staffOverview(): Promise<{
  rows: InventoryRow[];
  flags: PortalCatalog["flags"];
  students: (PublicStudent & { payment: { bookId: string; status: PaymentState; amountInr: number }[] })[];
  audit: AuditEvent[];
}> {
  if (portalPersistence() === "remote") {
    const { remoteStaffOverview } = await import("@/lib/portal/remote-store");
    return remoteStaffOverview();
  }
  const db = await readDb();
  const catalog = loadCatalog();
  const rows: InventoryRow[] = [];
  for (const book of catalog.books) {
    rows.push({
      stream: book.streamName,
      classes: book.assignedClasses.join(", "),
      book: `Book ${book.bookNumber}: ${book.title}`,
      mockTest: "E-book file",
      sourceFilename: book.sourceFilename,
      questionCount: null,
      answerKey: "Not a mock test",
      explanations: "Not a mock test",
      uploadStatus: "file-stored",
      reviewStatus: book.mappingStatus,
      publicationStatus: publicationOf(book.publicationStatus, db.publication.books[book.id]),
    });
    for (const test of testsForBook(catalog, book.id)) {
      rows.push({
        stream: book.streamName,
        classes: test.assignedClasses.join(", "),
        book: `Book ${book.bookNumber}`,
        mockTest: `${test.title} (${test.paperCode})`,
        sourceFilename: test.sourceFilename,
        questionCount: test.questionCount,
        answerKey: test.answerKeyAvailable ? "Present" : "Missing",
        explanations: test.explanationAvailable ? "Present" : "Missing",
        uploadStatus: test.uploadStatus,
        reviewStatus: test.reviewStatus,
        publicationStatus: publicationOf(test.publicationStatus, db.publication.tests[test.id]),
      });
    }
  }
  return {
    rows,
    flags: catalog.flags,
    students: db.students.map((student) => ({
      ...toPublicStudent(student),
      payment: db.entitlements.filter((item) => item.studentId === student.id).map((item) => ({ bookId: item.bookId, status: item.status, amountInr: item.amountInr })),
    })),
    audit: db.audit.slice().reverse(),
  };
}

export async function listAuditFor(studentId: string): Promise<AuditEvent[]> {
  const db = await readDb();
  return db.audit.filter((item) => item.studentId === studentId);
}
