"use client";

import { useMemo, useState } from "react";
import { BOOK_BANK } from "@/lib/registration/official-bank";
import { STREAMS } from "@/lib/registration/schema";

const field = "mt-1 w-full rounded-xl border border-tejas-border px-3 py-2 text-sm";

export function SchoolBookOrderForm() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<{ reference: string; total: number; schoolShare: number; payableToTejas: number; panRequired: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const totalBooks = useMemo(() => Object.values(quantities).reduce((sum, value) => sum + (Number.isInteger(value) ? value : 0), 0), [quantities]);
  const total = totalBooks * 170;
  const schoolShare = totalBooks * 34;
  const payable = totalBooks * 136;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/books/school", { method: "POST", body: new FormData(event.currentTarget) });
      const payload = await response.json() as { ok?: boolean; formErrors?: string[]; fieldErrors?: Record<string, string>; order?: { reference: string; total: number; schoolShare: number; payableToTejas: number; panRequired: boolean } };
      if (!response.ok || !payload.ok || !payload.order) {
        setMessage(payload.formErrors?.join(" ") || Object.values(payload.fieldErrors ?? {}).join(" ") || "The order was not saved.");
        return;
      }
      setOrder(payload.order);
    } catch {
      setMessage("The order could not be confirmed.");
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <div className="space-y-3 rounded-3xl border border-tejas-border bg-white p-6">
        <h2 className="text-xl font-bold text-tejas-blue">Book order {order.reference}</h2>
        <p>Total ₹{order.total.toLocaleString("en-IN")}. School share ₹{order.schoolShare.toLocaleString("en-IN")}. Payable to the book account ₹{order.payableToTejas.toLocaleString("en-IN")}.</p>
        <p>Pay {BOOK_BANK.accountHolder}, account {BOOK_BANK.accountNumber}, {BOOK_BANK.bankName}, {BOOK_BANK.branch}, IFSC {BOOK_BANK.ifsc}.</p>
        <p>Please upload your payment screenshot and enter the UTR number. Both are mandatory for payment verification.</p>
        <BookProof reference={order.reference} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-tejas-border bg-white p-6 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">School name<input name="schoolName" required className={field} /></label>
        <label className="text-sm font-medium">School phone<input name="phone" required className={field} /></label>
        <label className="text-sm font-medium sm:col-span-2">School email<input name="email" type="email" required className={field} /></label>
        <label className="text-sm font-medium sm:col-span-2">Complete delivery address<textarea name="deliveryAddress" required className={field} /></label>
        <label className="text-sm font-medium">District<input name="district" required className={field} /></label>
        <label className="text-sm font-medium">State<input name="state" required className={field} /></label>
        <label className="text-sm font-medium">PIN code<input name="pin" required className={field} /></label>
        <label className="text-sm font-medium">Contact person<input name="contactName" required className={field} /></label>
        <label className="text-sm font-medium">Contact mobile<input name="contactMobile" required className={field} /></label>
        <label className="text-sm font-medium">Contact email<input name="contactEmail" type="email" required className={field} /></label>
        <label className="text-sm font-medium sm:col-span-2">PAN, required only above ₹2,000<input name="pan" className={field} autoComplete="off" /></label>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="mb-2 text-left font-semibold">Stream-wise and class-wise quantities</caption>
          <thead><tr><th className="py-2 pr-3">Stream</th><th className="py-2 pr-3">Class</th><th className="py-2">Quantity</th></tr></thead>
          <tbody>
            {STREAMS.flatMap((stream) => stream.classes.map((classNumber) => (
              <tr key={`${stream.id}-${classNumber}`} className="border-t border-tejas-border">
                <td className="py-2 pr-3">{stream.name}</td>
                <td className="py-2 pr-3">{classNumber}</td>
                <td className="py-2">
                  <input
                    name={`qty-${stream.id}-${classNumber}`}
                    type="number"
                    min={0}
                    defaultValue={0}
                    aria-label={`${stream.name} class ${classNumber} quantity`}
                    className="w-24 rounded-lg border border-tejas-border px-2 py-1"
                    onChange={(event) => setQuantities((current) => ({ ...current, [`${stream.id}-${classNumber}`]: Number(event.target.value) }))}
                  />
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">Books {totalBooks}. Total ₹{total.toLocaleString("en-IN")}. School share ₹{schoolShare.toLocaleString("en-IN")}. Payable to TEJAS ₹{payable.toLocaleString("en-IN")}. {total > 2000 ? "PAN is required." : "PAN is not required at this total."}</p>
      <p className="text-sm text-tejas-muted">Pay the book amount to {BOOK_BANK.accountHolder}, Union Bank of India, account {BOOK_BANK.accountNumber}, {BOOK_BANK.branch}, IFSC {BOOK_BANK.ifsc}. Do not use the school registration account.</p>
      {message ? <p className="text-sm text-red-700" role="alert">{message}</p> : null}
      <button type="submit" disabled={busy} className="rounded-xl bg-tejas-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Place printed-book order"}</button>
    </form>
  );
}

export function IndividualBookOrderForm() {
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<{ reference: string; payableToTejas: number; panRequired: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const total = quantity > 0 ? quantity * 170 : 0;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/books/individual", { method: "POST", body: new FormData(event.currentTarget) });
      const payload = await response.json() as { ok?: boolean; formErrors?: string[]; fieldErrors?: Record<string, string>; order?: { reference: string; payableToTejas: number; panRequired: boolean } };
      if (!response.ok || !payload.ok || !payload.order) {
        setMessage(payload.formErrors?.join(" ") || Object.values(payload.fieldErrors ?? {}).join(" ") || "The order was not saved.");
        return;
      }
      setOrder(payload.order);
    } catch {
      setMessage("The order could not be confirmed.");
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <div className="space-y-3 rounded-3xl border border-tejas-border bg-white p-6">
        <h2 className="text-xl font-bold text-tejas-blue">Book order {order.reference}</h2>
        <p>Payable to the book account ₹{order.payableToTejas.toLocaleString("en-IN")}. There is no school share.</p>
        <p>Please upload your payment screenshot and enter the UTR number. Both are mandatory for payment verification.</p>
        <BookProof reference={order.reference} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-4 rounded-3xl border border-tejas-border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-tejas-blue">Individual printed book</h2>
      <p className="text-sm text-tejas-muted">₹170 per book. The full amount is payable. There is no school share.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Student name<input name="studentName" required className={field} /></label>
        <label className="text-sm font-medium">Parent name<input name="parentName" required className={field} /></label>
        <label className="text-sm font-medium">Mobile<input name="mobile" required className={field} /></label>
        <label className="text-sm font-medium">Email<input name="email" type="email" required className={field} /></label>
        <label className="text-sm font-medium">School name<input name="schoolName" required className={field} /></label>
        <label className="text-sm font-medium">Class<input name="className" required className={field} /></label>
        <label className="text-sm font-medium">Stream
          <select name="streamId" className={field} defaultValue="english">
            {STREAMS.map((stream) => <option key={stream.id} value={stream.id}>{stream.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Book quantity<input name="quantity" type="number" min={1} defaultValue={1} required className={field} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
        <label className="text-sm font-medium sm:col-span-2">Complete delivery address<textarea name="deliveryAddress" required className={field} /></label>
        <label className="text-sm font-medium">District<input name="district" required className={field} /></label>
        <label className="text-sm font-medium">State<input name="state" required className={field} /></label>
        <label className="text-sm font-medium">PIN code<input name="pin" required className={field} /></label>
        <label className="text-sm font-medium">PAN, required only above ₹2,000<input name="pan" className={field} autoComplete="off" /></label>
      </div>
      <p className="text-sm">Total ₹{total.toLocaleString("en-IN")}. {total > 2000 ? "PAN is required." : "PAN is not required at this total."}</p>
      {message ? <p className="text-sm text-red-700" role="alert">{message}</p> : null}
      <button type="submit" disabled={busy} className="rounded-xl bg-tejas-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Place individual book order"}</button>
    </form>
  );
}

function BookProof({ reference }: { reference: string }) {
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/books/${reference}/payment`, { method: "POST", body: new FormData(event.currentTarget) });
    const payload = await response.json() as { ok?: boolean; formErrors?: string[]; verified?: boolean };
    setMessage(payload.ok ? (payload.verified ? "Payment verified." : "Proof received. It is pending staff verification and is not marked paid.") : payload.formErrors?.join(" ") || "The proof was not accepted.");
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm font-semibold">Please upload your payment screenshot and enter the UTR number. Both are mandatory for payment verification.</p>
      <label className="block text-sm">Payment mode<select name="paymentMode" className={field} defaultValue="NEFT"><option>NEFT</option><option>IMPS</option><option>RTGS</option><option>Bank Transfer</option></select></label>
      <label className="block text-sm">Payment date<input name="paymentDate" type="date" required className={field} /></label>
      <label className="block text-sm">Amount paid<input name="amountPaid" type="number" required className={field} /></label>
      <label className="block text-sm">Payer name<input name="payerName" required className={field} /></label>
      <label className="block text-sm">UTR<input name="transactionReference" required className={field} /></label>
      <label className="block text-sm">Payment screenshot<input name="receipt" type="file" required accept="image/jpeg,image/png,image/webp" className={field} /></label>
      {message ? <p className="text-sm">{message}</p> : null}
      <button className="rounded-xl bg-tejas-saffron px-4 py-2 text-sm font-semibold text-white">Submit payment proof</button>
    </form>
  );
}
