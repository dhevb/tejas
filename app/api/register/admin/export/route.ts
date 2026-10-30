import { registrationsToCsv, type ReportKind } from "@/lib/registration/reports";
import { staffAuthorised } from "@/lib/registration/staff";
import { readRegistration } from "@/lib/registration/store";
import { referenceIsValid } from "@/lib/registration/reference";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { dataDir } from "@/lib/registration/paths";

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
  const revealPan = kind === "schools" && url.searchParams.get("revealPan") === "yes";
  const root = path.join(dataDir(), "registrations");
  let names: string[] = [];
  try {
    names = await readdir(root);
  } catch {
    names = [];
  }
  const records = [];
  for (const name of names) {
    if (!referenceIsValid(name)) continue;
    const record = await readRegistration(name);
    if (record) records.push(record);
  }
  const csv = registrationsToCsv(records, kind as ReportKind, revealPan);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tejas-${kind}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
