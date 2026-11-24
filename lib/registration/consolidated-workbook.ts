import * as XLSX from "xlsx";
import { presentFee } from "@/lib/registration/fee";
import { maskPan } from "@/lib/registration/fields";
import { panHolderLabel } from "@/lib/registration/school";
import { streamById } from "@/lib/registration/schema";
import {
  classWiseCounts,
  countStreamRegistrations,
  countUniqueStudents,
  driveSyncLabel,
  driveSyncStatusForRegistration,
  reconcileFeeWithSaved,
  streamFeeLines,
} from "@/lib/registration/staff-metrics";
import { statusLabel, type RegistrationRecord } from "@/lib/registration/store";

function safe(value: string | number | null | undefined): string | number {
  const text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) return `'${text}`;
  return value ?? "";
}

function sheetFromRows(rows: Array<Array<string | number>>): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet(rows.map((row) => row.map((cell) => safe(cell))));
}

/** Multi-sheet consolidated workbook. Does not replace the original upload. */
export function consolidatedRegistrationWorkbook(record: RegistrationRecord, options?: { revealPan?: boolean }): Buffer {
  const fee = presentFee(record.fee);
  const streams = countStreamRegistrations(record.students);
  const unique = countUniqueStudents(record.students);
  const classCounts = classWiseCounts(record.students);
  const streamFees = streamFeeLines(streams);
  const reconcile = reconcileFeeWithSaved(streams, record.fee);
  const driveStatus = driveSyncStatusForRegistration(record.reference);
  const pan = options?.revealPan ? record.school.pan : maskPan(record.school.pan ?? "");

  const schoolDetails = [
    ["Field", "Value"],
    ["Reference", record.reference],
    ["Created at", record.createdAt],
    ["Channel", record.channel ?? "school-registration"],
    ["School name", record.school.schoolName],
    ["School address", record.school.schoolAddress],
    ["School category", record.school.schoolCategory],
    ["School email", record.school.schoolEmail],
    ["School mobile", record.school.schoolMobile],
    ["PAN (sensitive)", pan],
    ["PAN holder", panHolderLabel(record.school.panHolder)],
    ["PAN duplicate flag", record.school.panDuplicate ? "review" : ""],
    ["Previous participation", record.school.previousParticipation ? "yes" : "no"],
    ["Previous reference", record.school.previousReference ?? ""],
    ["Principal name", record.school.principalName],
    ["Principal mobile", record.school.principalMobile],
    ["Principal email", record.school.principalEmail],
    ["Coordinator name", record.school.coordinatorName],
    ["Coordinator designation", record.school.coordinatorDesignation],
    ["Coordinator mobile", record.school.coordinatorMobile],
    ["Coordinator email", record.school.coordinatorEmail],
  ];

  const studentDetails = [
    ["Full name", "Parent/Guardian", "Parent mobile", "Parent email", "DOB", "Class", "Section", "Roll", "Streams"],
    ...record.students.map((student) => [
      student.fullName,
      student.parentName,
      student.parentMobile,
      student.parentEmail,
      student.dateOfBirth,
      student.classLabel,
      student.section,
      student.rollNumber,
      student.streams.map((id) => streamById(id).name).join(", "),
    ]),
  ];

  const streamSummary = [
    ["Stream", "Student-stream count", "Gross ₹150", "School share ₹30", "TEJAS payable ₹120"],
    ...streamFees.map((line) => [line.label, line.count, line.gross, line.schoolShare, line.tejasPayable]),
    ["TOTAL", streams.total, streams.total * 150, streams.total * 30, streams.total * 120],
    [],
    ["Unique students (identity)", unique.unique],
    ["Student rows in upload", unique.rowCount],
    ...unique.ambiguousNotes.map((note) => ["Ambiguity note", note]),
  ];

  const classSummary = [
    ["Class", "Unique students"],
    ...Object.entries(classCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, count]) => [label, count]),
  ];

  const feeSummary = [
    ["Metric", "Saved value", "Derived from streams"],
    ["Student-stream registrations", fee.studentStreamRegistrations, streams.total],
    ["Gross registration", fee.totalStudentFees, streams.total * 150],
    ["School registration share", fee.registrationSchoolShare, streams.total * 30],
    ["Registration payable to TEJAS", fee.registrationPayable, streams.total * 120],
    ["Amount due (net to TEJAS)", fee.amountDue, ""],
    ["School share approved flag", String(record.fee.schoolShareApproved ?? ""), ""],
    ["Reconcile OK", reconcile.ok ? "yes" : "no", reconcile.notes.join("; ")],
  ];

  const paymentDetails = [
    ["Field", "Value"],
    ["Status", statusLabel(record.payment.status)],
    ["Mode", record.payment.mode ?? ""],
    ["Paid on", record.payment.paidOn ?? ""],
    ["Payer name", record.payment.payerName ?? ""],
    ["Transaction / UTR entered", record.payment.enteredUtr ?? record.payment.transactionReference ?? ""],
    ["Extracted UTR (OCR)", record.payment.extractedUtr ?? ""],
    ["Approval method", record.payment.approvalMethod ?? ""],
    ["Verification label", record.payment.verificationLabel ?? ""],
    ["Beneficiary match", record.payment.beneficiaryMatch ?? ""],
    ["Amount match", record.payment.amountMatch == null ? "" : String(record.payment.amountMatch)],
    ["Review note", record.payment.reviewNote ?? ""],
    ["Receipt stored", record.receiptExt ? `yes (.${record.receiptExt})` : "no"],
    ["Original upload", record.uploadExt ? `yes (.${record.uploadExt})` : "no"],
    [],
    ["History at", "Status", "Actor", "Note"],
    ...(record.payment.history ?? []).map((event) => [event.at, statusLabel(event.status), event.actor ?? "", event.note ?? ""]),
  ];

  const backup = [
    ["Field", "Value"],
    ["Drive sync status", driveSyncLabel(driveStatus)],
    ["Drive folder link", ""],
    ["Original upload preserved separately", "yes — use staff file?kind=upload"],
    ["Consolidated workbook", "this file"],
    ["Note", "Google Drive backup is not configured in the app. See TEJAS-GOOGLE-DRIVE-BACKUP-DESIGN.md."],
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheetFromRows(schoolDetails), "School Details");
  XLSX.utils.book_append_sheet(book, sheetFromRows(studentDetails), "Student Details");
  XLSX.utils.book_append_sheet(book, sheetFromRows(streamSummary), "Stream-wise Summary");
  XLSX.utils.book_append_sheet(book, sheetFromRows(classSummary), "Class-wise Summary");
  XLSX.utils.book_append_sheet(book, sheetFromRows(feeSummary), "Fee Summary");
  XLSX.utils.book_append_sheet(book, sheetFromRows(paymentDetails), "Payment Details");
  XLSX.utils.book_append_sheet(book, sheetFromRows(backup), "File Backup Status");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
