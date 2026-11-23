import { currentStudent } from "@/lib/portal/current";
import { noStore, sameOrigin } from "@/lib/registration/http";
import { detectReceipt } from "@/lib/registration/receipt";
import { MAX_RECEIPT_BYTES } from "@/lib/registration/schema";
import { reportPaymentWithScreenshot } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, error: "Open this form on the TEJAS website." }, 403);
  const student = await currentStudent();
  if (!student) return noStore({ ok: false, error: "Sign in to continue." }, 401);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return noStore({ ok: false, error: "Upload the payment screenshot and enter the UTR together." }, 400);
  }

  const form = await request.formData();
  const reference = String(form.get("transactionReference") ?? "");
  const receiptFile = form.get("receipt");
  if (!(receiptFile instanceof File)) {
    return noStore({ ok: false, error: "Upload a JPG or PNG payment screenshot. Both the screenshot and the UTR are required." }, 400);
  }
  if (receiptFile.size > MAX_RECEIPT_BYTES) {
    return noStore({ ok: false, error: "The receipt is larger than 5 MB." }, 413);
  }
  const bytes = Buffer.from(await receiptFile.arrayBuffer());
  const ext = detectReceipt(bytes, receiptFile.name);
  if (!ext || ext === "pdf") {
    return noStore({ ok: false, error: "Upload the receipt as a JPG or PNG screenshot." }, 400);
  }

  const result = await reportPaymentWithScreenshot(student.id, reference, bytes, ext);
  if (!result.ok) return noStore(result, 400);
  return noStore({
    ok: true,
    outcome: result.outcome,
    approvalMethod: result.approvalMethod,
    reason: result.reason,
    verificationLabel: result.verificationLabel,
    amountDue: result.amountDue,
  });
}
