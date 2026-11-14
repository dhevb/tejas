"use client";

import { useState } from "react";

const MODES = ["NEFT", "IMPS", "RTGS", "Bank Transfer", "Cheque", "Other"] as const;
const REQUEST_MS = 25_000;

const controlClass =
  "mt-1 w-full rounded-lg border border-tejas-border bg-white px-3 py-2 text-base text-tejas-ink shadow-sm focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30";

export function PaymentProofForm({ reference, amountDue }: { reference: string; amountDue: number }) {
  const [mode, setMode] = useState<(typeof MODES)[number]>("NEFT");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const body = new FormData(event.currentTarget);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_MS);
    try {
      const response = await fetch(`/api/register/${reference}/payment`, { method: "POST", body, signal: controller.signal });
      const text = await response.text();
      let payload: { ok?: boolean; formErrors?: string[]; registration?: { paymentLabel?: string } } | null = null;
      try {
        payload = text ? JSON.parse(text) as { ok?: boolean; formErrors?: string[]; registration?: { paymentLabel?: string } } : null;
      } catch {
        payload = null;
      }
      if (!response.ok || !payload?.ok) {
        setMessage(payload?.formErrors?.join(" ") || "The payment proof was not saved. The payment was not verified.");
        return;
      }
      setDone(true);
      setMessage(`${payload.registration?.paymentLabel ?? "Payment Submitted / Verification Pending"}. The file is private. It does not verify the payment.`);
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setMessage(timedOut
        ? "The upload timed out. It may still be processing. Wait, then try again with the same reference. A second proof is not accepted once one is on file."
        : "The payment proof could not be confirmed. Check the connection and try again. The payment was not marked as verified.");
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  if (done) return <p className="text-sm text-tejas-ink">{message}</p>;

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-tejas-border bg-white p-5 shadow-tejas">
      <h2 className="border-l-4 border-tejas-saffron pl-3 text-lg font-bold text-tejas-blue">Upload payment proof</h2>
      <p className="text-sm text-tejas-muted">Reference {reference}. Net amount payable to TEJAS {amountDue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}. The school retains its share and does not include that share in this transfer. Use a JPG, PNG, or PDF of 5 MB or less. This does not mark the payment as verified.</p>
      <label className="block text-sm">
        <span className="font-medium">Payment mode</span>
        <select name="paymentMode" value={mode} onChange={(event) => setMode(event.target.value as (typeof MODES)[number])} className={controlClass}>
          {MODES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium">Payment date</span>
        <input name="paymentDate" type="date" required className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Amount paid to TEJAS</span>
        <input name="amountPaid" type="number" required defaultValue={amountDue} className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Name of payer</span>
        <input name="payerName" required className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">{mode === "Cheque" ? "Cheque number" : "UTR or bank reference"}</span>
        <input name="transactionReference" required className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Payment proof</span>
        <input name="receipt" type="file" required accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="mt-1 block w-full text-sm text-tejas-ink file:mr-3 file:rounded-lg file:border-0 file:bg-tejas-saffron-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-tejas-saffron-dark" />
      </label>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
      <button type="submit" disabled={busy} className="rounded-xl bg-tejas-saffron px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-tejas-saffron-dark disabled:opacity-60">
        {busy ? "Uploading…" : "Submit payment proof"}
      </button>
    </form>
  );
}
