import { currentStudent } from "@/lib/portal/current";
import { submitEbookProof } from "@/lib/portal/store";
import { noStore, rateLimit, sameOrigin, clientKey } from "@/lib/registration/http";
import { detectScreenshot } from "@/lib/registration/receipt";
import { MAX_RECEIPT_BYTES } from "@/lib/registration/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  if (!rateLimit(`ebook-proof:${clientKey(request)}`, 8, 60 * 60 * 1000)) return noStore({ ok: false, error: "Too many attempts. Wait and try again." }, 429);
  const student = await currentStudent();
  if (!student) return noStore({ ok: false, error: "Sign in to continue." }, 401);
  const form = await request.formData().catch(() => null);
  const reference = String(form?.get("transactionReference") ?? "");
  const file = form?.get("receipt");
  if (!reference.trim() || !(file instanceof File) || file.size === 0) {
    return noStore({ ok: false, error: "Please upload your payment screenshot and enter the UTR number. Both are mandatory for payment verification." }, 400);
  }
  if (file.size > MAX_RECEIPT_BYTES) return noStore({ ok: false, error: "The screenshot is larger than 5 MB." }, 413);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!detectScreenshot(bytes, file.name)) return noStore({ ok: false, error: "Upload the payment screenshot as a JPEG, PNG, or WebP image." }, 400);
  const result = await submitEbookProof(student.id, reference, bytes, file.name);
  return noStore(result, result.ok ? 200 : 400);
}
