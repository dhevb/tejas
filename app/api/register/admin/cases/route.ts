import { listBookOrders } from "@/lib/registration/cases";
import { noStore } from "@/lib/registration/http";
import { maskPan } from "@/lib/registration/fields";
import { staffRequestAuthorised } from "@/lib/registration/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await staffRequestAuthorised(request))) return noStore({ ok: false, error: "Staff sign-in is required." }, 401);
  const orders = await listBookOrders();
  if (!orders) return noStore({ ok: false, error: "Hosted book orders could not be listed." }, 503);
  return noStore({
    ok: true,
    orders: orders.map((order) => ({
      reference: order.reference,
      category: order.channel === "school-book" ? "School printed book payment" : "Individual printed book payment",
      schoolName: order.schoolName,
      payer: order.contactName,
      expectedAmount: order.charge.payableToTejas,
      total: order.charge.total,
      schoolShare: order.charge.schoolShare,
      lines: order.lines,
      enteredUtr: order.payment.enteredUtr,
      extractedUtr: order.payment.extractedUtr,
      bankResult: order.payment.bankResult,
      receivingAccount: order.payment.receivingAccount,
      approvalMethod: order.payment.approvalMethod,
      paymentStatus: order.payment.status,
      reviewReason: order.payment.reviewReason,
      panStatus: order.charge.panRequired ? (order.pan ? "Provided" : "Required") : "Not required",
      maskedPan: order.pan ? maskPan(order.pan) : "",
      proof: Boolean(order.proofExt),
    })),
  });
}
