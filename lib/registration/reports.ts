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
    rows.push(line(["Reference", "School", "PAN", "State", "District", "City", "PIN", "Principal", "Coordinator", "Students", "Student-streams", "Amount due", "Payment status", "PAN flagged"]));
    for (const record of records) {
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
        record.fee.studentStreamRegistrations,
        record.fee.amountDue ?? record.fee.payableToTejas,
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
    rows.push(line(["Reference", "School", "Status", "Mode", "Paid on", "Payer", "Transaction reference", "Amount due", "Review note"]));
    for (const record of records) {
      rows.push(line([
        record.reference,
        record.school.schoolName,
        statusLabel(record.payment.status),
        record.payment.mode ?? "",
        record.payment.paidOn ?? "",
        record.payment.payerName ?? "",
        record.payment.transactionReference ?? "",
        record.fee.amountDue ?? record.fee.payableToTejas,
        record.payment.reviewNote ?? "",
      ]));
    }
  } else if (kind === "books") {
    rows.push(line(["Reference", "School", "Choice", "Quantity", "Amount"]));
    for (const record of records) {
      const quantity = record.school.printedBooks === "yes" ? record.school.bookQuantity : 0;
      rows.push(line([record.reference, record.school.schoolName, record.school.printedBooks ?? "no", quantity, record.fee.printedBookAmount ?? 0]));
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
