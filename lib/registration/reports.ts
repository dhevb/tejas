import { presentFee } from "@/lib/registration/fee";
import { maskPan } from "@/lib/registration/fields";
import { streamById } from "@/lib/registration/schema";
import { statusLabel, type RegistrationRecord } from "@/lib/registration/store";

export type ReportKind = "schools" | "students" | "payments" | "books" | "ebooks";

function cell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  if (/[",\n\r]/.test(guarded)) return `"${guarded.replace(/"/g, '""')}"`;
  return guarded;
}

function line(values: Array<string | number | null | undefined>): string {
  return values.map(cell).join(",");
}

export function registrationsToCsv(records: RegistrationRecord[], kind: ReportKind, revealPan: boolean): string {
  const rows: string[] = [];
  if (kind === "schools") {
    rows.push(line(["Reference", "School", "PAN", "State", "District", "City", "PIN", "Principal", "Coordinator", "Students", "Student-streams", "Gross registration", "Registration school share", "Registration payable to TEJAS", "Book gross", "Book school share", "Book payable to TEJAS", "Combined gross", "Combined school share", "Payable to TEJAS", "Payment status", "PAN flagged"]));
    for (const record of records) {
      const fee = presentFee(record.fee);
      rows.push(line([
        record.reference,
        record.school.schoolName,
        revealPan ? record.school.pan : maskPan(record.school.pan ?? ""),
        record.school.state,
        record.school.district,
        record.school.city,
        record.school.pin,
        record.school.principalName,
        record.school.coordinatorName,
        record.students.length,
        fee.studentStreamRegistrations,
        fee.totalStudentFees,
        fee.registrationSchoolShare,
        fee.registrationPayable,
        fee.printedBookAmount,
        fee.bookSchoolShare,
        fee.bookPayable,
        fee.grossTotal,
        fee.schoolShare,
        fee.amountDue,
        statusLabel(record.payment.status),
        record.school.panDuplicate ? "review" : "",
      ]));
    }
  } else if (kind === "students") {
    rows.push(line(["Reference", "School", "Student", "Class", "Section", "Roll number", "Streams", "Parent or guardian", "Parent mobile", "Parent email"]));
    for (const record of records) {
      for (const student of record.students) {
        rows.push(line([
          record.reference,
          record.school.schoolName,
          student.fullName,
          student.classLabel,
          student.section,
          student.rollNumber,
          student.streams.map((id) => streamById(id).name).join("; "),
          student.parentName,
          student.parentMobile,
          student.parentEmail,
        ]));
      }
    }
  } else if (kind === "payments") {
    rows.push(line(["Reference", "School", "Status", "Mode", "Paid on", "Payer", "Transaction reference", "Gross collected", "School share retained", "Payable to TEJAS", "Review note"]));
    for (const record of records) {
      const fee = presentFee(record.fee);
      rows.push(line([
        record.reference,
        record.school.schoolName,
        statusLabel(record.payment.status),
        record.payment.mode ?? "",
        record.payment.paidOn ?? "",
        record.payment.payerName ?? "",
        record.payment.transactionReference ?? "",
        fee.grossTotal,
        fee.schoolShare,
        fee.amountDue,
        record.payment.reviewNote ?? "",
      ]));
    }
  } else if (kind === "books") {
    rows.push(line(["Reference", "School", "Choice", "Quantity", "Gross book amount", "School book share", "Book payable to TEJAS"]));
    for (const record of records) {
      const fee = presentFee(record.fee);
      const quantity = record.school.printedBooks === "yes" ? record.school.bookQuantity : 0;
      rows.push(line([record.reference, record.school.schoolName, record.school.printedBooks ?? "no", quantity, fee.printedBookAmount, fee.bookSchoolShare, fee.bookPayable]));
    }
  } else {
    rows.push(line(["Reference", "School", "Choice", "Students", "Amount", "Access"]));
    for (const record of records) {
      const students = record.school.ebookAccess === "yes" ? record.students.length : 0;
      rows.push(line([
        record.reference,
        record.school.schoolName,
        record.school.ebookAccess ?? "no",
        students,
        record.fee.ebookAmount ?? 0,
        "not activated",
      ]));
    }
  }
  return `${rows.join("\n")}\n`;
}
