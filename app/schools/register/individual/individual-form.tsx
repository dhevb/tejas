"use client";

import { useState } from "react";
import type { PublicPayment } from "@/lib/registration/official-bank";

const controlClass =
  "mt-1 w-full rounded-lg border border-tejas-border bg-white px-3 py-2 text-base text-tejas-ink shadow-sm focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30";

export function IndividualRegistrationForm({ payment }: { payment: PublicPayment }) {
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [amountDue, setAmountDue] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const body = new FormData(event.currentTarget);
    const streams = ["english", "mathematics", "technology"]
      .filter((id) => body.get(`stream_${id}`) === "on")
      .join(",");
    body.set("streams", streams);
    try {
      const response = await fetch("/api/register/individual", { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        formErrors?: string[];
        fieldErrors?: Record<string, string>;
        reference?: string;
        amountDue?: number;
      } | null;
      if (!response.ok || !payload?.ok) {
        const fields = payload?.fieldErrors ? Object.values(payload.fieldErrors).join(" ") : "";
        setMessage(payload?.formErrors?.join(" ") || fields || "The registration could not be saved.");
        return;
      }
      setReference(payload.reference ?? null);
      setAmountDue(payload.amountDue ?? null);
    } catch {
      setMessage("The registration could not be confirmed. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <div className="space-y-3 rounded-2xl border border-tejas-border bg-white p-6 shadow-tejas">
        <h2 className="text-lg font-bold text-tejas-ink">Registration saved</h2>
        <p className="text-sm text-tejas-muted">Reference {reference}. Amount payable to TEJAS ₹{amountDue?.toLocaleString("en-IN")}.</p>
        <p className="text-sm text-tejas-muted">{payment.message}</p>
        <a className="inline-flex font-semibold text-tejas-blue underline" href={`/schools/register/confirmation/${reference}`}>
          Open payment confirmation
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-tejas-border bg-white p-6 shadow-tejas">
      <h2 className="text-lg font-bold text-tejas-ink">Student details</h2>
      <label className="block text-sm">
        <span className="font-medium">Student full name</span>
        <input name="fullName" required className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Father&apos;s or mother&apos;s name</span>
        <input name="parentName" required className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Date of birth</span>
        <input name="dateOfBirth" type="date" required className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Class (3–10 or III–X)</span>
        <input name="className" required className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">School name</span>
        <input name="schoolName" required className={controlClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Section</span>
          <input name="section" className={controlClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Roll number</span>
          <input name="rollNumber" className={controlClass} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium">Mobile</span>
        <input name="mobile" required className={controlClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Email</span>
        <input name="email" type="email" required className={controlClass} />
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Streams (₹150 each, full amount to TEJAS)</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stream_english" /> TEJAS English
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stream_mathematics" /> TEJAS Mathematics
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stream_technology" /> TEJAS Future Tech
        </label>
      </fieldset>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
      <button type="submit" disabled={busy} className="rounded-xl bg-tejas-saffron px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Saving…" : "Save individual registration"}
      </button>
    </form>
  );
}
