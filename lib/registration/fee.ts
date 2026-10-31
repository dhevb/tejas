/** Registration fee decided on 26–27 October 2026. The earlier ₹100 fee is not active. */
export const FEE_TOTAL = 150;
/** School share is not approved, so the full registration fee is payable to TEJAS. */
export const FEE_TEJAS = 150;
export const FEE_SCHOOL = 0;
export const SCHOOL_SHARE_PER_STREAM = 30;
export const SCHOOL_SHARE_APPROVED = false;
export const BOOK_PRICE = 170;
export const BOOK_SCHOOL_SHARE = 34;
export const BOOK_SHARE_APPROVED = false;
export const EBOOK_FEE = 49;
/** No e-book file is published, so the ₹49 rate is not collected. */
export const EBOOK_SALE_OPEN = false;
export const ONLINE_EXAM_FEE = 30;
export const ONLINE_EXAM_APPROVED = false;

export type FeeBreakdown = {
  studentStreamRegistrations: number;
  totalStudentFees: number;
  payableToTejas: number;
  schoolShare: number;
  schoolShareApproved: false;
  printedBooks: number;
  printedBookAmount: number;
  ebookAccess: number;
  ebookAmount: number;
  amountDue: number;
};

export type FeeExtras = {
  printedBooks?: number;
  ebookAccess?: number;
};

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
  const ebookAccess = EBOOK_SALE_OPEN ? requestedEbooks : 0;
  const totalStudentFees = studentStreamRegistrations * FEE_TOTAL;
  const printedBookAmount = printedBooks * BOOK_PRICE;
  const ebookAmount = ebookAccess * EBOOK_FEE;
  const payableToTejas = studentStreamRegistrations * FEE_TEJAS;
  return {
    studentStreamRegistrations,
    totalStudentFees,
    payableToTejas,
    schoolShare: studentStreamRegistrations * FEE_SCHOOL,
    schoolShareApproved: SCHOOL_SHARE_APPROVED,
    printedBooks,
    printedBookAmount,
    ebookAccess,
    ebookAmount,
    amountDue: payableToTejas + printedBookAmount + ebookAmount,
  };
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
