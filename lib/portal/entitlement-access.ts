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

/**
 * Reading access for a book under a verified stream payment.
 * Future Tech Book 1 is readable as a syllabus companion when Book 2 is paid (classes 9–10).
 */
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

/**
 * Mock-test access follows the purchased payable book only (five tests per stream).
 * Future Tech Book 1 companion reading does NOT unlock Book 1 mock tests for Book 2 purchasers.
 */
export function isMockTestPaidByStreamEntitlement(
  catalog: PortalCatalog,
  classLevel: number,
  bookId: string,
  entitlements: readonly EntitlementStatusRow[],
): boolean {
  const streamId = streamIdForBook(catalog, bookId);
  if (!streamId) return false;
  const payableId = payableBookIdForStream(catalog, streamId, classLevel);
  if (!payableId || payableId !== bookId) return false;
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
