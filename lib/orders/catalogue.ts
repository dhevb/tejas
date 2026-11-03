import { STREAMS, type StreamId } from "@/lib/registration/schema";

export const BOOK_CLASSES = [3, 4, 5, 6, 7, 8, 9, 10] as const;

const ROMAN = ["", "", "", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;

export function classLabel(classNumber: number): string {
  return `Class ${ROMAN[classNumber] ?? classNumber}`;
}

export function streamLabel(stream: StreamId): string {
  return STREAMS.find((item) => item.id === stream)?.name ?? stream;
}

export function streamAllowed(stream: StreamId, classNumber: number): boolean {
  const found = STREAMS.find((item) => item.id === stream);
  return Boolean(found && (found.classes as readonly number[]).includes(classNumber));
}
