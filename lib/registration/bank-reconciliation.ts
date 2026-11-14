import type { BankLookup } from "@/lib/registration/payment-decision";

/**
 * Trusted bank reconciliation is not connected.
 *
 * Automatic approval needs an authenticated source that can confirm a settled credit:
 * the UTR, the exact amount, the receiving account (SBI 45726198627 for registration,
 * UBI 535402010016278 for books and e-books), the transaction time, and that the credit
 * has not been reversed or already used. The missing piece is a bank statement import
 * or the bank's own transaction API, with credentials held only on the server.
 * No such integration is configured in this application.
 *
 * This function does not invent a transaction. Until the owner connects that source,
 * every payment stays for staff review even when the screenshot UTR matches.
 */
export function lookupTrustedTransaction(_utr: string): BankLookup {
  return { available: false };
}
