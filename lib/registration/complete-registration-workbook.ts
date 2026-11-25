import * as XLSX from "xlsx";
import { presentFee } from "@/lib/registration/fee";
import { parseIndiaAddress, UNIDENTIFIED_LOCATION } from "@/lib/registration/india-address";
import { panHolderLabel } from "@/lib/registration/school";
import { countUniqueStudents } from "@/lib/registration/staff-metrics";
import { statusLabel, type RegistrationRecord } from "@/lib/registration/store";

export const COMPLETE_WORKBOOK_SHEET_NAME = "School Registrations";

export type CompleteWorkbookOptions = {
  /** Absolute origin used for owner-authenticated file links (e.g. https://tejas.dhe.org.in). */
  origin: string;
  /** Scope label written into the workbook banner row. */
  scopeLabel?: string;
};

type CellValue = string | number;

function safe(value: CellValue): CellValue {
  if (typeof value !== "string") return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function fileUrl(origin: string, reference: string, kind: "upload" | "receipt"): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/api/register/admin/registrations/${encodeURIComponent(reference)}/file?kind=${kind}`;
}

function lastPaymentAt(record: RegistrationRecord): string {
  const history = record.payment.history ?? [];
  if (history.length === 0) return "";
  return history[history.length - 1]!.at;
}

/** Column headers for the single-worksheet Complete School Registration Excel. */
export const COMPLETE_REGISTRATION_COLUMNS = [
  "Reference",
  "Channel",
  "Registration created at",
  "School name",
  "School address (original)",
  "State (from address)",
  "District (from address)",
  "School email",
  "School mobile",
  "School category",
  "Affiliation board",
  "Affiliation number",
  "PAN (masked)",
  "PAN holder",
  "PAN duplicate flag",
  "Principal name",
  "Principal mobile",
  "Principal email",
  "Principal designation",
  "Coordinator name",
  "Coordinator mobile",
  "Coordinator email",
  "Coordinator designation",
  "Representative name",
  "Representative designation",
  "Previous participation",
  "Previous reference",
  "Printed books choice",
  "Printed book quantity",
  "E-book access choice",
  "Student row count",
  "Unique student count (identity)",
  "Student-stream count",
  "Student upload file name",
  "Student upload download",
  "Payment status",
  "Payment status code",
  "Gross amount (grossTotal)",
  "School share (schoolShare)",
  "TEJAS remittance (amountDue)",
  "Registration school share",
  "Registration payable",
  "Book gross",
  "Book school share",
  "Book payable",
  "E-book amount",
  "Payment mode",
  "Paid on",
  "Payer name",
  "Entered UTR / transaction reference",
  "OCR-extracted UTR",
  "Approval method",
  "Verification label",
  "Beneficiary match",
  "Amount match",
  "Review note",
  "Payment last updated at",
  "Payment proof file name",
  "Payment proof download",
] as const;

function maskPan(pan: string): string {
  const clean = pan.replace(/\s+/g, "").toUpperCase();
  if (clean.length < 4) return "****";
  return `${"*".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

/**
 * Build one-worksheet Complete School Registration workbook.
 * One row per registration. File cells are owner-route hyperlinks (cookie session required).
 */
export function buildCompleteRegistrationWorkbook(
  records: RegistrationRecord[],
  options: CompleteWorkbookOptions,
): Buffer {
  const origin = options.origin.trim();
  if (!origin || !/^https?:\/\//i.test(origin)) {
    throw new Error("Complete workbook requires an absolute https origin for file links.");
  }

  const headerNote = [
    "Complete School Registration Excel — one worksheet, one row per registration.",
    options.scopeLabel ?? "Scope: all listed registrations in this export.",
    "Student upload and payment-proof links open the Owner-authenticated download route. An active Owner browser session is required. Links are not public Storage URLs.",
    "OCR match is not bank verification. Gross, school share and TEJAS remittance are independent saved fields.",
  ].join(" ");

  const aoa: CellValue[][] = [
    [headerNote],
    [...COMPLETE_REGISTRATION_COLUMNS],
  ];

  const hyperlinks: Array<{ r: number; c: number; url: string; tooltip: string }> = [];

  for (const record of records) {
    const fee = presentFee(record.fee);
    const location = parseIndiaAddress(record.school.schoolAddress);
    const uploadName = `tejas-upload-${record.reference}.${record.uploadExt}`;
    const receiptName = record.receiptExt ? `tejas-receipt-${record.reference}.${record.receiptExt}` : "";
    const uploadLinkLabel = "Open student upload (Owner login required)";
    const receiptLinkLabel = record.receiptExt
      ? "Open payment proof (Owner login required)"
      : "Payment proof unavailable";

    const row: CellValue[] = [
      record.reference,
      record.channel ?? "school-registration",
      record.createdAt,
      record.school.schoolName,
      record.school.schoolAddress,
      location.state ?? UNIDENTIFIED_LOCATION,
      location.district ?? (location.state ? "District Not Identified" : UNIDENTIFIED_LOCATION),
      record.school.schoolEmail,
      record.school.schoolMobile,
      record.school.schoolCategory,
      record.school.affiliationBoard,
      record.school.affiliationNumber ?? "",
      record.school.pan ? maskPan(record.school.pan) : "",
      panHolderLabel(record.school.panHolder),
      record.school.panDuplicate ? "yes" : "",
      record.school.principalName,
      record.school.principalMobile,
      record.school.principalEmail,
      record.school.principalDesignation,
      record.school.coordinatorName,
      record.school.coordinatorMobile,
      record.school.coordinatorEmail,
      record.school.coordinatorDesignation,
      record.school.representativeName ?? "",
      record.school.representativeDesignation ?? "",
      record.school.previousParticipation ? "yes" : "no",
      record.school.previousReference ?? "",
      record.school.printedBooks,
      record.school.bookQuantity,
      record.school.ebookAccess,
      record.students.length,
      countUniqueStudents(record.students).unique,
      fee.studentStreamRegistrations,
      uploadName,
      uploadLinkLabel,
      statusLabel(record.payment.status),
      record.payment.status,
      fee.grossTotal,
      fee.schoolShare,
      fee.amountDue,
      fee.registrationSchoolShare,
      fee.registrationPayable,
      fee.printedBookAmount,
      fee.bookSchoolShare,
      fee.bookPayable,
      fee.ebookAmount,
      record.payment.mode ?? "",
      record.payment.paidOn ?? "",
      record.payment.payerName ?? "",
      record.payment.enteredUtr ?? record.payment.transactionReference ?? "",
      record.payment.extractedUtr ?? "",
      record.payment.approvalMethod ?? "",
      record.payment.verificationLabel ?? "",
      record.payment.beneficiaryMatch ?? "",
      record.payment.amountMatch == null ? "" : record.payment.amountMatch ? "yes" : "no",
      record.payment.reviewNote ?? "",
      lastPaymentAt(record),
      receiptName,
      receiptLinkLabel,
    ];

    const r = aoa.length;
    aoa.push(row.map(safe));

    const uploadCol = COMPLETE_REGISTRATION_COLUMNS.indexOf("Student upload download");
    const receiptCol = COMPLETE_REGISTRATION_COLUMNS.indexOf("Payment proof download");
    hyperlinks.push({
      r,
      c: uploadCol,
      url: fileUrl(origin, record.reference, "upload"),
      tooltip: "Owner-authenticated student upload download",
    });
    if (record.receiptExt) {
      hyperlinks.push({
        r,
        c: receiptCol,
        url: fileUrl(origin, record.reference, "receipt"),
        tooltip: "Owner-authenticated payment proof download",
      });
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  for (const link of hyperlinks) {
    const addr = XLSX.utils.encode_cell({ r: link.r, c: link.c });
    const cell = sheet[addr] as XLSX.CellObject | undefined;
    if (!cell) continue;
    cell.l = { Target: link.url, Tooltip: link.tooltip };
  }

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, COMPLETE_WORKBOOK_SHEET_NAME);
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function completeWorkbookSheetNames(bytes: Buffer): string[] {
  const book = XLSX.read(bytes, { type: "buffer", bookVBA: false });
  return book.SheetNames;
}
