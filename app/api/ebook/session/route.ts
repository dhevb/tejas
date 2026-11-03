import { classLabel, streamLabel } from "@/lib/orders/books";
import { cookieValue, EBOOK_COOKIE, ebookSessionReference, readEbookAccount } from "@/lib/orders/ebook";
import { noStore } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const reference = ebookSessionReference(cookieValue(request.headers.get("cookie"), EBOOK_COOKIE));
  if (!reference) return noStore({ ok: false }, 401);
  const account = await readEbookAccount(reference);
  if (!account || account.status !== "active") return noStore({ ok: false }, 401);
  return noStore({
    ok: true,
    classNumber: account.classNumber,
    classLabel: classLabel(account.classNumber),
    streams: account.streams.map((stream) => ({ id: stream, label: streamLabel(stream) })),
    fileSupplied: false,
  });
}
