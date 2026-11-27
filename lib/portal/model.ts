import { classIsEligible } from "@/lib/registration/fields";
import { STREAMS, streamById, type StreamId } from "@/lib/registration/schema";

/** Approved price for one applicable e-book and the mock tests included with it. */
export const PORTAL_EBOOK_FEE_INR = 49;

/**
 * Owner-approved ₹49 fee applies per selected stream when that stream has
 * an e-book and five mock tests for the learner's class.
 */
export const PORTAL_FEE_APPROVED: Record<StreamId, boolean> = {
  technology: true,
  english: true,
  mathematics: true,
};

export const PUBLICATION_STATUSES = ["awaiting_approval", "published"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export type PortalOption = { key: "A" | "B" | "C" | "D"; text: string };

export type PortalQuestion = {
  number: number;
  section: string;
  prompt: string;
  options: PortalOption[];
  correct: "A" | "B" | "C" | "D" | null;
  correctCompact: string;
  correctExplanationRow: string;
  chapter: string;
  difficulty: string;
  explanation: string | null;
  sourceId: string;
  answerKeyAvailable: boolean;
  explanationAvailable: boolean;
};

export type PortalTest = {
  id: string;
  bookId: string;
  streamId: StreamId;
  bookNumber: number;
  number: number;
  title: string;
  paperCode: string;
  subject: string;
  timeAllowed: string;
  timeMinutes: number;
  maximumMarks: number | null;
  negativeMarking: string;
  sourceFilename: string;
  sourceSha256: string;
  questionCount: number;
  answerKeyAvailable: boolean;
  explanationAvailable: boolean;
  uploadStatus: string;
  reviewStatus: string;
  publicationStatus: PublicationStatus;
  sourceCheck: string;
  assignedClasses: number[];
  questions: PortalQuestion[];
};

export type PortalBook = {
  id: string;
  streamId: StreamId;
  streamName: string;
  bookNumber: number;
  title: string;
  coverTitle: string;
  sourceFilename: string;
  sourceSha256: string;
  pageCount: number;
  assignedClasses: number[];
  coverClassStatement: string;
  mappingStatus: string;
  publicationStatus: PublicationStatus;
  feeInr: number;
  includedMockTests: number;
  mockTestFeeInr: number;
};

export type ContentFlag = {
  severity: "review" | "note";
  code: string;
  detail: string;
  book?: number;
  test?: number;
  question?: number;
};

export type PortalCatalog = {
  streamId: StreamId;
  streamName: string;
  feeInr: number;
  feeScope: string;
  publicationStatus: PublicationStatus;
  books: PortalBook[];
  tests: PortalTest[];
  flags: ContentFlag[];
};

export type PublicQuestion = {
  number: number;
  section: string;
  prompt: string;
  options: PortalOption[];
};

export type AccessReason = "unknown" | "wrong_stream" | "wrong_class" | "unpublished" | "unpaid" | "not_checked";

export type AccessDecision =
  | { ok: true; book: PortalBook; test: PortalTest | null }
  | { ok: false; reason: AccessReason };

export function portalStreams() {
  return STREAMS.map((stream) => ({
    id: stream.id,
    name: stream.name,
    classes: [...stream.classes],
  }));
}

export function classesForStream(streamId: StreamId): readonly number[] {
  return streamById(streamId).classes;
}

export function streamAcceptsClass(streamId: StreamId, classLevel: number): boolean {
  return classIsEligible(classLevel, classesForStream(streamId));
}

/**
 * Chargeable book for one stream + class (exact class mapping).
 * Future Tech class 9–10 charges Book 2 only; Book 1 is syllabus access, not a second charge.
 */
export function booksForLearner(catalog: PortalCatalog, streamId: StreamId, classLevel: number): PortalBook[] {
  return catalog.books.filter((book) => book.streamId === streamId && book.assignedClasses.includes(classLevel));
}

/**
 * Learning syllabus for a purchased stream at the learner's class.
 * Future Tech Book 2 applicants (classes 9–10) also receive Book 1 under the same ₹49 stream entitlement.
 */
export function booksForStreamSyllabus(catalog: PortalCatalog, streamId: StreamId, classLevel: number): PortalBook[] {
  if (!streamAcceptsClass(streamId, classLevel)) return [];
  if (streamId === "technology" && (classLevel === 9 || classLevel === 10)) {
    return catalog.books
      .filter((book) => book.streamId === "technology" && (book.id === "ft-book-1" || book.id === "ft-book-2"))
      .sort((a, b) => a.bookNumber - b.bookNumber);
  }
  return booksForLearner(catalog, streamId, classLevel);
}

/** Union of syllabus books across every stream the student is enrolled in or purchasing. */
export function booksForLibrary(catalog: PortalCatalog, streamIds: readonly StreamId[], classLevel: number): PortalBook[] {
  const seen = new Set<string>();
  const books: PortalBook[] = [];
  for (const streamId of uniqueStreamIds(streamIds)) {
    for (const book of booksForStreamSyllabus(catalog, streamId, classLevel)) {
      if (seen.has(book.id)) continue;
      seen.add(book.id);
      books.push(book);
    }
  }
  return books;
}

/** All catalog books — used only for the allowlisted content-QA student dashboard. */
export function booksForContentQa(catalog: PortalCatalog): PortalBook[] {
  return [...catalog.books];
}

export function testsForBook(catalog: PortalCatalog, bookId: string): PortalTest[] {
  return catalog.tests.filter((test) => test.bookId === bookId).sort((a, b) => a.number - b.number);
}

export function isPortalStreamId(value: unknown): value is StreamId {
  return value === "english" || value === "mathematics" || value === "technology";
}

export function uniqueStreamIds(streamIds: readonly StreamId[]): StreamId[] {
  const order: StreamId[] = ["english", "mathematics", "technology"];
  const selected = new Set(streamIds.filter(isPortalStreamId));
  return order.filter((id) => selected.has(id));
}

export function parseStreamIds(input: unknown): StreamId[] | null {
  if (isPortalStreamId(input)) return [input];
  if (!Array.isArray(input) || input.length === 0) return null;
  const parsed = uniqueStreamIds(input.filter(isPortalStreamId));
  return parsed.length > 0 ? parsed : null;
}

export type FeeQuote =
  | {
      status: "payable";
      bookId: string;
      streamId: StreamId;
      amountInr: number;
      includedMockTests: number;
      mockTestAmountInr: 0;
    }
  | { status: "no_book"; amountInr: 0; includedMockTests: 0; mockTestAmountInr: 0 }
  | { status: "fee_not_approved"; amountInr: 0; includedMockTests: 0; mockTestAmountInr: 0; reason: string };

export type MultiStreamFeeQuote =
  | {
      status: "payable";
      amountInr: number;
      feePerStream: number;
      includedMockTests: number;
      mockTestAmountInr: 0;
      lines: { streamId: StreamId; streamName: string; bookId: string; bookTitle: string; amountInr: number; includedMockTests: number }[];
    }
  | { status: "no_book"; amountInr: 0; includedMockTests: 0; mockTestAmountInr: 0; reason: string }
  | { status: "fee_not_approved"; amountInr: 0; includedMockTests: 0; mockTestAmountInr: 0; reason: string };

export function quoteFee(catalog: PortalCatalog, streamId: StreamId, classLevel: number): FeeQuote {
  const books = booksForLearner(catalog, streamId, classLevel);
  const empty = { amountInr: 0 as const, includedMockTests: 0 as const, mockTestAmountInr: 0 as const };
  if (!PORTAL_FEE_APPROVED[streamId]) {
    return {
      status: "fee_not_approved",
      ...empty,
      reason: `${streamById(streamId).name} does not have an approved e-book fee.`,
    };
  }
  if (books.length === 0) {
    return { status: "no_book", ...empty };
  }
  if (books.length > 1) {
    return {
      status: "fee_not_approved",
      ...empty,
      reason: "More than one e-book matches this class. The ₹49 price was approved for one e-book.",
    };
  }
  const book = books[0];
  if (book.mappingStatus === "mocks_missing") {
    return {
      status: "fee_not_approved",
      ...empty,
      reason: "Five mock tests for this class have not been supplied yet, so purchase is closed.",
    };
  }
  const included = testsForBook(catalog, book.id).length;
  if (included !== 5) {
    return {
      status: "fee_not_approved",
      ...empty,
      reason: `This e-book must include exactly five mock tests; found ${included}.`,
    };
  }
  if (book.feeInr !== PORTAL_EBOOK_FEE_INR || book.mockTestFeeInr !== 0) {
    return {
      status: "fee_not_approved",
      ...empty,
      reason: "The stored price for this e-book is not the approved ₹49 price.",
    };
  }
  return {
    status: "payable",
    bookId: book.id,
    streamId,
    amountInr: PORTAL_EBOOK_FEE_INR,
    includedMockTests: included,
    mockTestAmountInr: 0,
  };
}

/** ₹49 per selected eligible stream. Already-paid streams must be filtered out by the caller. */
export function quoteFeesForStreams(catalog: PortalCatalog, streamIds: readonly StreamId[], classLevel: number): MultiStreamFeeQuote {
  const selected = uniqueStreamIds(streamIds);
  const empty = { amountInr: 0 as const, includedMockTests: 0 as const, mockTestAmountInr: 0 as const };
  if (selected.length === 0) {
    return { status: "no_book", ...empty, reason: "Select at least one stream." };
  }
  const lines: Extract<MultiStreamFeeQuote, { status: "payable" }>["lines"] = [];
  for (const streamId of selected) {
    if (!streamAcceptsClass(streamId, classLevel)) {
      return {
        status: "fee_not_approved",
        ...empty,
        reason: `${streamById(streamId).name} is not offered for class ${classLevel}.`,
      };
    }
    const quote = quoteFee(catalog, streamId, classLevel);
    if (quote.status !== "payable") {
      return {
        status: quote.status === "fee_not_approved" ? "fee_not_approved" : "no_book",
        ...empty,
        reason: quote.status === "fee_not_approved" ? quote.reason : `No published e-book maps to ${streamById(streamId).name} for this class.`,
      };
    }
    const book = catalog.books.find((item) => item.id === quote.bookId);
    lines.push({
      streamId,
      streamName: streamById(streamId).name,
      bookId: quote.bookId,
      bookTitle: book?.title ?? quote.bookId,
      amountInr: quote.amountInr,
      includedMockTests: quote.includedMockTests,
    });
  }
  return {
    status: "payable",
    amountInr: lines.length * PORTAL_EBOOK_FEE_INR,
    feePerStream: PORTAL_EBOOK_FEE_INR,
    includedMockTests: lines.reduce((sum, line) => sum + line.includedMockTests, 0),
    mockTestAmountInr: 0,
    lines,
  };
}

/** Payable book that unlocks a stream (and its syllabus companions such as Future Tech Book 1). */
export function payableBookIdForStream(catalog: PortalCatalog, streamId: StreamId, classLevel: number): string | null {
  const quote = quoteFee(catalog, streamId, classLevel);
  return quote.status === "payable" ? quote.bookId : null;
}

export function streamIdForBook(catalog: PortalCatalog, bookId: string): StreamId | null {
  return catalog.books.find((book) => book.id === bookId)?.streamId ?? null;
}

export function publicationOf(base: PublicationStatus, override: PublicationStatus | undefined): PublicationStatus {
  return override ?? base;
}

export function contentChecked(test: PortalTest): boolean {
  return test.questionCount > 0
    && test.answerKeyAvailable
    && test.explanationAvailable
    && test.questions.every((question) => question.answerKeyAvailable && question.explanationAvailable && question.options.length === 4);
}

export function decideAccess(input: {
  catalog: PortalCatalog;
  streamId: StreamId;
  classLevel: number;
  bookId: string;
  testId?: string | null;
  bookPublished: boolean;
  testPublished: boolean;
  /** Book reading paid (may include Future Tech companion books). */
  paid: boolean;
  /**
   * Mock-test paid flag. Defaults to `paid` when omitted.
   * Companion Future Tech Book 1 may be readable while its mock tests stay unpaid.
   */
  mocksPaid?: boolean;
  /**
   * Enrolled library streams for syllabus membership (not only verified-paid streams).
   * Future Tech Book 1 with Book 2 uses syllabus rules under the enrolled technology stream.
   */
  entitledStreamIds?: readonly StreamId[];
  /** Allowlisted content-QA identity: published content only; no stream/class/payment lock. */
  contentQa?: boolean;
}): AccessDecision {
  const book = input.catalog.books.find((item) => item.id === input.bookId);
  if (!book) return { ok: false, reason: "unknown" };
  const test = input.testId ? input.catalog.tests.find((item) => item.id === input.testId) ?? null : null;
  if (input.testId && (!test || test.bookId !== book.id)) return { ok: false, reason: "unknown" };
  if (test && !contentChecked(test)) return { ok: false, reason: "not_checked" };
  const published = test ? input.bookPublished && input.testPublished : input.bookPublished;
  if (input.contentQa) {
    if (!published) return { ok: false, reason: "unpublished" };
    return { ok: true, book, test };
  }

  const entitled = uniqueStreamIds(input.entitledStreamIds ?? [input.streamId]);
  const syllabusOk = entitled.some((streamId) =>
    booksForStreamSyllabus(input.catalog, streamId, input.classLevel).some((item) => item.id === book.id),
  );
  if (!syllabusOk) {
    if (book.streamId !== input.streamId && !entitled.includes(book.streamId)) {
      return { ok: false, reason: "wrong_stream" };
    }
    return { ok: false, reason: "wrong_class" };
  }
  if (test) {
    // Mock tests are bound to the purchased payable book for the class, not syllabus companions.
    const payableId = payableBookIdForStream(input.catalog, book.streamId, input.classLevel);
    if (!payableId || test.bookId !== payableId || test.bookId !== book.id) {
      return { ok: false, reason: test.streamId !== book.streamId ? "wrong_stream" : "wrong_class" };
    }
  }
  if (!published) return { ok: false, reason: "unpublished" };
  const mocksPaid = input.mocksPaid ?? input.paid;
  if (test ? !mocksPaid : !input.paid) return { ok: false, reason: "unpaid" };
  return { ok: true, book, test };
}

export function toPublicQuestion(question: PortalQuestion): PublicQuestion {
  return {
    number: question.number,
    section: question.section,
    prompt: question.prompt,
    options: question.options.map((option) => ({ key: option.key, text: option.text })),
  };
}

export function scoreAnswers(test: PortalTest, answers: Record<string, string>): { score: number; maxScore: number; detail: { number: number; chosen: string | null; correct: string; right: boolean }[] } {
  const detail = test.questions.map((question) => {
    const chosen = answers[String(question.number)] ?? null;
    const valid = chosen === "A" || chosen === "B" || chosen === "C" || chosen === "D" ? chosen : null;
    return {
      number: question.number,
      chosen: valid,
      correct: question.correct ?? "",
      right: valid !== null && valid === question.correct,
    };
  });
  return {
    score: detail.filter((item) => item.right).length,
    maxScore: test.questions.length,
    detail,
  };
}
