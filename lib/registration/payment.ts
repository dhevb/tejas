import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { paymentProofsAccepted } from "@/lib/registration/durable";
import { dataDir } from "@/lib/registration/paths";

export type PaymentConfig = {
  activated: boolean;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  extraInstructions: string;
};

const EMPTY: PaymentConfig = {
  activated: false,
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  extraInstructions: "",
};

function configPath() {
  return path.join(dataDir(), "payment-config.json");
}

export async function readPaymentConfig(): Promise<PaymentConfig> {
  try {
    const raw = await readFile(configPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<PaymentConfig>;
    const config: PaymentConfig = {
      activated: parsed.activated === true,
      bankName: String(parsed.bankName ?? "").trim(),
      accountHolder: String(parsed.accountHolder ?? "").trim(),
      accountNumber: String(parsed.accountNumber ?? "").replace(/\s/g, ""),
      ifsc: String(parsed.ifsc ?? "").trim().toUpperCase(),
      upiId: String(parsed.upiId ?? "").trim(),
      extraInstructions: String(parsed.extraInstructions ?? "").trim().slice(0, 500),
    };
    return { ...config, activated: paymentProofsAccepted() };
  } catch {
    return { ...EMPTY, activated: paymentProofsAccepted() };
  }
}

export function paymentConfigErrors(config: PaymentConfig): string | null {
  if (!config.activated) return null;
  if (config.bankName.length < 2 || config.accountHolder.length < 2) return "Bank name and account holder are required.";
  if (!/^\d{9,18}$/.test(config.accountNumber) || /^0+$/.test(config.accountNumber)) return "Account number must be 9–18 digits and cannot be a placeholder.";
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(config.ifsc)) return "IFSC is not in the expected form.";
  if (config.upiId && !/^[\w.-]{2,}@[A-Za-z]{2,64}$/.test(config.upiId)) return "UPI ID is not in the expected form.";
  if (/example|dummy|test|xxxx|placeholder/i.test(`${config.accountNumber} ${config.upiId} ${config.accountHolder}`)) {
    return "Placeholder account details cannot be published.";
  }
  return null;
}

export async function writePaymentConfig(config: PaymentConfig): Promise<string | null> {
  const error = paymentConfigErrors(config);
  if (error) return error;
  const dir = dataDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(configPath(), JSON.stringify(config, null, 2), { mode: 0o600 });
  return null;
}
