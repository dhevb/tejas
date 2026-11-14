import type { BankLookup } from "@/lib/registration/payment-decision";

/**
 * Trusted bank reconciliation is not connected.
 *
 * Automatic approval needs an authenticated source that can confirm a settled credit:
 * the UTR, the amount, the receiving account, the transaction time, and that the credit
 * has not been reversed. A bank statement import or the bank's own transaction API,
 * with credentials held only on the server, is the missing piece.
 *
 * This function does not invent a transaction. Until that source is configured by the
 * owner, every payment stays for staff review even when the screenshot UTR matches.
 */
export function lookupTrustedTransaction(_utr: string): BankLookup {
  return { available: false };
}
