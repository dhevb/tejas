import { buildCompleteRegistrationWorkbook } from "@/lib/registration/complete-registration-workbook";
import { filterRegistrationsForExport } from "@/lib/registration/export-filters";
import { resolveOwnerExportOrigin } from "@/lib/registration/export-origin";
import { authorizePanReveal } from "@/lib/registration/pan-access";
import { registrationsToCsv, type ReportKind } from "@/lib/registration/reports";
import { registrationOwnerAuthorised, staffSubject } from "@/lib/registration/staff";
import {
  listStoredRegistrations,
  receiptExists,
  uploadExists,
  type PaymentStatus,
  type RegistrationRecord,
} from "@/lib/registration/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CSV_KINDS: ReportKind[] = ["schools", "students", "payments", "books", "ebooks"];
const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending_instructions",
  "awaiting_payment",
  "reported",
  "confirmed",
  "rejected",
  "refund_pending",
];

async function fileAvailabilityMap(
  records: RegistrationRecord[],
): Promise<Record<string, { uploadAvailable: boolean; receiptAvailable: boolean }>> {
  const entries = await Promise.all(
    records.map(async (record) => {
      const [uploadAvailable, receiptAvailable] = await Promise.all([
        uploadExists(record.reference),
        receiptExists(record.reference),
      ]);
      return [record.reference, { uploadAvailable, receiptAvailable }] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function GET(request: Request) {
  if (!(await registrationOwnerAuthorised())) return Response.json({ ok: false }, { status: 401 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("report");
  if (!kind) {
    return Response.json({ ok: false, error: "Choose a report." }, { status: 400 });
  }

  const statusParam = url.searchParams.get("status") ?? "";
  if (
    statusParam &&
    statusParam !== "all" &&
    statusParam !== "pending_group" &&
    !PAYMENT_STATUSES.includes(statusParam as PaymentStatus)
  ) {
    return Response.json({ ok: false, error: "Unknown payment status filter." }, { status: 400 });
  }

  const records = await listStoredRegistrations();

  if (kind === "complete") {
    const originResult = resolveOwnerExportOrigin(request);
    if (!originResult.ok) {
      return Response.json({ ok: false, error: originResult.error }, { status: 400 });
    }
    // Complete School Registration Excel: all registrations (including rejected/refund), not dashboard-filter scoped.
    const availability = await fileAvailabilityMap(records);
    const bytes = buildCompleteRegistrationWorkbook(records, {
      origin: originResult.origin,
      scopeLabel: `Scope: all ${records.length} registration record(s); not limited by dashboard State/District/status filters.`,
      fileAvailability: availability,
    });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="tejas-complete-school-registrations.xlsx"',
        "Cache-Control": "no-store",
        "X-TEJAS-Export-Count": String(records.length),
        "X-TEJAS-Export-Scope": "all-registrations",
        "X-TEJAS-Export-Origin-Source": originResult.source,
      },
    });
  }

  if (!CSV_KINDS.includes(kind as ReportKind)) {
    return Response.json({ ok: false, error: "Choose a report." }, { status: 400 });
  }

  const revealDecision = authorizePanReveal({
    requested: kind === "schools" && url.searchParams.get("revealPan") === "yes",
    subject: await staffSubject(),
    surface: "schools-csv",
  });
  const filtered = filterRegistrationsForExport(records, {
    state: url.searchParams.get("state") ?? undefined,
    district: url.searchParams.get("district") ?? undefined,
    status: statusParam || undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  const csv = registrationsToCsv(filtered, kind as ReportKind, revealDecision.reveal);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tejas-${kind}.csv"`,
      "Cache-Control": "no-store",
      "X-TEJAS-Export-Count": String(filtered.length),
      "X-TEJAS-Export-Scope": "dashboard-filters",
    },
  });
}
