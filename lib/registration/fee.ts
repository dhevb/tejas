export const FEE_TOTAL = 100;
export const FEE_TEJAS = 80;
export const FEE_SCHOOL = 20;

export type FeeBreakdown = {
  studentStreamRegistrations: number;
  totalStudentFees: number;
  payableToTejas: number;
  schoolShare: number;
};

/** N is the number of student-stream registrations, not the number of student rows. */
export function calculateFee(studentStreamRegistrations: number): FeeBreakdown {
  if (!Number.isInteger(studentStreamRegistrations) || studentStreamRegistrations < 0) {
    throw new Error("Student-stream count must be a whole number.");
  }
  return {
    studentStreamRegistrations,
    totalStudentFees: studentStreamRegistrations * FEE_TOTAL,
    payableToTejas: studentStreamRegistrations * FEE_TEJAS,
    schoolShare: studentStreamRegistrations * FEE_SCHOOL,
  };
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
