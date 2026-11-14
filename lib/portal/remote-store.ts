import { randomUUID } from "node:crypto";
import { loadCatalog } from "@/lib/portal/catalog.server";
import {
  booksForLearner,
  contentChecked,
  decideAccess,
  publicationOf,
  quoteFee,
  scoreAnswers,
  testsForBook,
  toPublicQuestion,
  type PublicationStatus,
} from "@/lib/portal/model";
import { hashPassword, passwordMatches } from "@/lib/portal/session";
import { PortalUnavailable, schemaMissing, supabaseRest } from "@/lib/portal/supabase-rest";
import { streamById, type StreamId } from "@/lib/registration/schema";
import type { Attempt, AuditEvent, PaymentState, PortalStudent, PublicStudent } from "@/lib/portal/store";

function rows(json: unknown): Record<string, unknown>[] {
  if (!Array.isArray(json)) return [];
  return json.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

function asText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function publicStudent(student: PortalStudent): PublicStudent {
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

function studentFrom(row: Record<string, unknown>): PortalStudent | null {
  const streamId = row.stream_id;
  if (streamId !== "english" && streamId !== "mathematics" && streamId !== "technology") return null;
  if (typeof row.id !== "string" || typeof row.full_name !== "string" || typeof row.email !== "string") return null;
  if (typeof row.class_level !== "number") return null;
  return {
    id: row.id,
    createdAt: asText(row.created_at) ?? new Date().toISOString(),
    fullName: row.full_name,
    parentName: asText(row.parent_name) ?? "",
    mobile: asText(row.mobile) ?? "",
    email: row.email,
    schoolName: asText(row.school_name) ?? "",
    passwordHash: typeof row.password_hash === "string" ? row.password_hash : "",
    passwordSalt: asText(row.password_salt) ?? "",
    streamId,
    classLevel: row.class_level,
    sessionVersion: typeof row.session_version === "number" ? row.session_version : 1,
  };
}

async function rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
  const result = await supabaseRest(`/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  if (schemaMissing(result.status, result.json) || (result.status === 404 && result.json && typeof result.json === "object" && (result.json as { code?: string }).code === "PGRST202")) {
    throw new PortalUnavailable("The student portal tables are not ready.");
  }
  if (result.status >= 400) {
    const code = result.json && typeof result.json === "object" && "code" in result.json ? String((result.json as { code?: string }).code) : "";
    const error = new Error(code || "database");
    (error as Error & { status?: number; code?: string }).status = result.status;
    (error as Error & { code?: string }).code = code;
    throw error;
  }
  return result.json;
}

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof PortalUnavailable) return error.message;
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : "";
  if (code === "23505") return "An account with this email already exists.";
  if (code === "23514") return "Select a class offered for this stream.";
  return fallback;
}

export async function remoteRegister(input: {
  fullName: string;
  parentName: string;
  mobile: string;
  email: string;
  schoolName: string;
  password: string;
  streamId: StreamId;
  classLevel: number;
}): Promise<{ ok: true; student: PublicStudent } | { ok: false; error: string }> {
  const password = hashPassword(input.password);
  const quote = quoteFee(loadCatalog(), input.streamId, input.classLevel);
  try {
    const id = await rpc("tejas_learn_register_student", {
      p_full_name: input.fullName,
      p_parent_name: input.parentName,
      p_mobile: input.mobile,
      p_email: input.email,
      p_school_name: input.schoolName,
      p_password_hash: password.hash,
      p_password_salt: password.salt,
      p_stream_id: input.streamId,
      p_class_level: input.classLevel,
      p_book_id: quote.status === "payable" ? quote.bookId : null,
      p_amount: quote.status === "payable" ? quote.amountInr : 0,
      p_included: quote.status === "payable" ? quote.includedMockTests : 0,
    });
    if (typeof id !== "string") return { ok: false, error: "The account could not be created." };
    const student = await remoteReadStudent(id);
    if (!student) return { ok: false, error: "The account could not be created." };
    return { ok: true, student: publicStudent(student) };
  } catch (error) {
    return { ok: false, error: messageFor(error, "The account could not be created.") };
  }
}

export async function remoteAuthenticate(email: string, password: string): Promise<{ ok: true; student: PublicStudent } | { ok: false; error: string; unavailable?: boolean }> {
  try {
    const result = await supabaseRest(`/rest/v1/tejas_learn_students?email=eq.${encodeURIComponent(email)}&select=id,full_name,parent_name,mobile,email,school_name,password_hash,password_salt,stream_id,class_level,session_version,created_at`, { method: "GET" });
    if (schemaMissing(result.status, result.json)) return { ok: false, error: "The student portal tables are not ready.", unavailable: true };
    if (result.status !== 200) return { ok: false, error: "The student portal database is not available.", unavailable: true };
    const student = studentFrom(rows(result.json)[0] ?? {});
    if (!student || !passwordMatches(password, student.passwordSalt, student.passwordHash)) return { ok: false, error: "The email or password was not accepted." };
    return { ok: true, student: publicStudent(student) };
  } catch (error) {
    if (error instanceof PortalUnavailable) return { ok: false, error: error.message, unavailable: true };
    return { ok: false, error: "The student portal database is not available.", unavailable: true };
  }
}

export async function remoteReadStudent(id: string): Promise<PortalStudent | null> {
  const result = await supabaseRest(`/rest/v1/tejas_learn_students?id=eq.${encodeURIComponent(id)}&select=id,full_name,parent_name,mobile,email,school_name,password_hash,password_salt,stream_id,class_level,session_version,created_at`, { method: "GET" });
  if (schemaMissing(result.status, result.json)) throw new PortalUnavailable("The student portal tables are not ready.");
  if (result.status !== 200) throw new PortalUnavailable();
  return studentFrom(rows(result.json)[0] ?? {});
}

export async function remoteRotateSession(studentId: string): Promise<number | null> {
  try {
    const version = await rpc("tejas_learn_rotate_session", { p_student: studentId });
    return typeof version === "number" ? version : null;
  } catch (error) {
    if (error instanceof PortalUnavailable) throw error;
    return null;
  }
}

export async function remoteUpdateProfile(studentId: string, patch: Record<string, unknown>): Promise<{ ok: true; student: PublicStudent } | { ok: false; error: string }> {
  const result = await supabaseRest(`/rest/v1/tejas_learn_students?id=eq.${encodeURIComponent(studentId)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (result.status !== 200) return { ok: false, error: "The account could not be updated." };
  const student = studentFrom(rows(result.json)[0] ?? {});
  if (!student) return { ok: false, error: "Account not found." };
  return { ok: true, student: publicStudent(student) };
}

export async function remoteCorrect(input: {
  actor: string;
  studentId: string;
  streamId: StreamId;
  classLevel: number;
  bookId: string | null;
  amountInr: number;
  includedMockTests: number;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await rpc("tejas_learn_correct_registration", {
      p_student: input.studentId,
      p_stream: input.streamId,
      p_class: input.classLevel,
      p_book: input.bookId,
      p_amount: input.amountInr,
      p_included: input.includedMockTests,
      p_actor: input.actor,
      p_reason: input.reason,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error, "The correction could not be saved.") };
  }
}

export async function remoteReportPayment(studentId: string, bookId: string, reference: string, amountInr: number): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await rpc("tejas_learn_report_payment", { p_student: studentId, p_book: bookId, p_reference: reference, p_amount: amountInr });
    return { ok: true };
  } catch {
    return { ok: false, error: "The payment reference could not be saved." };
  }
}

export async function remoteReviewPayment(input: { actor: string; studentId: string; bookId: string; decision: "verified" | "rejected"; note: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await rpc("tejas_learn_review_payment", {
      p_student: input.studentId,
      p_book: input.bookId,
      p_decision: input.decision,
      p_actor: input.actor,
      p_note: input.note,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "No reported payment exists for this e-book." };
  }
}

export async function remoteSetPublication(input: { actor: string; kind: "book" | "test"; id: string; status: PublicationStatus; reason: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await rpc("tejas_learn_set_publication", {
      p_kind: input.kind,
      p_item: input.id,
      p_status: input.status,
      p_actor: input.actor,
      p_reason: input.reason,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error, "The publication status could not be saved.") };
  }
}

export async function remotePublicationMap(): Promise<{ books: Record<string, PublicationStatus>; tests: Record<string, PublicationStatus> }> {
  const result = await supabaseRest("/rest/v1/tejas_learn_publication?select=kind,item_id,publication_status", { method: "GET" });
  if (schemaMissing(result.status, result.json)) return { books: {}, tests: {} };
  if (result.status !== 200) throw new PortalUnavailable();
  const books: Record<string, PublicationStatus> = {};
  const tests: Record<string, PublicationStatus> = {};
  for (const row of rows(result.json)) {
    const status = row.publication_status === "published" ? "published" : "awaiting_approval";
    if (row.kind === "book" && typeof row.item_id === "string") books[row.item_id] = status;
    if (row.kind === "test" && typeof row.item_id === "string") tests[row.item_id] = status;
  }
  return { books, tests };
}

async function verified(studentId: string, bookId: string): Promise<boolean> {
  const result = await supabaseRest(`/rest/v1/tejas_learn_entitlements?student_id=eq.${encodeURIComponent(studentId)}&book_id=eq.${encodeURIComponent(bookId)}&status=eq.verified&select=id`, { method: "GET" });
  if (result.status !== 200) throw new PortalUnavailable();
  return rows(result.json).length > 0;
}

export async function remoteAccessFor(student: PortalStudent, bookId: string, testId?: string | null) {
  const catalog = loadCatalog();
  const publication = await remotePublicationMap();
  const bookPublished = publicationOf(catalog.books.find((book) => book.id === bookId)?.publicationStatus ?? "awaiting_approval", publication.books[bookId]) === "published";
  const testPublished = testId
    ? publicationOf(catalog.tests.find((test) => test.id === testId)?.publicationStatus ?? "awaiting_approval", publication.tests[testId]) === "published"
    : false;
  return decideAccess({
    catalog,
    streamId: student.streamId,
    classLevel: student.classLevel,
    bookId,
    testId,
    bookPublished,
    testPublished,
    paid: await verified(student.id, bookId),
  });
}

type AttemptRow = {
  id: string;
  studentId: string;
  testId: string;
  bookId: string;
  status: Attempt["status"];
  score: number | null;
  maxScore: number;
  answers: Record<string, string>;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string;
};

function attemptFrom(row: Record<string, unknown>): AttemptRow | null {
  if (typeof row.id !== "string" || typeof row.student_id !== "string" || typeof row.test_id !== "string") return null;
  const status = row.status === "open" || row.status === "submitted" || row.status === "expired" ? row.status : null;
  if (!status) return null;
  const answers = row.answers && typeof row.answers === "object" && !Array.isArray(row.answers) ? row.answers as Record<string, string> : {};
  return {
    id: row.id,
    studentId: row.student_id,
    testId: row.test_id,
    bookId: asText(row.book_id) ?? "",
    status,
    score: typeof row.score === "number" ? row.score : null,
    maxScore: typeof row.max_score === "number" ? row.max_score : 0,
    answers,
    startedAt: asText(row.started_at) ?? new Date().toISOString(),
    submittedAt: asText(row.submitted_at),
    expiresAt: asText(row.expires_at) ?? new Date().toISOString(),
  };
}

export async function remoteDashboard(student: PortalStudent) {
  const catalog = loadCatalog();
  const publication = await remotePublicationMap();
  const entitlements = await supabaseRest(`/rest/v1/tejas_learn_entitlements?student_id=eq.${encodeURIComponent(student.id)}&select=book_id,status,amount_inr`, { method: "GET" });
  const attempts = await supabaseRest(`/rest/v1/tejas_learn_attempts?student_id=eq.${encodeURIComponent(student.id)}&select=id,test_id,status,score,max_score,submitted_at`, { method: "GET" });
  if (entitlements.status !== 200 || attempts.status !== 200) throw new PortalUnavailable();
  const quote = quoteFee(catalog, student.streamId, student.classLevel);
  const entitlementRows = rows(entitlements.json);
  const attemptRows = rows(attempts.json);
  const books = booksForLearner(catalog, student.streamId, student.classLevel).map((book) => {
    const entitlement = entitlementRows.find((item) => item.book_id === book.id && item.status !== "superseded");
    const bookStatus = publicationOf(book.publicationStatus, publication.books[book.id]);
    const rawStatus = entitlement?.status;
    const paymentStatus: PaymentState | "none" = rawStatus === "unpaid" || rawStatus === "reported" || rawStatus === "verified" || rawStatus === "rejected" || rawStatus === "superseded" ? rawStatus : "none";
    const paid = paymentStatus === "verified";
    return {
      id: book.id,
      title: book.title,
      bookNumber: book.bookNumber,
      assignedClasses: book.assignedClasses,
      publicationStatus: bookStatus,
      paymentStatus,
      amountInr: typeof entitlement?.amount_inr === "number" ? entitlement.amount_inr : quote.amountInr,
      includedMockTests: testsForBook(catalog, book.id).length,
      canRead: bookStatus === "published" && paid,
      tests: testsForBook(catalog, book.id).map((test) => {
        const testStatus = publicationOf(test.publicationStatus, publication.tests[test.id]);
        const mine = attemptRows.filter((item) => item.test_id === test.id && item.status === "submitted");
        const latest = mine.at(-1);
        return {
          id: test.id,
          number: test.number,
          title: test.title,
          paperCode: test.paperCode,
          questionCount: test.questionCount,
          publicationStatus: testStatus,
          canStart: bookStatus === "published" && testStatus === "published" && paid && contentChecked(test),
          latestScore: typeof latest?.score === "number" ? latest.score : null,
          latestMax: typeof latest?.max_score === "number" ? latest.max_score : null,
          attempts: mine.length,
        };
      }),
    };
  });
  return {
    student: publicStudent(student),
    quote,
    books,
    history: attemptRows.map((item) => ({
      id: String(item.id),
      testId: String(item.test_id),
      status: item.status as Attempt["status"],
      score: typeof item.score === "number" ? item.score : null,
      maxScore: typeof item.max_score === "number" ? item.max_score : 0,
      submittedAt: asText(item.submitted_at),
    })),
  };
}

export function retakesAllowed(): boolean {
  return process.env.TEJAS_PORTAL_RETAKES === "allow";
}

export async function remoteStartAttempt(student: PortalStudent, testId: string) {
  const catalog = loadCatalog();
  const test = catalog.tests.find((item) => item.id === testId);
  if (!test) return { ok: false as const, error: "This mock test is not available.", reason: "unknown" };
  const decision = await remoteAccessFor(student, test.bookId, test.id);
  if (!decision.ok) return { ok: false as const, error: "This mock test is not available for this account.", reason: decision.reason };
  const existing = await supabaseRest(`/rest/v1/tejas_learn_attempts?student_id=eq.${encodeURIComponent(student.id)}&test_id=eq.${encodeURIComponent(test.id)}&select=id,student_id,test_id,book_id,status,score,max_score,answers,started_at,submitted_at,expires_at`, { method: "GET" });
  if (existing.status !== 200) throw new PortalUnavailable();
  const attempts = rows(existing.json).map(attemptFrom).filter((item): item is AttemptRow => item !== null);
  const open = attempts.find((item) => item.status === "open" && new Date(item.expiresAt).getTime() > Date.now());
  if (open) return { ok: true as const, attemptId: open.id, expiresAt: open.expiresAt, questions: test.questions.map(toPublicQuestion), timeMinutes: test.timeMinutes };
  if (!retakesAllowed() && attempts.some((item) => item.status === "submitted" || item.status === "expired" || item.status === "open")) {
    return { ok: false as const, error: "Another attempt is not open. A retake has not been approved." };
  }
  const now = Date.now();
  const id = randomUUID();
  const expiresAt = new Date(now + test.timeMinutes * 60 * 1000).toISOString();
  const inserted = await supabaseRest("/rest/v1/tejas_learn_attempts", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify({
      id,
      student_id: student.id,
      test_id: test.id,
      book_id: test.bookId,
      status: "open",
      max_score: test.questions.length,
      answers: {},
      started_at: new Date(now).toISOString(),
      expires_at: expiresAt,
    }),
  });
  if (inserted.status !== 201 && inserted.status !== 200) return { ok: false as const, error: "This mock test could not be started." };
  return { ok: true as const, attemptId: id, expiresAt, questions: test.questions.map(toPublicQuestion), timeMinutes: test.timeMinutes };
}

export async function remoteSubmitAttempt(student: PortalStudent, attemptId: string, answers: Record<string, string>) {
  const found = await supabaseRest(`/rest/v1/tejas_learn_attempts?id=eq.${encodeURIComponent(attemptId)}&student_id=eq.${encodeURIComponent(student.id)}&select=id,student_id,test_id,book_id,status,score,max_score,answers,started_at,submitted_at,expires_at`, { method: "GET" });
  if (found.status !== 200) throw new PortalUnavailable();
  const attempt = attemptFrom(rows(found.json)[0] ?? {});
  if (!attempt) return { ok: false as const, error: "This attempt was not found." };
  if (attempt.status !== "open") return { ok: false as const, error: "This attempt is already closed." };
  if (Date.now() > new Date(attempt.expiresAt).getTime()) {
    await supabaseRest(`/rest/v1/tejas_learn_attempts?id=eq.${encodeURIComponent(attempt.id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ status: "expired" }),
    });
    return { ok: false as const, error: "The time allowed for this attempt has ended." };
  }
  const decision = await remoteAccessFor(student, attempt.bookId, attempt.testId);
  if (!decision.ok || !decision.test) return { ok: false as const, error: "This mock test is not available for this account." };
  const cleaned: Record<string, string> = {};
  for (const question of decision.test.questions) {
    const value = answers[String(question.number)];
    if (value === "A" || value === "B" || value === "C" || value === "D") cleaned[String(question.number)] = value;
  }
  const scored = scoreAnswers(decision.test, cleaned);
  const saved = await supabaseRest(`/rest/v1/tejas_learn_attempts?id=eq.${encodeURIComponent(attempt.id)}&status=eq.open`, {
    method: "PATCH",
    headers: { "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify({ answers: cleaned, score: scored.score, max_score: scored.maxScore, submitted_at: new Date().toISOString(), status: "submitted" }),
  });
  if (saved.status !== 200 || !rows(saved.json).length) return { ok: false as const, error: "This attempt is already closed." };
  return { ok: true as const, attemptId: attempt.id, score: scored.score, maxScore: scored.maxScore };
}

export async function remoteReadOwnAttempt(studentId: string, attemptId: string) {
  const found = await supabaseRest(`/rest/v1/tejas_learn_attempts?id=eq.${encodeURIComponent(attemptId)}&student_id=eq.${encodeURIComponent(studentId)}&select=id,student_id,test_id,book_id,status,score,max_score,answers,started_at,submitted_at,expires_at`, { method: "GET" });
  if (found.status !== 200) throw new PortalUnavailable();
  const attempt = attemptFrom(rows(found.json)[0] ?? {});
  if (!attempt || attempt.status !== "submitted") return null;
  const test = loadCatalog().tests.find((item) => item.id === attempt.testId);
  if (!test) return null;
  const scored = scoreAnswers(test, attempt.answers);
  const full: Attempt = { ...attempt, answers: attempt.answers };
  return {
    attempt: full,
    questions: scored.detail,
    explanations: test.questions.map((question) => ({ number: question.number, explanation: question.explanation, chapter: question.chapter })),
  };
}

export async function remoteStaffOverview() {
  const catalog = loadCatalog();
  const publication = await remotePublicationMap();
  const students = await supabaseRest("/rest/v1/tejas_learn_students?select=id,full_name,parent_name,mobile,email,school_name,stream_id,class_level,session_version,created_at", { method: "GET" });
  const entitlements = await supabaseRest("/rest/v1/tejas_learn_entitlements?select=student_id,book_id,status,amount_inr", { method: "GET" });
  const audit = await supabaseRest("/rest/v1/tejas_learn_audit?select=id,created_at,actor,action_name,student_id,reason,before_state,after_state&order=created_at.desc&limit=100", { method: "GET" });
  if (students.status !== 200 || entitlements.status !== 200 || audit.status !== 200) throw new PortalUnavailable();
  const rowsOut = [];
  for (const book of catalog.books) {
    rowsOut.push({
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
      publicationStatus: publicationOf(book.publicationStatus, publication.books[book.id]),
    });
    for (const test of testsForBook(catalog, book.id)) {
      rowsOut.push({
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
        publicationStatus: publicationOf(test.publicationStatus, publication.tests[test.id]),
      });
    }
  }
  const entitlementRows = rows(entitlements.json);
  return {
    rows: rowsOut,
    flags: catalog.flags,
    students: rows(students.json).map((row) => studentFrom(row)).filter((item): item is PortalStudent => item !== null).map((student) => ({
      ...publicStudent(student),
      payment: entitlementRows.filter((item) => item.student_id === student.id).map((item) => ({
        bookId: String(item.book_id),
        status: item.status as PaymentState,
        amountInr: typeof item.amount_inr === "number" ? item.amount_inr : 0,
      })),
    })),
    audit: rows(audit.json).map((item) => ({
      id: String(item.id),
      at: asText(item.created_at) ?? "",
      actor: asText(item.actor) ?? "",
      action: asText(item.action_name) ?? "",
      studentId: asText(item.student_id),
      reason: asText(item.reason) ?? "",
      before: item.before_state ?? null,
      after: item.after_state ?? null,
    })) satisfies AuditEvent[],
  };
}
