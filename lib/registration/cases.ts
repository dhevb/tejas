import { chmod, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BookLine } from "@/lib/registration/book-order";
import { configured as remoteConfigured, insertCaseFile, listRemoteCaseSnapshots, readCaseFile, readPrivateProof, transactionSeenInCases, updateCaseFile } from "@/lib/registration/database";
import type { Charge } from "@/lib/registration/fee";
import { dataDir } from "@/lib/registration/paths";
import type { PaymentDecision } from "@/lib/registration/payment-decision";
import { referenceIsValid } from "@/lib/registration/reference";
import { openBytes, sealBytes } from "@/lib/registration/seal";
import type { PaymentStatus } from "@/lib/registration/store";

export type BookChannel = "school-book" | "individual-book";

export type CasePayment = {
  status: PaymentStatus;
  transactionReference: string | null;
  reviewNote: string | null;
  enteredUtr: string | null;
  extractedUtr: string | null;
  reviewReason: string | null;
  bankResult: string | null;
  receivingAccount: string | null;
  approvalMethod: "automatic" | "pending" | "staff" | null;
};

export type BookOrder = {
  kind: "book";
  reference: string;
  channel: BookChannel;
  createdAt: string;
  schoolName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  district: string;
  state: string;
  pin: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  studentName: string | null;
  parentName: string | null;
  classNumber: number | null;
  streamId: string | null;
  lines: BookLine[];
  pan: string | null;
  charge: Charge;
  payment: CasePayment;
  proofExt: "jpg" | "png" | "webp" | null;
};

function caseDir(reference: string) {
  if (!referenceIsValid(reference)) throw new Error("Invalid reference.");
  return path.join(dataDir(), "cases", reference);
}

async function writePrivate(file: string, bytes: Buffer) {
  await writeFile(file, bytes, { mode: 0o600 });
  await chmod(file, 0o600);
}

export function publicBookOrder(order: BookOrder) {
  return {
    reference: order.reference,
    channel: order.channel,
    schoolName: order.schoolName,
    total: order.charge.total,
    schoolShare: order.charge.schoolShare,
    payableToTejas: order.charge.payableToTejas,
    quantity: order.charge.units,
    panRequired: order.charge.panRequired,
    panProvided: Boolean(order.pan),
    paymentStatus: order.payment.status,
    lines: order.lines,
  };
}

export async function saveBookOrder(order: BookOrder, idempotency?: { key: string; hash: string }): Promise<void> {
  if (remoteConfigured()) {
    await insertCaseFile(order, idempotency);
    return;
  }
  if (process.env.VERCEL === "1") throw new Error("Order storage is not configured.");
  const dir = caseDir(order.reference);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writePrivate(path.join(dir, "order.json"), sealBytes(Buffer.from(JSON.stringify(order))));
}

export async function readBookOrder(reference: string): Promise<BookOrder | null> {
  if (!referenceIsValid(reference)) return null;
  if (remoteConfigured()) {
    const found = await readCaseFile(reference);
    return found?.kind === "book" ? found as BookOrder : null;
  }
  try {
    const bytes = openBytes(await readFile(path.join(caseDir(reference), "order.json")));
    const order = JSON.parse(bytes.toString("utf8")) as BookOrder;
    return order.kind === "book" && order.reference === reference ? order : null;
  } catch {
    return null;
  }
}

export async function listBookOrders(): Promise<BookOrder[] | null> {
  if (remoteConfigured()) {
    const snapshots = await listRemoteCaseSnapshots();
    if (!snapshots) return null;
    return snapshots.filter((item): item is BookOrder => item.kind === "book");
  }
  const root = path.join(dataDir(), "cases");
  let names: string[] = [];
  try {
    names = await readdir(root);
  } catch {
    return [];
  }
  const orders: BookOrder[] = [];
  for (const name of names) {
    const order = await readBookOrder(name);
    if (order) orders.push(order);
  }
  return orders;
}

export async function bookTransactionSeen(utr: string): Promise<boolean> {
  const needle = utr.replace(/\s+/g, "").toUpperCase();
  if (!needle) return false;
  if (remoteConfigured()) return transactionSeenInCases(needle);
  const orders = await listBookOrders();
  return (orders ?? []).some((order) => (order.payment.transactionReference ?? "").replace(/\s+/g, "").toUpperCase() === needle);
}

export async function readBookProof(reference: string): Promise<{ bytes: Buffer; filename: string; contentType: string } | null> {
  const order = await readBookOrder(reference);
  if (!order?.proofExt) return null;
  const types = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
  if (remoteConfigured()) {
    const bytes = await readPrivateProof(`${reference}/proof.${order.proofExt}`);
    return bytes ? { bytes, filename: `tejas-book-proof-${reference}.${order.proofExt}`, contentType: types[order.proofExt] } : null;
  }
  try {
    const bytes = openBytes(await readFile(path.join(caseDir(reference), `proof.${order.proofExt}`)));
    return { bytes, filename: `tejas-book-proof-${reference}.${order.proofExt}`, contentType: types[order.proofExt] };
  } catch {
    return null;
  }
}

export async function attachBookProof(reference: string, order: BookOrder, proof: Buffer, ext: NonNullable<BookOrder["proofExt"]>, decision: PaymentDecision, enteredUtr: string, extractedUtr: string | null): Promise<BookOrder | null> {
  if (order.payment.status === "confirmed" || order.payment.status === "reported") return null;
  order.proofExt = ext;
  order.payment.transactionReference = enteredUtr;
  order.payment.enteredUtr = enteredUtr;
  order.payment.extractedUtr = extractedUtr;
  order.payment.reviewReason = decision.outcome === "automatic" ? null : decision.reason;
  order.payment.bankResult = decision.bankResult;
  order.payment.receivingAccount = order.channel === "school-book" || order.channel === "individual-book" ? order.payment.receivingAccount : null;
  order.payment.approvalMethod = decision.approvalMethod;
  order.payment.status = decision.outcome === "automatic" ? "confirmed" : "reported";
  order.payment.reviewNote = decision.reason;
  if (remoteConfigured()) {
    await updateCaseFile(order, proof, ext);
    return order;
  }
  if (process.env.VERCEL === "1") throw new Error("Order storage is not configured.");
  await writePrivate(path.join(caseDir(reference), "order.json"), sealBytes(Buffer.from(JSON.stringify(order))));
  await writePrivate(path.join(caseDir(reference), `proof.${ext}`), sealBytes(proof));
  return order;
}
