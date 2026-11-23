/** Gross registration fee in the 31 October 2026 invitation. */
export const FEE_TOTAL = 150;
/** School retains 20 percent. TEJAS receives 80 percent. */
export const FEE_SCHOOL = 30;
export const FEE_TEJAS = 120;
export const SCHOOL_SHARE_PER_STREAM = FEE_SCHOOL;
export const SCHOOL_SHARE_APPROVED = true;
/**
 * Historical printed-book prices. Printed-book orders are withdrawn from this release.
 * Kept only so older stored registrations can still be presented.
 */
export const BOOK_PRICE = 170;
export const BOOK_SCHOOL_SHARE = 34;
export const BOOK_TEJAS = 136;
export const BOOK_SHARE_APPROVED = false;
export const PRINTED_BOOKS_AVAILABLE = false;
export const EBOOK_FEE = 49;
/** E-book + five mock tests per selected stream are sold through the student portal / e-book purchase flow. */
export const EBOOK_SALE_OPEN = true;
export const ONLINE_EXAM_FEE = 30;
export const ONLINE_EXAM_APPROVED = false;

export type FeeBreakdown = {
  studentStreamRegistrations: number;
  totalStudentFees: number;
  registrationSchoolShare: number;
  registrationPayable: number;
  /**
   * Registration amount remitted to TEJAS. Printed books are separate.
   * The payment-proof amount is amountDue.
   */
  payableToTejas: number;
  /** Registration share plus printed-book share. */
  schoolShare: number;
  schoolShareApproved: boolean;
  printedBooks: number;
  printedBookAmount: number;
  bookSchoolShare: number;
  bookPayable: number;
  ebookAccess: number;
  ebookAmount: number;
  grossTotal: number;
  /** Net amount the school transfers to TEJAS. */
  amountDue: number;
};

export type FeeExtras = {
  printedBooks?: number;
  ebookAccess?: number;
};

/** Fields read back from a registration saved before or after the share split. */
export type StoredFee = {
  studentStreamRegistrations?: number;
  totalStudentFees: number;
  payableToTejas: number;
  schoolShare: number;
  schoolShareApproved?: boolean;
  registrationSchoolShare?: number;
  registrationPayable?: number;
  printedBooks?: number;
  printedBookAmount?: number;
  bookSchoolShare?: number;
  bookPayable?: number;
  ebookAccess?: number;
  ebookAmount?: number;
  grossTotal?: number;
  amountDue?: number;
};

export type PresentedFee = {
  studentStreamRegistrations: number;
  totalStudentFees: number;
  registrationSchoolShare: number;
  registrationPayable: number;
  printedBooks: number;
  printedBookAmount: number;
  bookSchoolShare: number;
  bookPayable: number;
  ebookAmount: number;
  grossTotal: number;
  schoolShare: number;
  amountDue: number;
};

/**
 * Show the amounts saved with a registration.
 * Missing share fields mean the older full-remittance record. Do not apply today's rates to it.
 */
export function presentFee(fee: StoredFee): PresentedFee {
  const printedBookAmount = fee.printedBookAmount ?? 0;
  const ebookAmount = fee.ebookAmount ?? 0;
  const registrationPayable = fee.registrationPayable ?? fee.payableToTejas;
  const amountDue = fee.amountDue ?? registrationPayable + printedBookAmount + ebookAmount;
  const bookPayable = fee.bookPayable ?? Math.max(0, amountDue - registrationPayable - ebookAmount);
  const registrationSchoolShare = fee.registrationSchoolShare ?? (fee.bookSchoolShare == null ? fee.schoolShare : Math.max(0, fee.schoolShare - fee.bookSchoolShare));
  const bookSchoolShare = fee.bookSchoolShare ?? Math.max(0, printedBookAmount - bookPayable);
  return {
    studentStreamRegistrations: fee.studentStreamRegistrations ?? 0,
    totalStudentFees: fee.totalStudentFees,
    registrationSchoolShare,
    registrationPayable,
    printedBooks: fee.printedBooks ?? 0,
    printedBookAmount,
    bookSchoolShare,
    bookPayable,
    ebookAmount,
    grossTotal: fee.grossTotal ?? fee.totalStudentFees + printedBookAmount + ebookAmount,
    schoolShare: registrationSchoolShare + bookSchoolShare,
    amountDue,
  };
}

/** N is the number of student-stream registrations, not the number of student rows. */
export function calculateFee(studentStreamRegistrations: number, extras: FeeExtras = {}): FeeBreakdown {
  if (!Number.isInteger(studentStreamRegistrations) || studentStreamRegistrations < 0) {
    throw new Error("Student-stream count must be a whole number.");
  }
  const requestedPrinted = extras.printedBooks ?? 0;
  const requestedEbooks = extras.ebookAccess ?? 0;
  if (!Number.isInteger(requestedPrinted) || requestedPrinted < 0 || !Number.isInteger(requestedEbooks) || requestedEbooks < 0) {
    throw new Error("Book and e-book counts must be whole numbers.");
  }
  if (FEE_SCHOOL + FEE_TEJAS !== FEE_TOTAL || BOOK_SCHOOL_SHARE + BOOK_TEJAS !== BOOK_PRICE) {
    throw new Error("Fee shares do not add up to the published prices.");
  }
  // Printed books are withdrawn from this release. Ignore any requested printed-book extras.
  const printedBooks = PRINTED_BOOKS_AVAILABLE ? requestedPrinted : 0;
  // School registration does not collect the e-book fee; that is a separate purchase.
  const ebookAccess = 0;
  if (requestedEbooks > 0) {
    // Callers must use calculateEbookPurchase for e-book pricing.
  }
  const totalStudentFees = studentStreamRegistrations * FEE_TOTAL;
  const registrationSchoolShare = studentStreamRegistrations * FEE_SCHOOL;
  const registrationPayable = studentStreamRegistrations * FEE_TEJAS;
  const printedBookAmount = printedBooks * BOOK_PRICE;
  const bookSchoolShare = printedBooks * BOOK_SCHOOL_SHARE;
  const bookPayable = printedBooks * BOOK_TEJAS;
  const ebookAmount = 0;
  const schoolShare = registrationSchoolShare + bookSchoolShare;
  const grossTotal = totalStudentFees + printedBookAmount + ebookAmount;
  const amountDue = registrationPayable + bookPayable + ebookAmount;
  return {
    studentStreamRegistrations,
    totalStudentFees,
    registrationSchoolShare,
    registrationPayable,
    payableToTejas: registrationPayable,
    schoolShare,
    schoolShareApproved: SCHOOL_SHARE_APPROVED,
    printedBooks,
    printedBookAmount,
    bookSchoolShare,
    bookPayable,
    ebookAccess,
    ebookAmount,
    grossTotal,
    amountDue,
  };
}

export type Charge = {
  units: number;
  total: number;
  schoolShare: number;
  payableToTejas: number;
  panRequired: boolean;
};

export type EbookPurchaseQuote = {
  streams: number;
  amountDue: number;
  ebookCount: number;
  mockTestsIncluded: number;
  feePerStream: number;
};

/**
 * An individual student pays the full ₹150 per stream.
 * The school share is never applied.
 */
export function calculateIndividualRegistration(streams: number): Charge {
  if (!Number.isInteger(streams) || streams < 1 || streams > 3) {
    throw new Error("Select one, two, or three streams.");
  }
  const total = streams * FEE_TOTAL;
  return { units: streams, total, schoolShare: 0, payableToTejas: total, panRequired: false };
}

/**
 * ₹49 per selected eligible stream. Each stream includes one e-book and five mock tests.
 * Fee is always computed from the server-side stream count.
 */
export function calculateEbookPurchase(selectedStreams: number): EbookPurchaseQuote {
  if (!Number.isInteger(selectedStreams) || selectedStreams < 1 || selectedStreams > 3) {
    throw new Error("Select one, two, or three eligible streams.");
  }
  if (!EBOOK_SALE_OPEN) throw new Error("E-book sale is not open.");
  return {
    streams: selectedStreams,
    amountDue: selectedStreams * EBOOK_FEE,
    ebookCount: selectedStreams,
    mockTestsIncluded: selectedStreams * 5,
    feePerStream: EBOOK_FEE,
  };
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
