import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FeeBreakdown } from "@/lib/registration/fee";
import type { SchoolForm } from "@/lib/registration/school";
import type { StudentRecord } from "@/lib/registration/sheet";
import { dataDir } from "@/lib/registration/paths";
import { referenceIsValid } from "@/lib/registration/reference";
import { openBytes, sealBytes } from "@/lib/registration/seal";

export type PaymentStatus = "pending_instructions" | "awaiting_payment" | "reported" | "confirmed" | "rejected";

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
  paymentStatus: PaymentStatus;
  paymentLabel: string;
  nextStep: string;
  emailSent: false;
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending_instructions: "Pending Payment Instructions",
  awaiting_payment: "Awaiting payment",
  reported: "Payment reported — not yet verified",
  confirmed: "Payment confirmed by TEJAS Olympiad",
  rejected: "Payment not accepted",
};

const NEXT_STEP: Record<PaymentStatus, string> = {
  pending_instructions:
    "Official payment instructions have not been issued. Do not transfer money to any unverified account. Keep this reference. No confirmation email has been sent.",
  awaiting_payment:
    "This registration is saved. It is not a payment receipt. When you pay the amount payable to TEJAS Olympiad through the official instructions, you can add the transaction reference on this page. No confirmation email has been sent.",
  reported:
    "The transaction reference is on file and is waiting for TEJAS Olympiad to verify it. Submitting a reference does not by itself confirm payment. No confirmation email has been sent.",
  confirmed: "TEJAS Olympiad has confirmed the payment against this reference. No confirmation email has been sent.",
  rejected: "The reported payment was not accepted. Use the contact on this website before transferring any further amount. No confirmation email has been sent.",
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
  upload: Buffer;
  uploadExt: RegistrationRecord["uploadExt"];
  receipt: Buffer | null;
  receiptExt: RegistrationRecord["receiptExt"];
}): Promise<RegistrationRecord> {
  const dir = regDir(input.reference);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await chmod(path.dirname(dir), 0o700).catch(() => undefined);
  const record: RegistrationRecord = {
    reference: input.reference,
    createdAt: new Date().toISOString(),
    school: input.school,
    students: input.students,
    fee: input.fee,
    payment: { status: input.status, transactionReference: input.transactionReference, reviewNote: null },
    uploadExt: input.uploadExt,
    receiptExt: input.receipt ? input.receiptExt : null,
  };
  await writePrivate(path.join(dir, "record.json"), sealBytes(Buffer.from(JSON.stringify(record))));
  await writePrivate(path.join(dir, `upload.${input.uploadExt}`), sealBytes(input.upload));
  if (input.receipt && input.receiptExt) {
    await writePrivate(path.join(dir, `receipt.${input.receiptExt}`), sealBytes(input.receipt));
  }
  console.info(`registration stored ${input.reference} students=${input.students.length} streams=${input.fee.studentStreamRegistrations}`);
  return record;
}

export async function readRegistration(reference: string): Promise<RegistrationRecord | null> {
  if (!referenceIsValid(reference)) return null;
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
  await writePrivate(path.join(regDir(reference), "record.json"), sealBytes(Buffer.from(JSON.stringify(record))));
  console.info(`payment status ${reference} ${status}`);
  return record;
}

export async function attachReceipt(reference: string, transactionReference: string, receipt: Buffer, receiptExt: NonNullable<RegistrationRecord["receiptExt"]>): Promise<RegistrationRecord | null> {
  const record = await readRegistration(reference);
  if (!record) return null;
  if (record.payment.status === "confirmed" || record.payment.status === "reported") return null;
  record.payment.status = "reported";
  record.payment.transactionReference = transactionReference;
  record.receiptExt = receiptExt;
  await writePrivate(path.join(regDir(reference), "record.json"), sealBytes(Buffer.from(JSON.stringify(record))));
  await writePrivate(path.join(regDir(reference), `receipt.${receiptExt}`), sealBytes(receipt));
  console.info(`payment reported ${reference}`);
  return record;
}

export async function listRegistrationsForStaff(): Promise<Array<PublicSummary & { coordinatorName: string; coordinatorEmail: string; createdAt: string }>> {
  const root = path.join(dataDir(), "registrations");
  let names: string[] = [];
  try {
    names = await readdir(root);
  } catch {
    return [];
  }
  const rows = [];
  for (const name of names) {
    if (!referenceIsValid(name)) continue;
    const record = await readRegistration(name);
    if (!record) continue;
    rows.push({
      ...toPublicSummary(record),
      coordinatorName: record.school.coordinatorName,
      coordinatorEmail: record.school.coordinatorEmail,
      createdAt: record.createdAt,
    });
  }
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return rows;
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
  const rows = await readIdem();
  const found = rows.find((row) => row.key === key);
  if (!found) return null;
  if (found.hash !== hash) return "conflict";
  return found.reference;
}

export async function storeIdempotency(key: string, reference: string, hash: string) {
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
