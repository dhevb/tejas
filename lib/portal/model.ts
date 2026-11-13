import { classIsEligible } from "@/lib/registration/fields";
import { STREAMS, streamById, type StreamId } from "@/lib/registration/schema";

/** Approved price for one applicable e-book and the mock tests included with it. */
export const PORTAL_EBOOK_FEE_INR = 49;

/**
 * English and Mathematics fees are not approved.
 * A later upload for those streams must not reuse the Future Tech price on its own.
 */
export const PORTAL_FEE_APPROVED: Record<StreamId, boolean> = {
  technology: true,
  english: false,
  mathematics: false,
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

export function booksForLearner(catalog: PortalCatalog, streamId: StreamId, classLevel: number): PortalBook[] {
  return catalog.books.filter((book) => book.streamId === streamId && book.assignedClasses.includes(classLevel));
}

export function testsForBook(catalog: PortalCatalog, bookId: string): PortalTest[] {
  return catalog.tests.filter((test) => test.bookId === bookId).sort((a, b) => a.number - b.number);
}

export type FeeQuote =
  | {
      status: "payable";
      bookId: string;
      amountInr: number;
      includedMockTests: number;
      mockTestAmountInr: 0;
    }
  | { status: "no_book"; amountInr: 0; includedMockTests: 0; mockTestAmountInr: 0 }
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
  const included = testsForBook(catalog, book.id).length;
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
    amountInr: PORTAL_EBOOK_FEE_INR,
    includedMockTests: included,
    mockTestAmountInr: 0,
  };
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
  paid: boolean;
}): AccessDecision {
  const book = input.catalog.books.find((item) => item.id === input.bookId);
  if (!book) return { ok: false, reason: "unknown" };
  if (book.streamId !== input.streamId) return { ok: false, reason: "wrong_stream" };
  if (!book.assignedClasses.includes(input.classLevel)) return { ok: false, reason: "wrong_class" };
  const test = input.testId ? input.catalog.tests.find((item) => item.id === input.testId) ?? null : null;
  if (input.testId && (!test || test.bookId !== book.id)) return { ok: false, reason: "unknown" };
  if (test && (test.streamId !== input.streamId || !test.assignedClasses.includes(input.classLevel))) {
    return { ok: false, reason: test.streamId !== input.streamId ? "wrong_stream" : "wrong_class" };
  }
  if (test && !contentChecked(test)) return { ok: false, reason: "not_checked" };
  const published = test ? input.bookPublished && input.testPublished : input.bookPublished;
  if (!published) return { ok: false, reason: "unpublished" };
  if (!input.paid) return { ok: false, reason: "unpaid" };
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
