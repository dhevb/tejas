import { readFile } from "node:fs/promises";
import { bookFilePath } from "@/lib/portal/catalog.server";
import { currentStudent } from "@/lib/portal/current";
import { accessFor } from "@/lib/portal/store";
import { noStore } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ bookId: string }> }) {
  const student = await currentStudent();
  if (!student) return noStore({ ok: false, error: "Sign in to continue." }, 401);
  const { bookId } = await context.params;
  const decision = await accessFor(student, bookId);
  if (!decision.ok) return noStore({ ok: false, error: "This e-book is not available for this account.", reason: decision.reason }, decision.reason === "unknown" ? 404 : 403);
  const bytes = await readFile(bookFilePath(decision.book));
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
