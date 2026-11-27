import { consolidatedRegistrationWorkbook } from "@/lib/registration/consolidated-workbook";
import { noStore } from "@/lib/registration/http";
import {
  isBrowserNavigationRequest,
  ownerFileAuthRequiredHtml,
  parseOwnerFileDownloadPath,
} from "@/lib/registration/owner-file-download";
import { authorizePanReveal } from "@/lib/registration/pan-access";
import { referenceIsValid } from "@/lib/registration/reference";
import { studentsToWorkbook } from "@/lib/registration/sheet";
import { registrationOwnerAuthorised, staffSubject } from "@/lib/registration/staff";
import { readReceipt, readRegistration, readUpload } from "@/lib/registration/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fileResponse(bytes: Buffer, filename: string, contentType: string) {
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function errorJson(status: number, error: string) {
  return noStore({ ok: false, error }, status);
}

function unauthorizedResponse(request: Request): Response {
  if (isBrowserNavigationRequest(request)) {
    const url = new URL(request.url);
    const downloadPath = parseOwnerFileDownloadPath(`${url.pathname}${url.search}`);
    const review = new URL("/schools/register/review", url.origin);
    if (downloadPath) review.searchParams.set("download", downloadPath);
    return new Response(ownerFileAuthRequiredHtml(review.pathname + review.search), {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  return errorJson(401, "owner_auth_required");
}

export async function GET(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!(await registrationOwnerAuthorised())) return unauthorizedResponse(request);
  const { reference } = await context.params;
  if (!referenceIsValid(reference)) return errorJson(404, "invalid_reference");
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const revealDecision = authorizePanReveal({
    requested: url.searchParams.get("revealPan") === "yes",
    subject: await staffSubject(),
    surface: "consolidated-xlsx",
    reference,
  });
  if (kind === "upload") {
    const file = await readUpload(reference);
    if (!file) return errorJson(404, "file_not_found");
    return fileResponse(file.bytes, file.filename, "application/octet-stream");
  }
  if (kind === "receipt") {
    const record = await readRegistration(reference);
    if (!record) return errorJson(404, "invalid_reference");
    if (!record.receiptExt) return errorJson(404, "payment_proof_not_stored");
    const file = await readReceipt(reference);
    if (!file) return errorJson(404, "file_not_found");
    return fileResponse(file.bytes, file.filename, file.contentType);
  }
  if (kind === "consolidated") {
    const record = await readRegistration(reference);
    if (!record) return errorJson(404, "invalid_reference");
    const bytes = consolidatedRegistrationWorkbook(record, { revealPan: revealDecision.reveal });
    return fileResponse(
      bytes,
      `tejas-registration-${reference}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  }
  const record = await readRegistration(reference);
  if (!record) return errorJson(404, "invalid_reference");
  const bytes = studentsToWorkbook(record.students);
  return fileResponse(bytes, `tejas-students-${reference}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
