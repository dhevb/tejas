import { consolidatedRegistrationWorkbook } from "@/lib/registration/consolidated-workbook";
import { authorizePanReveal } from "@/lib/registration/pan-access";
import { referenceIsValid } from "@/lib/registration/reference";
import { studentsToWorkbook } from "@/lib/registration/sheet";
import { staffAuthorised, staffSubject } from "@/lib/registration/staff";
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

export async function GET(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!(await staffAuthorised())) return Response.json({ ok: false }, { status: 401 });
  const { reference } = await context.params;
  if (!referenceIsValid(reference)) return Response.json({ ok: false }, { status: 404 });
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
    if (!file) return Response.json({ ok: false }, { status: 404 });
    return fileResponse(file.bytes, file.filename, "application/octet-stream");
  }
  if (kind === "receipt") {
    const file = await readReceipt(reference);
    if (!file) return Response.json({ ok: false }, { status: 404 });
    return fileResponse(file.bytes, file.filename, file.contentType);
  }
  if (kind === "consolidated") {
    const record = await readRegistration(reference);
    if (!record) return Response.json({ ok: false }, { status: 404 });
    const bytes = consolidatedRegistrationWorkbook(record, { revealPan: revealDecision.reveal });
    return fileResponse(
      bytes,
      `tejas-registration-${reference}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  }
  const record = await readRegistration(reference);
  if (!record) return Response.json({ ok: false }, { status: 404 });
  const bytes = studentsToWorkbook(record.students);
  return fileResponse(bytes, `tejas-students-${reference}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
