import * as XLSX from "xlsx";
import { presentFee } from "@/lib/registration/fee";
import { parseIndiaAddress, UNIDENTIFIED_LOCATION } from "@/lib/registration/india-address";
import { panValueForExport } from "@/lib/registration/pan-access";
import { panHolderLabel } from "@/lib/registration/school";
import { countUniqueStudents } from "@/lib/registration/staff-metrics";
import { statusLabel, type RegistrationRecord } from "@/lib/registration/store";

export const COMPLETE_WORKBOOK_SHEET_NAME = "School Registrations";

export type CompleteFileAvailability = {
  uploadAvailable: boolean;
  receiptAvailable: boolean;
};

export type CompleteWorkbookOptions = {
  /** Absolute allowlisted origin used for owner-authenticated file links. */
  origin: string;
  /** Scope label written into the workbook banner row. */
  scopeLabel?: string;
  /**
   * Per-reference file existence. When omitted, upload is assumed present and
   * receipt follows receiptExt only (legacy tests). Production export always passes checks.
   */
  fileAvailability?: Record<string, CompleteFileAvailability>;
};

type CellValue = string | number;

function safe(value: CellValue): CellValue {
  if (typeof value !== "string") return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export function ownerFileDownloadUrl(origin: string, reference: string, kind: "upload" | "receipt"): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/api/register/admin/registrations/${encodeURIComponent(reference)}/file?kind=${kind}`;
}

function lastPaymentAt(record: RegistrationRecord): string {
  const history = record.payment.history ?? [];
  if (history.length === 0) return "";
  return history[history.length - 1]!.at;
}

/**
 * Column headers for the single-worksheet Complete School Registration Excel.
 * Includes every SchoolForm field plus derived location, payment, and file columns.
 */
export const COMPLETE_REGISTRATION_COLUMNS = [
  "Reference",
  "Channel",
  "Registration created at",
  "School name",
  "School address (original)",
  "Stored state (original)",
  "Stored district (original)",
  "Stored city (original)",
  "Stored PIN (original)",
  "State (derived from address)",
  "District (derived from address)",
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
  "Transaction reference",
  "Entered UTR",
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

/** SchoolForm field names that must appear as workbook columns (directly or labelled). */
export const SCHOOL_FORM_FIELD_COVERAGE: Array<{ field: string; column: (typeof COMPLETE_REGISTRATION_COLUMNS)[number] }> = [
  { field: "schoolName", column: "School name" },
  { field: "schoolAddress", column: "School address (original)" },
  { field: "state", column: "Stored state (original)" },
  { field: "district", column: "Stored district (original)" },
  { field: "city", column: "Stored city (original)" },
  { field: "pin", column: "Stored PIN (original)" },
  { field: "schoolEmail", column: "School email" },
  { field: "schoolMobile", column: "School mobile" },
  { field: "schoolCategory", column: "School category" },
  { field: "affiliationBoard", column: "Affiliation board" },
  { field: "affiliationNumber", column: "Affiliation number" },
  { field: "pan", column: "PAN (masked)" },
  { field: "panHolder", column: "PAN holder" },
  { field: "panDuplicate", column: "PAN duplicate flag" },
  { field: "principalName", column: "Principal name" },
  { field: "principalMobile", column: "Principal mobile" },
  { field: "principalEmail", column: "Principal email" },
  { field: "principalDesignation", column: "Principal designation" },
  { field: "coordinatorName", column: "Coordinator name" },
  { field: "coordinatorMobile", column: "Coordinator mobile" },
  { field: "coordinatorEmail", column: "Coordinator email" },
  { field: "coordinatorDesignation", column: "Coordinator designation" },
  { field: "representativeName", column: "Representative name" },
  { field: "representativeDesignation", column: "Representative designation" },
  { field: "previousParticipation", column: "Previous participation" },
  { field: "previousReference", column: "Previous reference" },
  { field: "printedBooks", column: "Printed books choice" },
  { field: "bookQuantity", column: "Printed book quantity" },
  { field: "ebookAccess", column: "E-book access choice" },
];

function availabilityFor(
  record: RegistrationRecord,
  map: CompleteWorkbookOptions["fileAvailability"],
): CompleteFileAvailability {
  if (map?.[record.reference]) return map[record.reference]!;
  return {
    uploadAvailable: true,
    receiptAvailable: Boolean(record.receiptExt),
  };
}

/**
 * Build one-worksheet Complete School Registration workbook.
 * One row per registration. File cells are owner-route hyperlinks only when the file exists.
 */
export function buildCompleteRegistrationWorkbook(
  records: RegistrationRecord[],
  options: CompleteWorkbookOptions,
): Buffer {
  const origin = options.origin.trim();
  const httpsOk = /^https:\/\/[^\s/]+$/i.test(origin);
  const localOk = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  if (!origin || (!httpsOk && !localOk)) {
    throw new Error("Complete workbook requires an allowlisted absolute origin for file links.");
  }

  const headerNote = [
    "Complete School Registration Excel — one worksheet, one row per registration.",
    options.scopeLabel ?? "Scope: all listed registrations in this export.",
    "Student upload and payment-proof links open the Owner-authenticated download route only when the file exists. An active Owner browser session is required. Links are not public Storage URLs.",
    "OCR match is not bank verification. Gross, school share and TEJAS remittance are independent saved fields. Stored state/district/city/PIN are original saved values; derived State/District come from the address parser.",
  ].join(" ");

  const aoa: CellValue[][] = [
    [headerNote],
    [...COMPLETE_REGISTRATION_COLUMNS],
  ];

  const hyperlinks: Array<{ r: number; c: number; url: string; tooltip: string }> = [];

  for (const record of records) {
    const fee = presentFee(record.fee);
    const location = parseIndiaAddress(record.school.schoolAddress);
    const files = availabilityFor(record, options.fileAvailability);
    const uploadName = files.uploadAvailable
      ? `tejas-upload-${record.reference}.${record.uploadExt}`
      : "";
    const receiptName = files.receiptAvailable && record.receiptExt
      ? `tejas-receipt-${record.reference}.${record.receiptExt}`
      : "";
    const uploadLinkLabel = files.uploadAvailable
      ? "Open student upload (Owner login required)"
      : "Student upload unavailable";
    const receiptLinkLabel = files.receiptAvailable
      ? "Open payment proof (Owner login required)"
      : "Payment proof unavailable";

    const row: CellValue[] = [
      record.reference,
      record.channel ?? "school-registration",
      record.createdAt,
      record.school.schoolName,
      record.school.schoolAddress,
      record.school.state ?? "",
      record.school.district ?? "",
      record.school.city ?? "",
      record.school.pin ?? "",
      location.state ?? UNIDENTIFIED_LOCATION,
      location.district ?? (location.state ? "District Not Identified" : UNIDENTIFIED_LOCATION),
      record.school.schoolEmail,
      record.school.schoolMobile,
      record.school.schoolCategory,
      record.school.affiliationBoard,
      record.school.affiliationNumber ?? "",
      panValueForExport(record.school.pan, false),
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
      record.payment.transactionReference ?? "",
      record.payment.enteredUtr ?? "",
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
    if (files.uploadAvailable) {
      hyperlinks.push({
        r,
        c: uploadCol,
        url: ownerFileDownloadUrl(origin, record.reference, "upload"),
        tooltip: "Owner-authenticated student upload download",
      });
    }
    if (files.receiptAvailable) {
      hyperlinks.push({
        r,
        c: receiptCol,
        url: ownerFileDownloadUrl(origin, record.reference, "receipt"),
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
