import { BOOK_BANK, REGISTRATION_BANK } from "@/lib/registration/official-bank";

export type PaymentCategory = "school-registration" | "individual-registration" | "school-book" | "individual-book" | "ebook";

export type BankTransaction = {
  status: "settled" | "pending" | "failed" | "reversed";
  amount: number;
  accountNumber: string;
  alreadyUsed: boolean;
};

/** A trusted source either confirms a transaction or says it has no such credit. */
export type BankLookup =
  | { available: false }
  | { available: true; transaction: BankTransaction | null };

export type PaymentDecision = {
  outcome: "automatic" | "staff_review";
  approvalMethod: "automatic" | "pending";
  reason: string;
  bankResult: "unavailable" | "not_found" | "pending" | "failed" | "reversed" | "amount_mismatch" | "account_mismatch" | "duplicate" | "confirmed" | "utr_mismatch" | "unreadable";
};

export function receivingAccount(category: PaymentCategory): string {
  if (category === "school-book" || category === "individual-book" || category === "ebook") return BOOK_BANK.accountNumber;
  return REGISTRATION_BANK.accountNumber;
}

/**
 * Compare the entered UTR with the value read from the screenshot.
 * Only surrounding and internal whitespace is ignored.
 */
export function utrsMatch(entered: string, extracted: string | null): boolean {
  if (!extracted) return false;
  const normalise = (value: string) => value.replace(/\s+/g, "");
  return normalise(entered) === normalise(extracted) && normalise(entered).length > 0;
}

/**
 * Decide whether a payment can be approved without staff.
 * A screenshot match alone is never enough. There is no simulated bank response here:
 * the caller supplies the trusted lookup result, and an unavailable lookup stays in review.
 */
export function decidePayment(input: {
  enteredUtr: string;
  extractedUtr: string | null;
  expectedAmount: number;
  expectedAccount: string;
  bank: BankLookup;
}): PaymentDecision {
  if (!input.extractedUtr) {
    return { outcome: "staff_review", approvalMethod: "pending", reason: "The UTR could not be read from the screenshot.", bankResult: "unreadable" };
  }
  if (!utrsMatch(input.enteredUtr, input.extractedUtr)) {
    return { outcome: "staff_review", approvalMethod: "pending", reason: "The UTR entered does not match the UTR read from the screenshot.", bankResult: "utr_mismatch" };
  }
  if (!input.bank.available) {
    return { outcome: "staff_review", approvalMethod: "pending", reason: "No trusted bank transaction source is connected, so the payment stays with staff.", bankResult: "unavailable" };
  }
  const transaction = input.bank.transaction;
  if (!transaction) {
    return { outcome: "staff_review", approvalMethod: "pending", reason: "The trusted bank source has no transaction for this UTR.", bankResult: "not_found" };
  }
  if (transaction.status === "pending") {
    return { outcome: "staff_review", approvalMethod: "pending", reason: "The bank transaction is still pending.", bankResult: "pending" };
  }
  if (transaction.status === "failed" || transaction.status === "reversed") {
    return { outcome: "staff_review", approvalMethod: "pending", reason: "The bank transaction is not a successful settled credit.", bankResult: transaction.status };
  }
  if (transaction.amount !== input.expectedAmount) {
    return { outcome: "staff_review", approvalMethod: "pending", reason: "The bank amount does not match the amount payable.", bankResult: "amount_mismatch" };
  }
  if (transaction.accountNumber !== input.expectedAccount) {
    return { outcome: "staff_review", approvalMethod: "pending", reason: "The credit is not in the account for this payment.", bankResult: "account_mismatch" };
  }
  if (transaction.alreadyUsed) {
    return { outcome: "staff_review", approvalMethod: "pending", reason: "This UTR is already used for another payment.", bankResult: "duplicate" };
  }
  return { outcome: "automatic", approvalMethod: "automatic", reason: "The screenshot, UTR, amount, account, and unused settled credit all match.", bankResult: "confirmed" };
}
