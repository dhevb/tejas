import { authorizePanReveal } from "@/lib/registration/pan-access";
import { registrationsToCsv, type ReportKind } from "@/lib/registration/reports";
import { staffAuthorised, staffSubject } from "@/lib/registration/staff";
import { listStoredRegistrations } from "@/lib/registration/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: ReportKind[] = ["schools", "students", "payments", "books", "ebooks"];

export async function GET(request: Request) {
  if (!(await staffAuthorised())) return Response.json({ ok: false }, { status: 401 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("report");
  if (!kind || !KINDS.includes(kind as ReportKind)) {
    return Response.json({ ok: false, error: "Choose a report." }, { status: 400 });
  }
  const revealDecision = authorizePanReveal({
    requested: kind === "schools" && url.searchParams.get("revealPan") === "yes",
    subject: await staffSubject(),
    surface: "schools-csv",
  });
  const records = await listStoredRegistrations();
  const csv = registrationsToCsv(records, kind as ReportKind, revealDecision.reveal);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tejas-${kind}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
