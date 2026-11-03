"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BOOK_CLASSES, classLabel, streamAllowed, streamLabel } from "@/lib/orders/catalogue";
import { STREAMS } from "@/lib/registration/schema";

const controlClass =
  "mt-1.5 w-full rounded-xl border border-tejas-border bg-white px-3 py-2.5 text-base text-tejas-ink shadow-sm focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30";

export function EbookRegisterForm() {
  const router = useRouter();
  const idempotencyKey = useMemo(() => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }, []);
  const [classNumber, setClassNumber] = useState("6");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const selectedClass = Number(classNumber);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setFormErrors([]);
    setFieldErrors({});
    const response = await fetch("/api/ebook/register", {
      method: "POST",
      body: data,
      headers: { "x-idempotency-key": idempotencyKey },
    });
    const body = (await response.json()) as { ok?: boolean; formErrors?: string[]; fieldErrors?: Record<string, string>; account?: { reference: string } };
    setBusy(false);
    if (body.ok && body.account) {
      router.push(`/ebook/register/confirmation/${body.account.reference}`);
      return;
    }
    setFormErrors(body.formErrors ?? ["The registration could not be recorded."]);
    setFieldErrors(body.fieldErrors ?? {});
  }

  return (
    <form className="space-y-6 rounded-2xl border border-tejas-border bg-white p-5 shadow-sm sm:p-6" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-tejas-ink">Student’s full name <span className="text-tejas-saffron">*</span></span>
          <input name="studentName" required className={controlClass} />
          {fieldErrors.studentName ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.studentName}</span> : null}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-tejas-ink">Parent’s name <span className="text-tejas-saffron">*</span></span>
          <input name="parentName" required className={controlClass} />
          {fieldErrors.parentName ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.parentName}</span> : null}
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-tejas-ink">School name <span className="text-tejas-saffron">*</span></span>
          <input name="schoolName" required className={controlClass} />
          {fieldErrors.schoolName ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.schoolName}</span> : null}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-tejas-ink">Class <span className="text-tejas-saffron">*</span></span>
          <select name="classNumber" required value={classNumber} onChange={(event) => setClassNumber(event.target.value)} className={controlClass}>
            {BOOK_CLASSES.map((item) => <option key={item} value={item}>{classLabel(item)}</option>)}
          </select>
          {fieldErrors.classNumber ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.classNumber}</span> : null}
        </label>
        <fieldset className="text-sm">
          <legend className="font-medium text-tejas-ink">Streams <span className="text-tejas-saffron">*</span></legend>
          <div className="mt-2 space-y-2">
            {STREAMS.map((stream) => {
              const allowed = streamAllowed(stream.id, selectedClass);
              return (
                <label key={stream.id} className="flex min-h-11 items-center gap-2">
                  <input type="checkbox" name={`stream_${stream.id}`} value="yes" disabled={!allowed} />
                  <span>{streamLabel(stream.id)}{allowed ? "" : " (not available for this class)"}</span>
                </label>
              );
            })}
          </div>
          {fieldErrors.streams ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.streams}</span> : null}
        </fieldset>
        <label className="block text-sm">
          <span className="font-medium text-tejas-ink">Email for the login <span className="text-tejas-saffron">*</span></span>
          <input name="email" type="email" required autoComplete="email" className={controlClass} />
          {fieldErrors.email ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.email}</span> : null}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-tejas-ink">Parent or student mobile <span className="text-tejas-saffron">*</span></span>
          <input name="mobile" type="tel" required autoComplete="tel" className={controlClass} />
          {fieldErrors.mobile ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.mobile}</span> : null}
        </label>
      </div>
      <p className="text-sm text-tejas-muted">The fee is ₹49 for this student, including every selected stream. The fee is recorded here. Payment is not collected on this form, and no password is created until a staff member verifies the payment.</p>
      {formErrors.map((error) => <p key={error} className="text-sm text-red-700">{error}</p>)}
      <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-tejas-saffron px-6 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto">
        {busy ? "Recording…" : "Record e-book registration"}
      </button>
    </form>
  );
}
