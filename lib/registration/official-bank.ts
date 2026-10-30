/**
 * Official TEJAS receipt account, authorised for public display on 31 October 2026.
 * This is the only place the account number, IFSC, and UPI ID are defined.
 * Payment-proof upload stays closed until durable storage is connected and tested.
 */
export const OFFICIAL_BANK = {
  accountHolder: "Department of Holistic Education",
  accountNumber: "42529022841",
  bankName: "State Bank of India",
  branch: "Chandigarh Main Branch",
  ifsc: "SBIN0000628",
  upiId: "holisticeducation@sbi",
} as const;

export type PublicPayment = {
  detailsPublished: true;
  proofsAccepted: boolean;
  heading: string;
  message: string;
  bankName: string;
  branch: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
};

export function officialPublicPayment(proofsAccepted: boolean): PublicPayment {
  return {
    detailsPublished: true,
    proofsAccepted,
    heading: "Official payment account",
    message: proofsAccepted
      ? "Transfer the server-calculated amount to this account. Uploading proof does not confirm the payment. Registration stays pending until TEJAS Olympiad verifies it."
      : "These are the official account details. Payment-proof submission will open once the secure payment system is operational. You can submit the registration without a receipt. Sending this form does not confirm that a payment has been received.",
    bankName: OFFICIAL_BANK.bankName,
    branch: OFFICIAL_BANK.branch,
    accountHolder: OFFICIAL_BANK.accountHolder,
    accountNumber: OFFICIAL_BANK.accountNumber,
    ifsc: OFFICIAL_BANK.ifsc,
    upiId: OFFICIAL_BANK.upiId,
  };
}
