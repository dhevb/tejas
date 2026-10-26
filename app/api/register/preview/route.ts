import { clientKey, noStore, rateLimit, sameOrigin } from "@/lib/registration/http";
import { MAX_UPLOAD_BYTES } from "@/lib/registration/schema";
import { parseStudentSheet, previewStudents } from "@/lib/registration/sheet";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false, formErrors: ["Open this form on the TEJAS website and try again."] }, 403);
  if (!rateLimit(`preview:${clientKey(request)}`, 30, 60 * 60 * 1000)) {
    return noStore({ ok: false, formErrors: ["Too many sheet checks. Wait a while and try again."] }, 429);
  }
  const form = await request.formData();
  const schoolName = String(form.get("schoolName") ?? "");
  const file = form.get("file");
  if (!(file instanceof File)) return noStore({ ok: false, formErrors: ["Choose the student sheet."] }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return noStore({ ok: false, formErrors: ["The file is larger than 10 MB."] }, 413);
  const bytes = Buffer.from(await file.arrayBuffer());
  const parsed = parseStudentSheet(bytes, file.name, schoolName);
  return noStore({
    ok: parsed.formErrors.length === 0 && parsed.rowErrors.length === 0 && parsed.students.length > 0,
    formErrors: parsed.formErrors,
    rowErrors: parsed.rowErrors,
    students: previewStudents(parsed.students),
    fee: parsed.fee,
    provisional: parsed.provisional,
  });
}
