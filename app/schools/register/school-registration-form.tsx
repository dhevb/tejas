"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Fee = {
  studentStreamRegistrations: number;
  totalStudentFees: number;
  payableToTejas: number;
  schoolShare: number;
};

type Preview = {
  ok: boolean;
  formErrors?: string[];
  rowErrors?: { row: number; messages: string[] }[];
  students?: { fullName: string; className: string; streams: string[] }[];
  fee?: Fee;
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function Field({
  label,
  name,
  type = "text",
  required = true,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-tejas-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-tejas-ink"
      />
      {error ? <span className="mt-1 block text-red-700">{error}</span> : null}
    </label>
  );
}

export function SchoolRegistrationForm() {
  const router = useRouter();
  const idempotencyKey = useMemo(() => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }, []);
  const [previous, setPrevious] = useState("no");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<"preview" | "submit" | null>(null);

  async function checkSheet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy("preview");
    setFormErrors([]);
    setFieldErrors({});
    const response = await fetch("/api/register/preview", { method: "POST", body: data });
    const body = (await response.json()) as Preview;
    setPreview(body);
    setFormErrors(body.formErrors ?? []);
    setBusy(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy("submit");
    setFormErrors([]);
    setFieldErrors({});
    const response = await fetch("/api/register/submit", {
      method: "POST",
      body: data,
      headers: { "x-idempotency-key": idempotencyKey },
    });
    const body = (await response.json()) as {
      ok?: boolean;
      formErrors?: string[];
      fieldErrors?: Record<string, string>;
      rowErrors?: { row: number; messages: string[] }[];
      registration?: { reference: string };
    };
    setBusy(null);
    if (body.ok && body.registration) {
      router.push(`/schools/register/confirmation/${body.registration.reference}`);
      return;
    }
    setFormErrors(body.formErrors ?? []);
    setFieldErrors(body.fieldErrors ?? {});
    if (body.rowErrors?.length) setPreview((current) => ({ ...(current ?? { ok: false }), rowErrors: body.rowErrors }));
  }

  const fee = preview?.fee;

  return (
    <form className="space-y-10" onSubmit={submit}>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-tejas-ink">School details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="School name" name="schoolName" error={fieldErrors.schoolName} />
          <Field label="School address" name="schoolAddress" error={fieldErrors.schoolAddress} />
          <Field label="Principal's name" name="principalName" error={fieldErrors.principalName} />
          <Field label="Principal's email" name="principalEmail" type="email" error={fieldErrors.principalEmail} />
          <Field label="School coordinator's name" name="coordinatorName" error={fieldErrors.coordinatorName} />
          <Field label="Coordinator's mobile" name="coordinatorMobile" type="tel" error={fieldErrors.coordinatorMobile} />
          <Field label="Coordinator's email" name="coordinatorEmail" type="email" error={fieldErrors.coordinatorEmail} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-tejas-ink">Previous Olympiad participation</h2>
        <label className="block text-sm">
          <span className="font-medium text-tejas-ink">Did the school take part in the 1st DHE English Olympiad (13–16 October 2025)?</span>
          <select
            name="previousParticipation"
            value={previous}
            onChange={(event) => setPrevious(event.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        {previous === "yes" ? (
          <Field label="Previous registration reference, if you have one" name="previousReference" required={false} error={fieldErrors.previousReference} />
        ) : (
          <input type="hidden" name="previousReference" value="" />
        )}
        {fieldErrors.previousParticipation ? <p className="text-sm text-red-700">{fieldErrors.previousParticipation}</p> : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-tejas-ink">Student Excel/CSV upload</h2>
        <p className="text-sm text-tejas-muted">
          Use the template. Classes III–X. Streams: TEJAS English, TEJAS Mathematics, TEJAS Future Tech. Files up to 10 MB: .xlsx, .xls, or .csv.
        </p>
        <Link href="/api/register/template" className="inline-flex text-sm font-semibold text-tejas-blue underline">
          Download the Excel template
        </Link>
        <label className="block text-sm">
          <span className="font-medium text-tejas-ink">Student sheet</span>
          <input name="file" type="file" accept=".xlsx,.xls,.csv,text/csv" required className="mt-1 block w-full text-sm" />
        </label>
        <button
          type="button"
          className="rounded-lg border border-tejas-blue px-4 py-2 text-sm font-semibold text-tejas-blue"
          disabled={busy !== null}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) void checkSheet({ preventDefault() {}, currentTarget: form } as React.FormEvent<HTMLFormElement>);
          }}
        >
          {busy === "preview" ? "Checking sheet…" : "Check the sheet"}
        </button>
        {preview?.rowErrors?.length ? (
          <ul className="space-y-1 text-sm text-red-700">
            {preview.rowErrors.map((row) => (
              <li key={row.row}>Row {row.row}: {row.messages.join(" ")}</li>
            ))}
          </ul>
        ) : null}
        {preview?.students?.length ? (
          <p className="text-sm text-tejas-muted">{preview.students.length} student {preview.students.length === 1 ? "row" : "rows"} ready.</p>
        ) : null}
      </section>

      <section className="space-y-2 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-bold text-tejas-ink">Automatic fee summary</h2>
        <p className="text-sm text-tejas-muted">The server calculates this from valid student-stream registrations. The ₹20 school share is inside the ₹100. It is not an extra charge.</p>
        {fee ? (
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between"><dt>Student-stream registrations</dt><dd>{fee.studentStreamRegistrations}</dd></div>
            <div className="flex justify-between"><dt>Total collected from students</dt><dd>{inr.format(fee.totalStudentFees)}</dd></div>
            <div className="flex justify-between"><dt>Payable to TEJAS Olympiad</dt><dd>{inr.format(fee.payableToTejas)}</dd></div>
            <div className="flex justify-between"><dt>Retained by the school</dt><dd>{inr.format(fee.schoolShare)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-tejas-muted">Check the sheet to see the fee.</p>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-bold text-tejas-ink">Payment status</h2>
        <p className="font-semibold">Payment Instructions: Awaiting Official Account Details</p>
        <p className="text-sm text-tejas-muted">
          Official payment instructions will be provided after the authorised account details are confirmed. Please do not transfer money to any unverified account. Sending this form does not mean a payment has been made.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-tejas-ink">Declaration and submission</h2>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="authorised" value="yes" required />
          <span>I am authorised by the school to submit this registration.</span>
        </label>
        {fieldErrors.authorised ? <p className="text-sm text-red-700">{fieldErrors.authorised}</p> : null}
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="privacy" value="yes" required />
          <span>I acknowledge that student details are collected for this Olympiad registration and are not shown on the public confirmation page.</span>
        </label>
        {fieldErrors.privacy ? <p className="text-sm text-red-700">{fieldErrors.privacy}</p> : null}
        {formErrors.map((error) => (
          <p key={error} className="text-sm text-red-700">{error}</p>
        ))}
        <button type="submit" disabled={busy !== null} className="rounded-xl bg-tejas-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {busy === "submit" ? "Submitting…" : "Submit registration"}
        </button>
      </section>
    </form>
  );
}
