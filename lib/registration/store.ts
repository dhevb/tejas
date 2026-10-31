import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FeeBreakdown } from "@/lib/registration/fee";
import { maskPan } from "@/lib/registration/fields";
import type { SchoolForm } from "@/lib/registration/school";
import { streamById } from "@/lib/registration/schema";
import type { StudentRecord } from "@/lib/registration/sheet";
import {
  attachReceipt as attachRemoteReceipt,
  configured as remoteConfigured,
  findIdempotent as findRemoteIdempotent,
  insertRegistration,
  listRegistrations,
  panSeen,
  readReceipt as readRemoteReceipt,
  readRegistration as readRemoteRegistration,
  readUpload as readRemoteUpload,
  storeIdempotency as storeRemoteIdempotency,
  transactionSeen,
  updatePayment as updateRemotePayment,
} from "@/lib/registration/database";
import { dataDir } from "@/lib/registration/paths";
import { referenceIsValid } from "@/lib/registration/reference";
import { openBytes, sealBytes } from "@/lib/registration/seal";

export type PaymentStatus = "pending_instructions" | "awaiting_payment" | "reported" | "confirmed" | "rejected" | "refund_pending";

export type PaymentEvent = {
  at: string;
  status: PaymentStatus;
  note: string | null;
};

export type RegistrationRecord = {
  reference: string;
  createdAt: string;
  school: SchoolForm;
  students: StudentRecord[];
  fee: FeeBreakdown;
  payment: {
    status: PaymentStatus;
    transactionReference: string | null;
    reviewNote: string | null;
    mode?: string | null;
    paidOn?: string | null;
    payerName?: string | null;
    history?: PaymentEvent[];
  };
  uploadExt: "xlsx" | "xls" | "csv";
  receiptExt: "pdf" | "jpg" | "png" | "webp" | null;
};

export type PublicSummary = {
  reference: string;
  schoolName: string;
  studentCount: number;
  studentStreamRegistrations: number;
  totalStudentFees: number;
  payableToTejas: number;
  schoolShare: number;
  printedBookAmount: number;
  ebookAmount: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
  paymentLabel: string;
  nextStep: string;
  emailSent: false;
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending_instructions: "Payment Not Submitted",
  awaiting_payment: "Payment Not Submitted",
  reported: "Verification Pending",
  confirmed: "Verified",
  rejected: "Rejected",
  refund_pending: "Refund/Adjustment Pending",
};

const NEXT_STEP: Record<PaymentStatus, string> = {
  pending_instructions:
    "The official account details are on the registration page. Payment-proof submission is not open yet. Keep this reference. This submission does not confirm payment. No confirmation email has been sent.",
  awaiting_payment:
    "This registration is saved. It is not a payment receipt. When you pay the amount payable to TEJAS Olympiad through the official instructions, you can add the transaction reference on this page. No confirmation email has been sent.",
  reported:
    "Payment proof received. Payment verification is pending. Registration will be confirmed after verification. Uploading proof does not by itself confirm payment. No confirmation email has been sent.",
  confirmed: "TEJAS Olympiad has confirmed the payment against this reference. No confirmation email has been sent.",
  rejected: "The reported payment was not accepted. Use the contact on this website before transferring any further amount. No confirmation email has been sent.",
  refund_pending: "A refund or adjustment is pending. This is not a new payment confirmation. No confirmation email has been sent.",
};

export function toPublicSummary(record: RegistrationRecord): PublicSummary {
  return {
    reference: record.reference,
    schoolName: record.school.schoolName,
    studentCount: record.students.length,
    studentStreamRegistrations: record.fee.studentStreamRegistrations,
    totalStudentFees: record.fee.totalStudentFees,
    payableToTejas: record.fee.payableToTejas,
    schoolShare: record.fee.schoolShare,
    printedBookAmount: record.fee.printedBookAmount ?? 0,
    ebookAmount: record.fee.ebookAmount ?? 0,
    amountDue: record.fee.amountDue ?? record.fee.payableToTejas,
    paymentStatus: record.payment.status,
    paymentLabel: STATUS_LABEL[record.payment.status],
    nextStep: NEXT_STEP[record.payment.status],
    emailSent: false,
  };
}

function regDir(reference: string) {
  if (!referenceIsValid(reference)) throw new Error("Invalid reference.");
  return path.join(dataDir(), "registrations", reference);
}

async function writePrivate(file: string, bytes: Buffer) {
  await writeFile(file, bytes, { mode: 0o600 });
  await chmod(file, 0o600);
}

export async function saveRegistration(input: {
  reference: string;
  school: SchoolForm;
  students: StudentRecord[];
  fee: FeeBreakdown;
  status: PaymentStatus;
  transactionReference: string | null;
  paymentMode?: string | null;
  paidOn?: string | null;
  payerName?: string | null;
  upload: Buffer;
  uploadExt: RegistrationRecord["uploadExt"];
  receipt: Buffer | null;
  receiptExt: RegistrationRecord["receiptExt"];
  idempotencyKey?: string;
  payloadHash?: string;
}): Promise<RegistrationRecord> {
  const record: RegistrationRecord = {
    reference: input.reference,
    createdAt: new Date().toISOString(),
    school: input.school,
    students: input.students,
    fee: input.fee,
    payment: {
      status: input.status,
      transactionReference: input.transactionReference,
      reviewNote: null,
      mode: input.paymentMode ?? null,
      paidOn: input.paidOn ?? null,
      payerName: input.payerName ?? null,
      history: [{ at: new Date().toISOString(), status: input.status, note: null }],
    },
    uploadExt: input.uploadExt,
    receiptExt: input.receipt ? input.receiptExt : null,
  };
  if (remoteConfigured()) {
    await insertRegistration(
      record,
      { upload: input.upload, receipt: input.receipt },
      input.idempotencyKey && input.payloadHash ? { key: input.idempotencyKey, hash: input.payloadHash } : undefined,
    );
    console.info(`registration stored ${input.reference} students=${input.students.length} streams=${input.fee.studentStreamRegistrations} durable=yes`);
    return record;
  }
  if (process.env.VERCEL === "1") {
    throw new Error("Registration storage is not configured.");
  }
  const dir = regDir(input.reference);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await chmod(path.dirname(dir), 0o700).catch(() => undefined);
  await writePrivate(path.join(dir, "record.json"), sealBytes(Buffer.from(JSON.stringify(record))));
  await writePrivate(path.join(dir, `upload.${input.uploadExt}`), sealBytes(input.upload));
  if (input.receipt && input.receiptExt) {
    await writePrivate(path.join(dir, `receipt.${input.receiptExt}`), sealBytes(input.receipt));
  }
  if (input.idempotencyKey && input.payloadHash) await storeIdempotency(input.idempotencyKey, input.reference, input.payloadHash);
  console.info(`registration stored ${input.reference} students=${input.students.length} streams=${input.fee.studentStreamRegistrations} durable=no`);
  return record;
}

export async function readRegistration(reference: string): Promise<RegistrationRecord | null> {
  if (!referenceIsValid(reference)) return null;
  if (remoteConfigured()) return readRemoteRegistration(reference);
  try {
    const raw = await readFile(path.join(regDir(reference), "record.json"));
    const parsed = JSON.parse(openBytes(raw).toString("utf8")) as RegistrationRecord;
    if (parsed.reference !== reference) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readUpload(reference: string): Promise<{ filename: string; bytes: Buffer } | null> {
  const record = await readRegistration(reference);
  if (!record) return null;
  if (remoteConfigured()) {
    const bytes = await readRemoteUpload(reference, record.uploadExt);
    return bytes ? { filename: `tejas-upload-${reference}.${record.uploadExt}`, bytes } : null;
  }
  try {
    const bytes = openBytes(await readFile(path.join(regDir(reference), `upload.${record.uploadExt}`)));
    return { filename: `tejas-upload-${reference}.${record.uploadExt}`, bytes };
  } catch {
    return null;
  }
}

export async function readReceipt(reference: string): Promise<{ filename: string; bytes: Buffer; contentType: string } | null> {
  const record = await readRegistration(reference);
  if (!record?.receiptExt) return null;
  const types = { pdf: "application/pdf", jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
  if (remoteConfigured()) {
    const bytes = await readRemoteReceipt(reference, record.receiptExt);
    return bytes ? { filename: `tejas-receipt-${reference}.${record.receiptExt}`, bytes, contentType: types[record.receiptExt] } : null;
  }
  try {
    const bytes = openBytes(await readFile(path.join(regDir(reference), `receipt.${record.receiptExt}`)));
    return { filename: `tejas-receipt-${reference}.${record.receiptExt}`, bytes, contentType: types[record.receiptExt] };
  } catch {
    return null;
  }
}

export async function updatePayment(reference: string, status: PaymentStatus, reviewNote: string | null): Promise<RegistrationRecord | null> {
  const record = await readRegistration(reference);
  if (!record) return null;
  record.payment.status = status;
  record.payment.reviewNote = reviewNote;
  record.payment.history = [...(record.payment.history ?? []), { at: new Date().toISOString(), status, note: reviewNote }];
  if (remoteConfigured()) {
    await updateRemotePayment(reference, record);
    console.info(`payment status ${reference} ${status} durable=yes`);
    return record;
  }
  if (process.env.VERCEL === "1") throw new Error("Registration storage is not configured.");
  await writePrivate(path.join(regDir(reference), "record.json"), sealBytes(Buffer.from(JSON.stringify(record))));
  console.info(`payment status ${reference} ${status} durable=no`);
  return record;
}

export async function attachReceipt(
  reference: string,
  transactionReference: string,
  receipt: Buffer,
  receiptExt: NonNullable<RegistrationRecord["receiptExt"]>,
  meta: { mode: string; paidOn: string; payerName: string },
): Promise<RegistrationRecord | null> {
  const record = await readRegistration(reference);
  if (!record) return null;
  if (record.payment.status === "confirmed" || record.payment.status === "reported" || record.payment.status === "refund_pending") return null;
  record.payment.status = "reported";
  record.payment.transactionReference = transactionReference;
  record.payment.mode = meta.mode;
  record.payment.paidOn = meta.paidOn;
  record.payment.payerName = meta.payerName;
  record.payment.history = [...(record.payment.history ?? []), { at: new Date().toISOString(), status: "reported", note: null }];
  record.receiptExt = receiptExt;
  if (remoteConfigured()) {
    await attachRemoteReceipt(reference, record, receipt);
    console.info(`payment reported ${reference} durable=yes`);
    return record;
  }
  if (process.env.VERCEL === "1") throw new Error("Registration storage is not configured.");
  await writePrivate(path.join(regDir(reference), "record.json"), sealBytes(Buffer.from(JSON.stringify(record))));
  await writePrivate(path.join(regDir(reference), `receipt.${receiptExt}`), sealBytes(receipt));
  console.info(`payment reported ${reference} durable=no`);
  return record;
}

export async function listStoredRegistrations(): Promise<RegistrationRecord[]> {
  if (remoteConfigured()) return listRegistrations();
  const root = path.join(dataDir(), "registrations");
  let names: string[] = [];
  try {
    names = await readdir(root);
  } catch {
    return [];
  }
  const records: RegistrationRecord[] = [];
  for (const name of names) {
    if (!referenceIsValid(name)) continue;
    const record = await readRegistration(name);
    if (record) records.push(record);
  }
  return records;
}

export async function panSeenBefore(pan: string): Promise<boolean> {
  if (remoteConfigured()) return panSeen(pan);
  const records = await listStoredRegistrations();
  return records.some((record) => record.school.pan === pan);
}

export async function transactionSeenBefore(reference: string): Promise<boolean> {
  const needle = reference.trim().toUpperCase();
  if (!needle) return false;
  if (remoteConfigured()) return transactionSeen(needle);
  const records = await listStoredRegistrations();
  return records.some((record) => (record.payment.transactionReference ?? "").trim().toUpperCase() === needle);
}

export type StaffRow = PublicSummary & {
  coordinatorName: string;
  coordinatorEmail: string;
  principalName: string;
  maskedPan: string;
  panDuplicate: boolean;
  createdAt: string;
  printedBooks: number;
  ebookAccess: number;
  transactionReference: string | null;
  paymentMode: string | null;
};

export type StaffOverview = {
  schools: number;
  students: number;
  studentStreams: number;
  amountDue: number;
  classCounts: Record<string, number>;
  streamCounts: Record<string, number>;
  printedBooks: number;
  ebookAccess: number;
  payments: Record<PaymentStatus, number>;
};

export async function staffSnapshot(): Promise<{ registrations: StaffRow[]; overview: StaffOverview }> {
  const records = await listStoredRegistrations();
  const payments: Record<PaymentStatus, number> = {
    pending_instructions: 0,
    awaiting_payment: 0,
    reported: 0,
    confirmed: 0,
    rejected: 0,
    refund_pending: 0,
  };
  const classCounts: Record<string, number> = {};
  const streamCounts: Record<string, number> = {};
  let students = 0;
  let studentStreams = 0;
  let amountDue = 0;
  let printedBooks = 0;
  let ebookAccess = 0;
  const registrations: StaffRow[] = [];
  for (const record of records) {
    payments[record.payment.status] += 1;
    students += record.students.length;
    studentStreams += record.fee.studentStreamRegistrations;
    amountDue += record.fee.amountDue ?? record.fee.payableToTejas;
    const books = record.school.printedBooks === "yes" ? record.school.bookQuantity ?? 0 : 0;
    const ebooks = record.school.ebookAccess === "yes" ? record.students.length : 0;
    printedBooks += books;
    ebookAccess += ebooks;
    for (const student of record.students) {
      const classLabel = student.classLabel || String(student.classNumber);
      classCounts[classLabel] = (classCounts[classLabel] ?? 0) + 1;
      for (const stream of student.streams) {
        const name = streamById(stream).name;
        streamCounts[name] = (streamCounts[name] ?? 0) + 1;
      }
    }
    registrations.push({
      ...toPublicSummary(record),
      coordinatorName: record.school.coordinatorName,
      coordinatorEmail: record.school.coordinatorEmail,
      principalName: record.school.principalName,
      maskedPan: record.school.pan ? maskPan(record.school.pan) : "",
      panDuplicate: record.school.panDuplicate === true,
      createdAt: record.createdAt,
      printedBooks: books,
      ebookAccess: ebooks,
      transactionReference: record.payment.transactionReference,
      paymentMode: record.payment.mode ?? null,
    });
  }
  registrations.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return {
    registrations,
    overview: { schools: records.length, students, studentStreams, amountDue, classCounts, streamCounts, printedBooks, ebookAccess, payments },
  };
}

type IdemRow = { key: string; reference: string; hash: string; at: number };

function idemPath() {
  return path.join(dataDir(), "idempotency.json");
}

export function payloadHash(parts: Buffer[]): string {
  const hash = createHash("sha256");
  parts.forEach((part) => hash.update(part));
  return hash.digest("hex");
}

export async function findIdempotent(key: string, hash: string): Promise<string | "conflict" | null> {
  if (remoteConfigured()) return findRemoteIdempotent(key, hash);
  const rows = await readIdem();
  const found = rows.find((row) => row.key === key);
  if (!found) return null;
  if (found.hash !== hash) return "conflict";
  return found.reference;
}

export async function storeIdempotency(key: string, reference: string, hash: string) {
  if (remoteConfigured()) {
    await storeRemoteIdempotency(key, reference, hash);
    return;
  }
  const rows = (await readIdem()).filter((row) => row.at > Date.now() - 24 * 60 * 60 * 1000 && row.key !== key);
  rows.push({ key, reference, hash, at: Date.now() });
  await mkdir(dataDir(), { recursive: true, mode: 0o700 });
  await writePrivate(idemPath(), Buffer.from(JSON.stringify(rows.slice(-500))));
}

async function readIdem(): Promise<IdemRow[]> {
  try {
    const parsed = JSON.parse((await readFile(idemPath())).toString("utf8")) as IdemRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function statusLabel(status: PaymentStatus): string {
  return STATUS_LABEL[status];
}
