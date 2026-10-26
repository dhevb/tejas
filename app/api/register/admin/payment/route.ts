import { noStore } from "@/lib/registration/http";
import { paymentConfigErrors, readPaymentConfig, writePaymentConfig, type PaymentConfig } from "@/lib/registration/payment";
import { staffAuthorised } from "@/lib/registration/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await staffAuthorised())) return noStore({ ok: false }, 401);
  const config = await readPaymentConfig();
  return noStore({ ok: true, config });
}

export async function PUT(request: Request) {
  if (!(await staffAuthorised())) return noStore({ ok: false }, 401);
  const body = (await request.json().catch(() => null)) as Partial<PaymentConfig> | null;
  if (!body) return noStore({ ok: false, error: "The payment settings could not be read." }, 400);
  const config: PaymentConfig = {
    activated: body.activated === true,
    bankName: String(body.bankName ?? "").trim(),
    accountHolder: String(body.accountHolder ?? "").trim(),
    accountNumber: String(body.accountNumber ?? "").replace(/\s/g, ""),
    ifsc: String(body.ifsc ?? "").trim().toUpperCase(),
    upiId: String(body.upiId ?? "").trim(),
    extraInstructions: String(body.extraInstructions ?? "").trim().slice(0, 500),
  };
  const error = paymentConfigErrors(config) ?? (await writePaymentConfig(config));
  if (error) return noStore({ ok: false, error }, 400);
  return noStore({ ok: true, config });
}
