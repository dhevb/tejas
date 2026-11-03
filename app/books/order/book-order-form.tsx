"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BOOK_PRICE, BOOK_SCHOOL_SHARE, BOOK_TEJAS } from "@/lib/registration/fee";
import { BOOK_CLASSES, classLabel, streamAllowed, streamLabel } from "@/lib/orders/catalogue";
import { STREAMS } from "@/lib/registration/schema";

const controlClass =
  "mt-1.5 w-full rounded-xl border border-tejas-border bg-white px-3 py-2.5 text-base text-tejas-ink shadow-sm focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function Field({ label, name, type = "text", error, hint }: { label: string; name: string; type?: string; error?: string; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-tejas-ink">{label} <span className="text-tejas-saffron">*</span></span>
      {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-tejas-muted">{hint}</span> : null}
      <input name={name} type={type} required className={controlClass} />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

export function BookOrderForm() {
  const router = useRouter();
  const idempotencyKey = useMemo(() => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }, []);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => {
    let quantity = 0;
    for (const [key, raw] of Object.entries(quantities)) {
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 0) continue;
      const [, classRaw, stream] = key.split("_");
      if (stream !== "english" && stream !== "mathematics" && stream !== "technology") continue;
      if (!streamAllowed(stream, Number(classRaw))) continue;
      quantity += value;
    }
    return {
      quantity,
      gross: quantity * BOOK_PRICE,
      share: quantity * BOOK_SCHOOL_SHARE,
      payable: quantity * BOOK_TEJAS,
    };
  }, [quantities]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setFormErrors([]);
    setFieldErrors({});
    const response = await fetch("/api/books/order", {
      method: "POST",
      body: data,
      headers: { "x-idempotency-key": idempotencyKey },
    });
    const body = (await response.json()) as { ok?: boolean; formErrors?: string[]; fieldErrors?: Record<string, string>; order?: { reference: string } };
    setBusy(false);
    if (body.ok && body.order) {
      router.push(`/books/order/confirmation/${body.order.reference}`);
      return;
    }
    setFormErrors(body.formErrors ?? ["The order could not be recorded."]);
    setFieldErrors(body.fieldErrors ?? {});
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <section className="rounded-2xl border border-tejas-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-tejas-blue">School</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Field label="School name" name="schoolName" error={fieldErrors.schoolName} /></div>
          <div className="md:col-span-2"><Field label="School address and contact address" name="schoolAddress" error={fieldErrors.schoolAddress} /></div>
          <Field label="School email" name="schoolEmail" type="email" error={fieldErrors.schoolEmail} />
          <Field label="School mobile" name="schoolMobile" type="tel" error={fieldErrors.schoolMobile} hint="10-digit Indian mobile number." />
        </div>
      </section>

      <section className="rounded-2xl border border-tejas-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-tejas-blue">Contact person</h2>
        <p className="mt-1 text-sm text-tejas-muted">The coordinator who will be contacted about this book order.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Name" name="coordinatorName" error={fieldErrors.coordinatorName} />
          <Field label="Designation" name="coordinatorDesignation" error={fieldErrors.coordinatorDesignation} />
          <Field label="Mobile" name="coordinatorMobile" type="tel" error={fieldErrors.coordinatorMobile} />
          <Field label="Email" name="coordinatorEmail" type="email" error={fieldErrors.coordinatorEmail} />
        </div>
      </section>

      <section className="rounded-2xl border border-tejas-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-tejas-blue">Books by class and stream</h2>
        <p className="mt-1 text-sm leading-relaxed text-tejas-muted">Enter a quantity for each class and stream that needs books. Future Tech is available from Class VI. Leave a box blank when no books are required. There is no single combined quantity.</p>
        {fieldErrors.lines ? <p className="mt-3 text-sm text-red-700">{fieldErrors.lines}</p> : null}
        <div className="mt-4 space-y-4">
          {BOOK_CLASSES.map((classNumber) => (
            <fieldset key={classNumber} className="rounded-xl border border-tejas-border p-4">
              <legend className="px-1 text-sm font-semibold text-tejas-ink">{classLabel(classNumber)}</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {STREAMS.map((stream) => {
                  const key = `qty_${classNumber}_${stream.id}`;
                  const allowed = streamAllowed(stream.id, classNumber);
                  return (
                    <label key={key} className="block text-sm">
                      <span className="font-medium text-tejas-ink">{streamLabel(stream.id)}</span>
                      {allowed ? (
                        <input
                          name={key}
                          type="number"
                          min={0}
                          max={10000}
                          inputMode="numeric"
                          value={quantities[key] ?? ""}
                          onChange={(event) => setQuantities((current) => ({ ...current, [key]: event.target.value }))}
                          className={controlClass}
                          aria-label={`${classLabel(classNumber)} ${streamLabel(stream.id)} quantity`}
                        />
                      ) : (
                        <span className="mt-1.5 block rounded-xl border border-dashed border-tejas-border px-3 py-2.5 text-tejas-muted">Not available</span>
                      )}
                      {fieldErrors[key] ? <span className="mt-1 block text-sm text-red-700">{fieldErrors[key]}</span> : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-tejas-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-tejas-blue">Amount preview</h2>
        <p className="mt-1 text-sm text-tejas-muted">This preview uses the published rates. The saved order uses the amount calculated on the server. A typed total is not accepted.</p>
        <dl className="mt-4 divide-y divide-tejas-border rounded-xl border border-tejas-border text-sm">
          {[
            ["Total books", String(preview.quantity)],
            ["Gross amount", inr.format(preview.gross)],
            ["School share, at the school's discretion", inr.format(preview.share)],
            ["TEJAS payable", inr.format(preview.payable)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
              <dt>{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-tejas-muted">₹{BOOK_PRICE} per book. The school may retain ₹{BOOK_SCHOOL_SHARE}. ₹{BOOK_TEJAS} is payable to TEJAS. Recording this order does not collect payment and does not dispatch books.</p>
        {formErrors.map((error) => <p key={error} className="mt-3 text-sm text-red-700">{error}</p>)}
        <button type="submit" disabled={busy} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-tejas-saffron px-6 py-3 text-base font-semibold text-white disabled:opacity-60 sm:w-auto">
          {busy ? "Recording order…" : "Record printed book order"}
        </button>
      </section>
    </form>
  );
}
