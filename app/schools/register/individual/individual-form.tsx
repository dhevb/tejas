"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGISTRATION_BANK } from "@/lib/registration/official-bank";

const field = "mt-1 w-full rounded-xl border border-tejas-border px-3 py-2 text-sm";

export function IndividualRegistrationForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const body = new FormData(event.currentTarget);
    const streams = ["english", "mathematics", "technology"].filter((id) => body.get(`stream-${id}`) === "on");
    body.set("streams", streams.join(", "));
    try {
      const response = await fetch("/api/register/individual", { method: "POST", body });
      const payload = await response.json() as { ok?: boolean; formErrors?: string[]; fieldErrors?: Record<string, string>; registration?: { reference: string } };
      if (!response.ok || !payload.ok || !payload.registration) {
        setMessage(payload.formErrors?.join(" ") || Object.values(payload.fieldErrors ?? {}).join(" ") || "The registration was not saved.");
        return;
      }
      router.push(`/schools/register/confirmation/${payload.registration.reference}`);
    } catch {
      setMessage("The registration could not be confirmed. It was not marked as paid.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-tejas-border bg-white p-6 shadow-sm">
      <p className="text-sm leading-relaxed text-tejas-muted">An individual registration is ₹150 for each selected stream. There is no school share. The full amount is paid to the TEJAS Olympiad account below. A printed book, if needed, is a separate order.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Student full name<input name="fullName" required className={field} /></label>
        <label className="text-sm font-medium">Father&apos;s/Mother&apos;s name<input name="parentName" required className={field} /></label>
        <label className="text-sm font-medium">Date of birth<input name="dateOfBirth" required placeholder="DD-MM-YYYY" className={field} /></label>
        <label className="text-sm font-medium">Class<input name="className" required placeholder="III–X" className={field} /></label>
        <label className="text-sm font-medium">School name<input name="schoolName" required className={field} /></label>
        <label className="text-sm font-medium">Section<input name="section" className={field} /></label>
        <label className="text-sm font-medium">Roll number<input name="rollNumber" className={field} /></label>
        <label className="text-sm font-medium">Mobile number<input name="mobile" required className={field} /></label>
        <label className="text-sm font-medium sm:col-span-2">Email address<input name="email" type="email" required className={field} /></label>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Selected Olympiad stream(s)</legend>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="stream-english" /> TEJAS English — ₹150</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="stream-mathematics" /> TEJAS Mathematics — ₹150</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="stream-technology" /> TEJAS Future Tech — ₹150, classes VI–X</label>
      </fieldset>
      <div className="rounded-2xl bg-tejas-ivory p-4 text-sm">
        <p className="font-semibold">Bank details — individual registration</p>
        <p>{REGISTRATION_BANK.accountHolder}</p>
        <p>{REGISTRATION_BANK.bankName}, {REGISTRATION_BANK.branch}</p>
        <p>Account {REGISTRATION_BANK.accountNumber}</p>
        <p>IFSC {REGISTRATION_BANK.ifsc}</p>
        <p className="mt-2 text-tejas-muted">This is not the book or e-book account. Payment is completed only after the screenshot and UTR are submitted and verified.</p>
      </div>
      {message ? <p className="text-sm text-red-700" role="alert">{message}</p> : null}
      <button type="submit" disabled={busy} className="rounded-xl bg-tejas-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Submitting…" : "Submit individual registration"}</button>
    </form>
  );
}
