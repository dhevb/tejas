import { readFile } from "node:fs/promises";
import { bookFilePath } from "@/lib/portal/catalog.server";
import { accessFor, type PortalStudent } from "@/lib/portal/store";
import { noStore, sameOrigin } from "@/lib/registration/http";

/** A page navigation or iframe would open the browser's own PDF viewer. The in-app reader uses fetch. */
export function readerFetch(request: Request): boolean {
  if (request.headers.get("sec-fetch-dest") !== "empty") return false;
  if (request.headers.get("sec-fetch-mode") !== "cors") return false;
  return sameOrigin(request);
}

export async function bookFileResponse(request: Request, student: PortalStudent | null, bookId: string): Promise<Response> {
  if (!student) return noStore({ ok: false, error: "Sign in to continue." }, 401);
  if (!readerFetch(request)) return noStore({ ok: false, error: "Open this e-book in the TEJAS reader." }, 403);
  const decision = await accessFor(student, bookId);
  if (!decision.ok) {
    return noStore(
      { ok: false, error: "This e-book is not available for this account.", reason: decision.reason },
      decision.reason === "unknown" ? 404 : 403,
    );
  }
  const bytes = await readFile(bookFilePath(decision.book));
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
