import { noStore } from "@/lib/registration/http";
import { publicPaymentView, readPaymentConfig } from "@/lib/registration/payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await readPaymentConfig();
  return noStore(publicPaymentView(config));
}
