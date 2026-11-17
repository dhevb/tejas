import { readBookProof } from "@/lib/registration/cases";
import { configured as remoteConfigured, readPrivateProof, recordStaffProofView } from "@/lib/registration/database";
import { noStore } from "@/lib/registration/http";
import { readEbookProof } from "@/lib/portal/store";
import { referenceIsValid } from "@/lib/registration/reference";
import { staffIdentity, staffRequestAuthorised } from "@/lib/registration/staff";
import { readReceipt, readRegistration } from "@/lib/registration/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function imageResponse(bytes: Buffer, filename: string, contentType: string) {
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  if (!(await staffRequestAuthorised(request))) return noStore({ ok: false, error: "Staff sign-in is required." }, 401);
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const reference = url.searchParams.get("reference") ?? "";
  const studentId = url.searchParams.get("studentId") ?? "";
  const bookId = url.searchParams.get("bookId") ?? "";
  const actor = (await staffIdentity()) ?? "staff";
  if (kind === "registration") {
    if (!referenceIsValid(reference)) return noStore({ ok: false }, 404);
    const record = await readRegistration(reference);
    if (!record?.receiptExt || record.receiptExt === "pdf") return noStore({ ok: false }, 404);
    const ext = record.receiptExt;
    const types = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
    const hostedIndividual = record.channel === "individual" && remoteConfigured();
    const file = hostedIndividual
      ? await readPrivateProof(`${reference}/proof.${ext}`).then((bytes) => bytes ? { bytes, filename: `tejas-receipt-${reference}.${ext}`, contentType: types[ext] } : null)
      : await readReceipt(reference);
    if (!file || file.contentType === "application/pdf") return noStore({ ok: false }, 404);
    await recordStaffProofView(actor, `registration ${reference}`);
    return imageResponse(file.bytes, file.filename, file.contentType);
  }
  if (kind === "book") {
    if (!referenceIsValid(reference)) return noStore({ ok: false }, 404);
    const file = await readBookProof(reference);
    if (!file) return noStore({ ok: false }, 404);
    await recordStaffProofView(actor, `book ${reference}`);
    return imageResponse(file.bytes, file.filename, file.contentType);
  }
  if (kind === "ebook") {
    const file = await readEbookProof(studentId, bookId);
    if (!file) return noStore({ ok: false }, 404);
    await recordStaffProofView(actor, `ebook ${studentId} ${bookId}`);
    return imageResponse(file.bytes, file.filename, file.contentType);
  }
  return noStore({ ok: false }, 404);
}
