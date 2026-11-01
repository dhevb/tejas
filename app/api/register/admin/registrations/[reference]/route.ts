import { noStore } from "@/lib/registration/http";
import { referenceIsValid } from "@/lib/registration/reference";
import { streamById } from "@/lib/registration/schema";
import { staffAuthorised } from "@/lib/registration/staff";
import { readRegistration, statusLabel, updatePayment, type PaymentStatus } from "@/lib/registration/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: PaymentStatus[] = ["pending_instructions", "awaiting_payment", "reported", "confirmed", "rejected", "refund_pending"];

export async function GET(_request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!(await staffAuthorised())) return noStore({ ok: false }, 401);
  const { reference } = await context.params;
  if (!referenceIsValid(reference)) return noStore({ ok: false }, 404);
  const record = await readRegistration(reference);
  if (!record) return noStore({ ok: false }, 404);
  return noStore({
    ok: true,
    registration: {
      ...record,
      school: {
        ...record.school,
        principalDesignation: undefined,
        representativeName: undefined,
        representativeDesignation: undefined,
      },
      students: record.students.map((student) => ({
        ...student,
        streams: student.streams.map((id) => streamById(id).name),
      })),
      paymentLabel: statusLabel(record.payment.status),
    },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!(await staffAuthorised())) return noStore({ ok: false }, 401);
  const { reference } = await context.params;
  if (!referenceIsValid(reference)) return noStore({ ok: false }, 404);
  const body = (await request.json().catch(() => null)) as { status?: PaymentStatus; note?: string } | null;
  if (!body?.status || !STATUSES.includes(body.status)) return noStore({ ok: false, error: "Choose a payment status." }, 400);
  const note = String(body.note ?? "").trim().slice(0, 300);
  if ((body.status === "rejected" || body.status === "refund_pending") && note.length < 5) {
    return noStore({ ok: false, error: "Enter the reason for this decision." }, 400);
  }
  try {
    const updated = await updatePayment(reference, body.status, note || null);
    if (!updated) return noStore({ ok: false }, 404);
    console.info(`staff payment update ${reference} ${body.status}`);
    return noStore({ ok: true, status: updated.payment.status });
  } catch {
    console.error("payment update failed");
    return noStore({ ok: false, error: "The payment status could not be saved." }, 503);
  }
}
