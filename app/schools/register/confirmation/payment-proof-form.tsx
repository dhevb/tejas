"use client";

import { useState } from "react";

const MODES = ["UPI", "NEFT", "IMPS", "RTGS", "Bank Transfer", "Cheque", "Other"] as const;

export function PaymentProofForm({ reference, amountDue }: { reference: string; amountDue: number }) {
  const [mode, setMode] = useState<(typeof MODES)[number]>("UPI");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const body = new FormData(event.currentTarget);
    const response = await fetch(`/api/register/${reference}/payment`, { method: "POST", body });
    const payload = (await response.json()) as { ok?: boolean; formErrors?: string[]; registration?: { paymentLabel?: string } };
    setBusy(false);
    if (!response.ok || !payload.ok) {
      setMessage(payload.formErrors?.join(" ") || "The payment proof was not saved. The payment was not verified.");
      return;
    }
    setDone(true);
    setMessage(`${payload.registration?.paymentLabel ?? "Verification Pending"}. The file is private. It does not verify the payment.`);
  }

  if (done) return <p className="text-sm text-tejas-ink">{message}</p>;

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-bold text-tejas-ink">Upload payment proof</h2>
      <p className="text-sm text-tejas-muted">Reference {reference}. Amount due {amountDue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}. Use a JPG, PNG, or PDF of 5 MB or less. This does not mark the payment as verified.</p>
      <label className="block text-sm">
        <span className="font-medium">Payment mode</span>
        <select name="paymentMode" value={mode} onChange={(event) => setMode(event.target.value as (typeof MODES)[number])} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2">
          {MODES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium">Payment date</span>
        <input name="paymentDate" type="date" required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Amount paid</span>
        <input name="amountPaid" type="number" required defaultValue={amountDue} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Name of payer</span>
        <input name="payerName" required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">{mode === "Cheque" ? "Cheque number" : mode === "UPI" ? "UPI transaction reference" : "UTR or bank reference"}</span>
        <input name="transactionReference" required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Payment proof</span>
        <input name="receipt" type="file" required accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="mt-1 block w-full text-sm" />
      </label>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
      <button type="submit" disabled={busy} className="rounded-xl bg-tejas-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Uploading…" : "Submit payment proof"}
      </button>
    </form>
  );
}
