/**
 * Public bank details. Registration fees and book payments use different accounts.
 * Neither object includes a secret, a connection string, or a UPI ID.
 */

/** School registration fee. Do not use this account for e-book purchases. */
export const REGISTRATION_BANK = {
  accountHolder: "TEJAS OLYMPIAD",
  accountNumber: "45726198627",
  bankName: "State Bank of India",
  branch: "Chandigarh Main Branch",
  ifsc: "SBIN0000628",
} as const;

/**
 * E-book / mock-test payments. Account numbers unchanged.
 * Screenshot beneficiary matching also accepts the full official trust name
 * (Vidya Bharti Institute of Training and Research Trust) and verified truncations.
 */
export const BOOK_BANK = {
  accountHolder: "V.B. EDUCATIONAL TRUST",
  accountNumber: "535402010016278",
  bankName: "Union Bank of India (UBI)",
  branch: "Gita Niketan",
  ifsc: "UBIN0553549",
} as const;

export type PublicPayment = {
  detailsPublished: true;
  proofsAccepted: boolean;
  purpose: "school-registration";
  heading: string;
  message: string;
  bankName: string;
  branch: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
};

export function officialPublicPayment(proofsAccepted: boolean): PublicPayment {
  return {
    detailsPublished: true,
    proofsAccepted,
    purpose: "school-registration",
    heading: "Bank details — school registration",
    message: proofsAccepted
      ? "Transfer only the school registration amount payable to TEJAS. The school collects ₹150 for each student-stream, retains ₹30, and remits ₹120. This account is not used for e-book purchases. Upload a payment screenshot and the UTR. Automatic approval runs only when the screenshot UTR, beneficiary, amount, and success status all match. That is screenshot-based verification, not bank-statement confirmation."
      : "These are the official school-registration account details. Transfer only the registration amount payable to TEJAS. The school retains its share. This account is not used for e-book purchases. Payment-proof submission will open once the secure payment system is operational. You can submit the registration without a receipt. Sending this form does not confirm that a payment has been received.",
    bankName: REGISTRATION_BANK.bankName,
    branch: REGISTRATION_BANK.branch,
    accountHolder: REGISTRATION_BANK.accountHolder,
    accountNumber: REGISTRATION_BANK.accountNumber,
    ifsc: REGISTRATION_BANK.ifsc,
  };
}

export type BookPaymentDetails = {
  purpose: "book-payment";
  heading: string;
  message: string;
  bankName: string;
  branch: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
};

export function bookPublicPayment(): BookPaymentDetails {
  return {
    purpose: "book-payment",
    heading: "Company's bank details",
    message: "This account is for e-book and mock-test payments (₹49 per selected stream). It is not the school registration account. Printed-book orders are not offered in this release.",
    bankName: BOOK_BANK.bankName,
    branch: BOOK_BANK.branch,
    accountHolder: BOOK_BANK.accountHolder,
    accountNumber: BOOK_BANK.accountNumber,
    ifsc: BOOK_BANK.ifsc,
  };
}
