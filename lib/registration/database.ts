import { durableStorageConfigured, serverKeyValue, supabaseOrigin } from "@/lib/registration/durable";
import { streamById } from "@/lib/registration/schema";
import type { RegistrationRecord } from "@/lib/registration/store";

const SHEET_TYPES = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
} as const;

const RECEIPT_TYPES = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

type Created = {
  reference?: string;
  schoolId?: string;
  registrationId?: string;
  studentIds: string[];
  paymentId?: string;
  uploadPath?: string;
  receiptPath?: string;
};

export function configured(): boolean {
  return durableStorageConfigured();
}

function originOrThrow(): string {
  const origin = supabaseOrigin();
  if (!origin) throw new Error("Database request failed (missing)");
  return origin;
}

function authHeaders(): Headers {
  const key = serverKeyValue();
  if (!key) throw new Error("Database request failed (missing)");
  const headers = new Headers();
  headers.set("apikey", key);
  headers.set("authorization", `Bearer ${key}`);
  headers.set("accept", "application/json");
  return headers;
}

async function request(path: string, init: RequestInit): Promise<{ status: number; json: unknown; bytes: Buffer | null }> {
  const headers = authHeaders();
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(`${originOrThrow()}${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (init.method === "GET" && response.headers.get("content-type")?.includes("application/json") === false && response.ok) {
    const bytes = Buffer.from(await response.arrayBuffer());
    return { status: response.status, json: null, bytes };
  }
  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
  }
  return { status: response.status, json, bytes: null };
}

function assertOk(status: number, allowed: number[]) {
  if (!allowed.includes(status)) throw new Error(`Database request failed (${status})`);
}

function rows(json: unknown): Record<string, unknown>[] {
  if (!Array.isArray(json)) throw new Error("Database request failed (shape)");
  return json.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

function requiredId(json: unknown): string {
  const id = rows(json)[0]?.id;
  if (typeof id !== "string" || !id) throw new Error("Database request failed (shape)");
  return id;
}

function isoDate(dob: string): string {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dob);
  if (!match) throw new Error("Database request failed (date)");
  return `${match[3]}-${match[2]}-${match[1]}`;
}

async function insert(table: string, body: unknown, prefer = "return=representation"): Promise<unknown> {
  const result = await request(`/rest/v1/${table}`, {
    method: "POST",
    headers: { "content-type": "application/json", prefer },
    body: JSON.stringify(body),
  });
  assertOk(result.status, [200, 201]);
  return result.json;
}

async function patch(table: string, filter: string, body: unknown) {
  const result = await request(`/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  assertOk(result.status, [200, 204]);
}

async function remove(table: string, filter: string) {
  const result = await request(`/rest/v1/${table}?${filter}`, { method: "DELETE", headers: { prefer: "return=minimal" } });
  assertOk(result.status, [200, 204]);
}

function quote(value: string): string {
  return encodeURIComponent(value);
}

async function uploadObject(bucket: string, objectPath: string, bytes: Buffer, contentType: string) {
  const result = await request(`/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: { "content-type": contentType, "x-upsert": "true", "cache-control": "no-store" },
    body: new Blob([Uint8Array.from(bytes)]),
  });
  assertOk(result.status, [200, 201]);
}

async function deleteObject(bucket: string, objectPath: string) {
  const result = await request(`/storage/v1/object/${bucket}/${objectPath}`, { method: "DELETE" });
  if (![200, 204, 404].includes(result.status)) throw new Error(`Database request failed (${result.status})`);
}

async function downloadObject(bucket: string, objectPath: string): Promise<Buffer | null> {
  const headers = authHeaders();
  const response = await fetch(`${originOrThrow()}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "GET",
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (response.status === 404) {
    await response.body?.cancel();
    return null;
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Database request failed (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function compensate(created: Created) {
  const failures: string[] = [];
  const step = async (label: string, action: () => Promise<void>) => {
    try {
      await action();
    } catch {
      failures.push(label);
    }
  };
  if (created.reference) {
    await step("idempotency", () => remove("tejas_idempotency", `reference=eq.${quote(created.reference ?? "")}`));
  }
  if (created.paymentId) await step("proof", () => remove("tejas_payment_proofs", `payment_id=eq.${quote(created.paymentId ?? "")}`));
  if (created.registrationId) {
    const id = quote(created.registrationId);
    await step("files", () => remove("tejas_registration_files", `registration_id=eq.${id}`));
    await step("payments", () => remove("tejas_payments", `registration_id=eq.${id}`));
    await step("books", () => remove("tejas_book_orders", `registration_id=eq.${id}`));
    await step("ebooks", () => remove("tejas_ebook_access", `registration_id=eq.${id}`));
    await step("audit", () => remove("tejas_audit_logs", `registration_id=eq.${id}`));
    if (created.studentIds.length) {
      const list = created.studentIds.map(quote).join(",");
      await step("streams", () => remove("tejas_registration_streams", `student_id=in.(${list})`));
    }
    await step("students", () => remove("tejas_students", `registration_id=eq.${id}`));
    await step("registration", () => remove("tejas_registrations", `id=eq.${id}`));
  }
  if (created.schoolId) {
    const school = quote(created.schoolId);
    await step("coordinator", () => remove("tejas_coordinators", `school_id=eq.${school}`));
    await step("principal", () => remove("tejas_principals", `school_id=eq.${school}`));
    await step("school", () => remove("tejas_schools", `id=eq.${school}`));
  }
  if (created.uploadPath) await step("upload", () => deleteObject("tejas-registration-files", created.uploadPath ?? ""));
  if (created.receiptPath) await step("receipt", () => deleteObject("tejas-payment-proofs", created.receiptPath ?? ""));
  if (failures.length) console.error(`registration compensation incomplete: ${failures.join(",")}`);
}

function asRecord(value: unknown): RegistrationRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as RegistrationRecord;
  if (typeof record.reference !== "string" || !record.school || !Array.isArray(record.students) || !record.fee || !record.payment) return null;
  return record;
}

export async function readRegistration(reference: string): Promise<RegistrationRecord | null> {
  const result = await request(`/rest/v1/tejas_registrations?reference=eq.${quote(reference)}&select=record_snapshot`, { method: "GET" });
  assertOk(result.status, [200]);
  const snapshot = rows(result.json)[0]?.record_snapshot;
  const record = asRecord(snapshot);
  if (!record || record.reference !== reference) return null;
  return record;
}

export async function listRegistrations(): Promise<RegistrationRecord[]> {
  const result = await request("/rest/v1/tejas_registrations?select=reference,record_snapshot&order=created_at.desc&limit=2000", { method: "GET" });
  assertOk(result.status, [200]);
  const records: RegistrationRecord[] = [];
  for (const row of rows(result.json)) {
    const record = asRecord(row.record_snapshot);
    if (record && record.reference === row.reference) records.push(record);
  }
  return records;
}

export async function panSeen(pan: string): Promise<boolean> {
  const result = await request(`/rest/v1/tejas_schools?pan=eq.${quote(pan)}&select=id&limit=1`, { method: "GET" });
  assertOk(result.status, [200]);
  return rows(result.json).length > 0;
}

export async function transactionSeen(reference: string): Promise<boolean> {
  const result = await request(`/rest/v1/tejas_payments?transaction_reference=ilike.${quote(reference)}&select=id&limit=1`, { method: "GET" });
  assertOk(result.status, [200]);
  return rows(result.json).length > 0;
}

export async function findIdempotent(key: string, hash: string): Promise<string | "conflict" | null> {
  const result = await request(`/rest/v1/tejas_idempotency?idempotency_key=eq.${quote(key)}&select=payload_hash,reference`, { method: "GET" });
  assertOk(result.status, [200]);
  const row = rows(result.json)[0];
  if (!row) return null;
  if (row.payload_hash !== hash) return "conflict";
  return typeof row.reference === "string" ? row.reference : null;
}

export async function storeIdempotency(key: string, reference: string, hash: string) {
  const result = await request("/rest/v1/tejas_idempotency?on_conflict=idempotency_key", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ idempotency_key: key, payload_hash: hash, reference }),
  });
  assertOk(result.status, [200, 201]);
}

async function registrationId(reference: string): Promise<string | null> {
  const result = await request(`/rest/v1/tejas_registrations?reference=eq.${quote(reference)}&select=id`, { method: "GET" });
  assertOk(result.status, [200]);
  const id = rows(result.json)[0]?.id;
  return typeof id === "string" ? id : null;
}

export async function updatePayment(reference: string, record: RegistrationRecord) {
  const id = await registrationId(reference);
  if (!id) return;
  await patch("tejas_registrations", `reference=eq.${quote(reference)}`, { status: record.payment.status, record_snapshot: record });
  await patch("tejas_payments", `registration_id=eq.${quote(id)}`, {
    status: record.payment.status,
    review_note: record.payment.reviewNote,
    history: record.payment.history ?? [],
    mode: record.payment.mode ?? null,
    paid_on: record.payment.paidOn ?? null,
    payer_name: record.payment.payerName ?? null,
    transaction_reference: record.payment.transactionReference,
  });
  await insert("tejas_audit_logs", { registration_id: id, actor: "staff", action_name: "payment_status", note: record.payment.status }, "return=minimal");
}

export async function readUpload(reference: string, ext: RegistrationRecord["uploadExt"]): Promise<Buffer | null> {
  return downloadObject("tejas-registration-files", `${reference}/upload.${ext}`);
}

export async function readReceipt(reference: string, ext: NonNullable<RegistrationRecord["receiptExt"]>): Promise<Buffer | null> {
  return downloadObject("tejas-payment-proofs", `${reference}/receipt.${ext}`);
}

export async function insertRegistration(record: RegistrationRecord, files: {
  upload: Buffer;
  receipt: Buffer | null;
}, idempotency?: { key: string; hash: string }): Promise<void> {
  const created: Created = { reference: record.reference, studentIds: [] };
  try {
    const school = record.school;
    const schoolJson = await insert("tejas_schools", {
      school_name: school.schoolName,
      school_address: school.schoolAddress,
      state_name: school.state,
      district: school.district,
      city: school.city,
      pin_code: school.pin,
      pan: school.pan,
      pan_duplicate: school.panDuplicate,
      school_email: school.schoolEmail,
      school_mobile: school.schoolMobile,
      affiliation_board: school.affiliationBoard,
      affiliation_number: school.affiliationNumber,
      school_category: school.schoolCategory,
      previous_participation: school.previousParticipation,
      previous_reference: school.previousReference,
      representative_name: school.representativeName,
      representative_designation: school.representativeDesignation,
    });
    created.schoolId = requiredId(schoolJson);
    await insert("tejas_principals", {
      school_id: created.schoolId,
      full_name: school.principalName,
      mobile: school.principalMobile,
      email: school.principalEmail,
      designation: school.principalDesignation,
    }, "return=minimal");
    await insert("tejas_coordinators", {
      school_id: created.schoolId,
      full_name: school.coordinatorName,
      mobile: school.coordinatorMobile,
      email: school.coordinatorEmail,
      designation: school.coordinatorDesignation,
    }, "return=minimal");
    const registrationJson = await insert("tejas_registrations", {
      school_id: created.schoolId,
      reference: record.reference,
      status: record.payment.status,
      record_snapshot: record,
    });
    created.registrationId = requiredId(registrationJson);
    for (const student of record.students) {
      const studentJson = await insert("tejas_students", {
        registration_id: created.registrationId,
        full_name: student.fullName,
        class_label: student.classLabel,
        section_name: student.section,
        roll_number: student.rollNumber,
        date_of_birth: isoDate(student.dateOfBirth),
        parent_name: student.parentName,
        parent_mobile: student.parentMobile,
        parent_email: student.parentEmail,
      });
      const studentId = requiredId(studentJson);
      created.studentIds.push(studentId);
      if (student.streams.length) {
        await insert("tejas_registration_streams", student.streams.map((id) => ({ student_id: studentId, stream_name: streamById(id).name })), "return=minimal");
      }
    }
    const paymentJson = await insert("tejas_payments", {
      registration_id: created.registrationId,
      status: record.payment.status,
      mode: record.payment.mode ?? null,
      paid_on: record.payment.paidOn ?? null,
      payer_name: record.payment.payerName ?? null,
      transaction_reference: record.payment.transactionReference,
      amount_due: record.fee.amountDue,
      review_note: record.payment.reviewNote,
      history: record.payment.history ?? [],
    });
    created.paymentId = requiredId(paymentJson);
    await insert("tejas_book_orders", {
      registration_id: created.registrationId,
      quantity: record.fee.printedBooks,
      amount: record.fee.printedBookAmount,
    }, "return=minimal");
    await insert("tejas_ebook_access", {
      registration_id: created.registrationId,
      student_count: record.fee.ebookAccess,
      amount: record.fee.ebookAmount,
      activated: false,
    }, "return=minimal");
    const uploadPath = `${record.reference}/upload.${record.uploadExt}`;
    await uploadObject("tejas-registration-files", uploadPath, files.upload, SHEET_TYPES[record.uploadExt]);
    created.uploadPath = uploadPath;
    await insert("tejas_registration_files", {
      registration_id: created.registrationId,
      storage_path: uploadPath,
      content_type: SHEET_TYPES[record.uploadExt],
      byte_size: files.upload.length,
    }, "return=minimal");
    if (files.receipt && record.receiptExt) {
      const receiptPath = `${record.reference}/receipt.${record.receiptExt}`;
      await uploadObject("tejas-payment-proofs", receiptPath, files.receipt, RECEIPT_TYPES[record.receiptExt]);
      created.receiptPath = receiptPath;
      await insert("tejas_payment_proofs", {
        payment_id: created.paymentId,
        storage_path: receiptPath,
        content_type: RECEIPT_TYPES[record.receiptExt],
      }, "return=minimal");
    }
    await insert("tejas_audit_logs", {
      registration_id: created.registrationId,
      actor: "school",
      action_name: "registration_submitted",
      note: record.payment.status,
    }, "return=minimal");
    if (idempotency) await storeIdempotency(idempotency.key, record.reference, idempotency.hash);
  } catch (error) {
    await compensate(created);
    if (error instanceof Error && error.message.startsWith("Database request failed")) throw error;
    throw new Error("Database request failed");
  }
}

export async function attachReceipt(reference: string, record: RegistrationRecord, receipt: Buffer) {
  if (!record.receiptExt) throw new Error("Database request failed (receipt)");
  const id = await registrationId(reference);
  if (!id) throw new Error("Database request failed (missing)");
  const payment = await request(`/rest/v1/tejas_payments?registration_id=eq.${quote(id)}&select=id`, { method: "GET" });
  assertOk(payment.status, [200]);
  const paymentId = rows(payment.json)[0]?.id;
  if (typeof paymentId !== "string") throw new Error("Database request failed (shape)");
  const receiptPath = `${reference}/receipt.${record.receiptExt}`;
  await uploadObject("tejas-payment-proofs", receiptPath, receipt, RECEIPT_TYPES[record.receiptExt]);
  try {
    await updatePayment(reference, record);
    await insert("tejas_payment_proofs", {
      payment_id: paymentId,
      storage_path: receiptPath,
      content_type: RECEIPT_TYPES[record.receiptExt],
    }, "return=minimal");
  } catch (error) {
    await deleteObject("tejas-payment-proofs", receiptPath).catch(() => undefined);
    throw error;
  }
}
