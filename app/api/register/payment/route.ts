import { paymentProofsAccepted } from "@/lib/registration/durable";
import { noStore } from "@/lib/registration/http";
import { officialPublicPayment } from "@/lib/registration/official-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return noStore(officialPublicPayment(paymentProofsAccepted()));
}
