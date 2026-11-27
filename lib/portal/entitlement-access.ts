import {
  booksForLibrary,
  booksForStreamSyllabus,
  payableBookIdForStream,
  streamIdForBook,
  uniqueStreamIds,
  type PortalCatalog,
} from "@/lib/portal/model";
import type { StreamId } from "@/lib/registration/schema";

export type EntitlementStatusRow = {
  bookId: string;
  status: string;
};

/** Streams with any non-superseded entitlement, plus the primary registration stream. */
export function enrolledStreamIds(
  catalog: PortalCatalog,
  primaryStreamId: StreamId,
  entitlements: readonly EntitlementStatusRow[],
): StreamId[] {
  const fromRows: StreamId[] = [];
  for (const row of entitlements) {
    if (row.status === "superseded") continue;
    const streamId = streamIdForBook(catalog, row.bookId);
    if (streamId) fromRows.push(streamId);
  }
  return uniqueStreamIds([primaryStreamId, ...fromRows]);
}

/** Streams unlocked by a verified payment on that stream's payable book. */
export function paidStreamIds(
  catalog: PortalCatalog,
  classLevel: number,
  entitlements: readonly EntitlementStatusRow[],
): StreamId[] {
  const verifiedBooks = new Set(
    entitlements.filter((row) => row.status === "verified").map((row) => row.bookId),
  );
  const paid: StreamId[] = [];
  for (const streamId of uniqueStreamIds(["english", "mathematics", "technology"])) {
    const payableId = payableBookIdForStream(catalog, streamId, classLevel);
    if (payableId && verifiedBooks.has(payableId)) paid.push(streamId);
  }
  return paid;
}

/** True when the stream payable book is verified (covers Future Tech syllabus companions). */
export function isBookPaidByStreamEntitlement(
  catalog: PortalCatalog,
  classLevel: number,
  bookId: string,
  entitlements: readonly EntitlementStatusRow[],
): boolean {
  const streamId = streamIdForBook(catalog, bookId);
  if (!streamId) return false;
  const payableId = payableBookIdForStream(catalog, streamId, classLevel);
  if (!payableId) return false;
  if (!booksForStreamSyllabus(catalog, streamId, classLevel).some((book) => book.id === bookId)) {
    return false;
  }
  return entitlements.some((row) => row.bookId === payableId && row.status === "verified");
}

export function libraryBooks(
  catalog: PortalCatalog,
  primaryStreamId: StreamId,
  classLevel: number,
  entitlements: readonly EntitlementStatusRow[],
) {
  return booksForLibrary(catalog, enrolledStreamIds(catalog, primaryStreamId, entitlements), classLevel);
}

/** Payment reference for secondary books in a multi-stream transfer (unique DB reference). */
export function entitlementPaymentReference(baseReference: string, bookId: string, isPrimary: boolean): string {
  if (isPrimary) return baseReference;
  const combined = `${baseReference}/${bookId}`;
  return combined.length <= 80 ? combined : combined.slice(0, 80);
}
