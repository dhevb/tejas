/** Gross registration fee in the 31 October 2026 invitation. */
export const FEE_TOTAL = 150;
/** School retains 20 percent. TEJAS receives 80 percent. */
export const FEE_SCHOOL = 30;
export const FEE_TEJAS = 120;
export const SCHOOL_SHARE_PER_STREAM = FEE_SCHOOL;
export const SCHOOL_SHARE_APPROVED = true;
export const BOOK_PRICE = 170;
export const BOOK_SCHOOL_SHARE = 34;
export const BOOK_TEJAS = 136;
export const BOOK_SHARE_APPROVED = true;
export const EBOOK_FEE = 49;
/** School registration does not collect the ₹49 e-book fee. The learning portal prices that fee separately. */
export const EBOOK_SALE_OPEN = false;
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
  const printedBooks = extras.printedBooks ?? 0;
  const requestedEbooks = extras.ebookAccess ?? 0;
  if (!Number.isInteger(printedBooks) || printedBooks < 0 || !Number.isInteger(requestedEbooks) || requestedEbooks < 0) {
    throw new Error("Book and e-book counts must be whole numbers.");
  }
  if (FEE_SCHOOL + FEE_TEJAS !== FEE_TOTAL || BOOK_SCHOOL_SHARE + BOOK_TEJAS !== BOOK_PRICE) {
    throw new Error("Fee shares do not add up to the published prices.");
  }
  const ebookAccess = EBOOK_SALE_OPEN ? requestedEbooks : 0;
  const totalStudentFees = studentStreamRegistrations * FEE_TOTAL;
  const registrationSchoolShare = studentStreamRegistrations * FEE_SCHOOL;
  const registrationPayable = studentStreamRegistrations * FEE_TEJAS;
  const printedBookAmount = printedBooks * BOOK_PRICE;
  const bookSchoolShare = printedBooks * BOOK_SCHOOL_SHARE;
  const bookPayable = printedBooks * BOOK_TEJAS;
  const ebookAmount = ebookAccess * EBOOK_FEE;
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

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
