import path from "node:path";
import { BOOK_PRICE, BOOK_SCHOOL_SHARE, BOOK_TEJAS } from "@/lib/registration/fee";
import { parseEmail, parseIndianMobile, validatePersonName } from "@/lib/registration/fields";
import { STREAMS, type StreamId } from "@/lib/registration/schema";
import { BOOK_CLASSES, classLabel, streamAllowed, streamLabel } from "@/lib/orders/catalogue";
import { bookReferenceIsValid, newOrderCode, payloadHash, readJson, writeJson, ordersRoot } from "@/lib/orders/files";

export { BOOK_CLASSES, classLabel, streamAllowed, streamLabel };

export type BookLine = {
  classNumber: number;
  stream: StreamId;
  quantity: number;
};

export type BookOrderInput = {
  schoolName: string;
  schoolAddress: string;
  schoolEmail: string;
  schoolMobile: string;
  coordinatorName: string;
  coordinatorDesignation: string;
  coordinatorMobile: string;
  coordinatorEmail: string;
  lines: BookLine[];
};

export type BookOrder = BookOrderInput & {
  reference: string;
  quantity: number;
  grossAmount: number;
  schoolShare: number;
  amountPayable: number;
  status: "recorded";
  paymentCollected: false;
  dispatched: false;
  createdAt: string;
};

export type BookErrors = Partial<Record<string, string>>;

function cleanLine(value: string, max: number): string {
  return value.normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function readField(source: FormData | Record<string, string>, key: string): string {
  if (source instanceof FormData) return String(source.get(key) ?? "");
  return source[key] ?? "";
}

export function priceLines(lines: BookLine[]): { quantity: number; grossAmount: number; schoolShare: number; amountPayable: number } {
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return {
    quantity,
    grossAmount: quantity * BOOK_PRICE,
    schoolShare: quantity * BOOK_SCHOOL_SHARE,
    amountPayable: quantity * BOOK_TEJAS,
  };
}

export function readBookOrder(source: FormData | Record<string, string>): { value: BookOrderInput | null; errors: BookErrors } {
  const errors: BookErrors = {};
  const schoolName = cleanLine(readField(source, "schoolName"), 200);
  const schoolAddress = cleanLine(readField(source, "schoolAddress"), 500);
  const schoolEmail = parseEmail(readField(source, "schoolEmail"));
  const schoolMobile = parseIndianMobile(readField(source, "schoolMobile"));
  const coordinatorRaw = cleanLine(readField(source, "coordinatorName"), 120);
  const coordinatorDesignation = cleanLine(readField(source, "coordinatorDesignation"), 80);
  const coordinatorMobile = parseIndianMobile(readField(source, "coordinatorMobile"));
  const coordinatorEmail = parseEmail(readField(source, "coordinatorEmail"));
  const coordinator = validatePersonName(coordinatorRaw, "Contact person's name");

  if (schoolName.length < 3 || !/\p{L}/u.test(schoolName)) errors.schoolName = "Enter the school name.";
  if (schoolAddress.length < 10) errors.schoolAddress = "Enter the school contact address.";
  if (!schoolEmail) errors.schoolEmail = "Enter the school email address.";
  if (!schoolMobile) errors.schoolMobile = "Enter the school's 10-digit contact mobile number.";
  if (!coordinator.ok) errors.coordinatorName = coordinator.message;
  if (coordinatorDesignation.length < 2) errors.coordinatorDesignation = "Enter the contact person's designation.";
  if (!coordinatorMobile) errors.coordinatorMobile = "Enter the contact person's 10-digit mobile number.";
  if (!coordinatorEmail) errors.coordinatorEmail = "Enter the contact person's email address.";

  const lines: BookLine[] = [];
  for (const classNumber of BOOK_CLASSES) {
    for (const stream of STREAMS) {
      const key = `qty_${classNumber}_${stream.id}`;
      const raw = readField(source, key).trim();
      if (!raw) continue;
      const quantity = Number(raw);
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 10000) {
        errors[key] = `Enter a whole number of books for ${classLabel(classNumber)}, ${streamLabel(stream.id)}.`;
        continue;
      }
      if (quantity === 0) continue;
      if (!streamAllowed(stream.id, classNumber)) {
        errors[key] = `${streamLabel(stream.id)} is not available for ${classLabel(classNumber)}.`;
        continue;
      }
      lines.push({ classNumber, stream: stream.id, quantity });
    }
  }
  if (!lines.length && !Object.keys(errors).some((key) => key.startsWith("qty_"))) {
    errors.lines = "Enter a quantity for at least one class and stream.";
  }

  if (Object.keys(errors).length || !coordinator.ok || !schoolEmail || !schoolMobile || !coordinatorMobile || !coordinatorEmail) {
    return { value: null, errors };
  }
  lines.sort((a, b) => a.classNumber - b.classNumber || a.stream.localeCompare(b.stream));
  return {
    value: {
      schoolName,
      schoolAddress,
      schoolEmail,
      schoolMobile,
      coordinatorName: coordinator.value,
      coordinatorDesignation,
      coordinatorMobile,
      coordinatorEmail,
      lines,
    },
    errors,
  };
}

type IdempotentRecord = { hash: string; reference: string };

function orderFile(reference: string): string {
  return path.join(ordersRoot(), "books", "orders", `${reference}.json`);
}

function idemFile(key: string): string {
  return path.join(ordersRoot(), "books", "idem", `${key}.json`);
}

export async function readPrintedBookOrder(reference: string): Promise<BookOrder | null> {
  if (!bookReferenceIsValid(reference)) return null;
  return readJson<BookOrder>(orderFile(reference));
}

export async function savePrintedBookOrder(input: BookOrderInput, idempotencyKey: string): Promise<{ order: BookOrder; created: boolean } | { conflict: true }> {
  const hash = payloadHash(input);
  const prior = await readJson<IdempotentRecord>(idemFile(idempotencyKey));
  if (prior) {
    if (prior.hash !== hash) return { conflict: true };
    const existing = await readPrintedBookOrder(prior.reference);
    if (existing) return { order: existing, created: false };
  }
  const priced = priceLines(input.lines);
  const order: BookOrder = {
    ...input,
    ...priced,
    reference: newOrderCode("TEJAS-BOOK"),
    status: "recorded",
    paymentCollected: false,
    dispatched: false,
    createdAt: new Date().toISOString(),
  };
  await writeJson(orderFile(order.reference), order);
  await writeJson(idemFile(idempotencyKey), { hash, reference: order.reference });
  return { order, created: true };
}
