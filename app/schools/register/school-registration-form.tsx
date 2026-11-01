"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OFFICIAL_BANK } from "@/lib/registration/official-bank";

type Fee = {
  studentStreamRegistrations: number;
  totalStudentFees: number;
  payableToTejas: number;
  schoolShare: number;
  printedBooks?: number;
  printedBookAmount?: number;
  ebookAccess?: number;
  ebookAmount?: number;
  amountDue?: number;
};

type PublicPayment = {
  detailsPublished: true;
  proofsAccepted: boolean;
  heading: string;
  message: string;
};

type Preview = {
  ok: boolean;
  formErrors?: string[];
  rowErrors?: { row: number; messages: string[] }[];
  students?: { fullName: string; className: string; streams: string[] }[];
  fee?: Fee;
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const controlClass =
  "mt-1 w-full rounded-lg border border-tejas-border bg-white px-3 py-2 text-base text-tejas-ink shadow-sm focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30";

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
        className={controlClass}
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
  const [books, setBooks] = useState("no");
  const [affiliation, setAffiliation] = useState("yes");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<"preview" | "submit" | null>(null);
  const [payment, setPayment] = useState<PublicPayment | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/register/payment")
      .then((response) => response.json())
      .then((body: PublicPayment) => {
        if (active) setPayment(body);
      })
      .catch(() => {
        if (active) setPayment(null);
      });
    return () => {
      active = false;
    };
  }, []);

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied("");
    }
  }

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
      <p className="text-sm text-tejas-muted">All fields marked with * are compulsory. Please complete all applicable fields before submitting the registration.</p>
      <section className="space-y-4 rounded-2xl border border-tejas-border bg-white p-5 sm:p-6">
        <h2 className="border-l-4 border-tejas-saffron pl-3 text-xl font-bold text-tejas-blue">School details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full registered school name *" name="schoolName" error={fieldErrors.schoolName} />
          <Field label="Complete school address *" name="schoolAddress" error={fieldErrors.schoolAddress} />
          <Field label="State *" name="state" error={fieldErrors.state} />
          <Field label="District *" name="district" error={fieldErrors.district} />
          <Field label="City or block *" name="city" error={fieldErrors.city} />
          <Field label="PIN code *" name="pin" error={fieldErrors.pin} />
          <Field label="School PAN *" name="pan" error={fieldErrors.pan} />
          <Field label="School email *" name="schoolEmail" type="email" error={fieldErrors.schoolEmail} />
          <Field label="School contact mobile *" name="schoolMobile" type="tel" error={fieldErrors.schoolMobile} />
          <Field label="Affiliation or recognition board *" name="affiliationBoard" error={fieldErrors.affiliationBoard} />
          <label className="block text-sm">
            <span className="font-medium text-tejas-ink">School category *</span>
            <select name="schoolCategory" required className={controlClass}>
              <option value="">Select</option>
              <option>Government</option>
              <option>Government-aided</option>
              <option>Private</option>
              <option>Other recognised school</option>
            </select>
            {fieldErrors.schoolCategory ? <span className="mt-1 block text-red-700">{fieldErrors.schoolCategory}</span> : null}
          </label>
          <label className="block text-sm">
            <span className="font-medium text-tejas-ink">Affiliation or recognition number *</span>
            <select name="affiliationHasNumber" value={affiliation} onChange={(event) => setAffiliation(event.target.value)} className={controlClass}>
              <option value="yes">The school has a number</option>
              <option value="no">Not applicable</option>
            </select>
          </label>
          {affiliation === "yes" ? <Field label="Affiliation or recognition number *" name="affiliationNumber" error={fieldErrors.affiliationNumber} /> : <input type="hidden" name="affiliationNumber" value="" />}
        </div>
      </section>
      <section className="space-y-4 rounded-2xl border border-tejas-border bg-white p-5 sm:p-6">
        <h2 className="border-l-4 border-tejas-saffron pl-3 text-xl font-bold text-tejas-blue">Principal</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Principal's full name *" name="principalName" error={fieldErrors.principalName} />
          <Field label="Principal's mobile *" name="principalMobile" type="tel" error={fieldErrors.principalMobile} />
          <Field label="Principal's official email *" name="principalEmail" type="email" error={fieldErrors.principalEmail} />
        </div>
      </section>
      <section className="space-y-4 rounded-2xl border border-tejas-border bg-white p-5 sm:p-6">
        <h2 className="border-l-4 border-tejas-saffron pl-3 text-xl font-bold text-tejas-blue">School coordinator</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Coordinator's full name *" name="coordinatorName" error={fieldErrors.coordinatorName} />
          <Field label="Coordinator's mobile *" name="coordinatorMobile" type="tel" error={fieldErrors.coordinatorMobile} />
          <Field label="Coordinator's email *" name="coordinatorEmail" type="email" error={fieldErrors.coordinatorEmail} />
          <Field label="Coordinator's designation *" name="coordinatorDesignation" error={fieldErrors.coordinatorDesignation} />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-tejas-border bg-white p-5 sm:p-6">
        <h2 className="border-l-4 border-tejas-saffron pl-3 text-xl font-bold text-tejas-blue">Previous Olympiad participation</h2>
        <label className="block text-sm">
          <span className="font-medium text-tejas-ink">Did the school take part in the 1st DHE English Olympiad (13–16 October 2025)?</span>
          <select
            name="previousParticipation"
            value={previous}
            onChange={(event) => setPrevious(event.target.value)}
            className={controlClass}
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

      <section className="space-y-4 rounded-2xl border border-tejas-border bg-white p-5 sm:p-6">
        <h2 className="border-l-4 border-tejas-saffron pl-3 text-xl font-bold text-tejas-blue">Student Excel/CSV upload</h2>
        <p className="text-sm text-tejas-muted">
          Every column in the template is compulsory, including roll number, parent mobile, parent email, date of birth, and at least one stream. Classes III–X. Files up to 10 MB: .xlsx, .xls, or .csv.
        </p>
        <Link href="/api/register/template" className="inline-flex text-sm font-semibold text-tejas-blue underline">
          Download the Excel template
        </Link>
        <label className="block text-sm">
          <span className="font-medium text-tejas-ink">Student sheet</span>
          <input name="file" type="file" accept=".xlsx,.xls,.csv,text/csv" required className="mt-1 block w-full text-sm text-tejas-ink file:mr-3 file:rounded-lg file:border-0 file:bg-tejas-saffron-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-tejas-saffron-dark" />
        </label>
        <button
          type="button"
          className="rounded-lg border-2 border-tejas-blue px-4 py-2 text-sm font-semibold text-tejas-blue hover:bg-tejas-blue/5"
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

      <section className="space-y-2 rounded-2xl border border-tejas-border bg-white p-5 sm:p-6">
        <h2 className="border-l-4 border-tejas-saffron pl-3 text-xl font-bold text-tejas-blue">Automatic fee summary</h2>
        <p className="text-sm text-tejas-muted">The server calculates ₹150 for each student-stream. Printed books are ₹170 each. The registration fee and the book amount are listed separately and paid together to the official account. E-book access is not for sale, so ₹49 is not added. A school share is not approved and is not deducted.</p>
        <label className="block text-sm">
          <span className="font-medium">Printed preparation books *</span>
          <select name="printedBooks" value={books} onChange={(event) => setBooks(event.target.value)} className={controlClass}>
            <option value="no">No, I do not want printed books</option>
            <option value="yes">Yes, I want printed books</option>
          </select>
        </label>
        {books === "yes" ? <Field label="Number of printed books *" name="bookQuantity" type="number" error={fieldErrors.bookQuantity} /> : <input type="hidden" name="bookQuantity" value="0" />}
        <p className="text-sm text-tejas-muted">There is no separate book list by class. The school chooses how many copies it needs. This page does not record dispatch or delivery.</p>
        <input type="hidden" name="ebookAccess" value="no" />
        <p className="text-sm text-tejas-muted">E-book files and student logins are not available. The form does not charge ₹49.</p>
        {fee ? (
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4"><dt>Student-stream registrations</dt><dd>{fee.studentStreamRegistrations}</dd></div>
            <div className="flex justify-between gap-4"><dt>Registration amount</dt><dd>{inr.format(fee.totalStudentFees)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Printed books</dt><dd>{inr.format(fee.printedBookAmount ?? 0)}</dd></div>
            <div className="flex justify-between gap-4"><dt>E-book access (not for sale)</dt><dd>{inr.format(fee.ebookAmount ?? 0)}</dd></div>
            <div className="flex justify-between gap-4 font-semibold"><dt>Amount due</dt><dd>{inr.format(fee.amountDue ?? fee.payableToTejas)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-tejas-muted">Check the sheet to see the fee calculated on the server.</p>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-tejas-warning/30 bg-tejas-warning/10 p-4 sm:p-6">
        <h2 className="border-l-4 border-tejas-warning pl-3 text-xl font-bold text-tejas-blue">Payment</h2>
        <p className="font-semibold">{payment?.heading ?? "Official payment account"}</p>
        <p className="text-sm text-tejas-muted">{payment?.message ?? "These are the official account details. Payment-proof submission will open once the secure payment system is operational."}</p>
        <dl className="grid gap-3 text-sm">
          {([
            ["Account name", OFFICIAL_BANK.accountHolder, false],
            ["Account number", OFFICIAL_BANK.accountNumber, true],
            ["Bank", OFFICIAL_BANK.bankName, false],
            ["Branch", OFFICIAL_BANK.branch, false],
            ["IFSC", OFFICIAL_BANK.ifsc, true],
            ["UPI ID", OFFICIAL_BANK.upiId, true],
          ] as const).map(([label, value, canCopy]) => (
            <div key={label} className="rounded-lg bg-white p-3">
              <dt className="text-tejas-muted">{label}</dt>
              <dd className="mt-1 break-all text-base font-semibold">{value}</dd>
              {canCopy ? (
                <button type="button" className="mt-2 min-h-[44px] text-sm font-semibold text-tejas-blue underline" onClick={() => copyValue(label, value)}>
                  {copied === label ? "Copied" : "Copy"}
                </button>
              ) : null}
            </div>
          ))}
        </dl>
        <p className="text-sm text-tejas-muted">
          {payment?.proofsAccepted
            ? "Submit the registration first. The confirmation page then accepts a JPG, PNG, or PDF proof for this reference. Uploading the proof does not verify the payment. There is no payment link and no QR code."
            : "Do not attach a receipt on this form yet. There is no payment link and no QR code."}
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-tejas-border bg-white p-5 sm:p-6">
        <h2 className="border-l-4 border-tejas-saffron pl-3 text-xl font-bold text-tejas-blue">Declaration and submission</h2>
        {[
          ["accurate", "The school information is accurate."],
          ["studentsChecked", "The school has checked the student information."],
          ["streamsCorrect", "The selected streams are correct."],
          ["feeUnderstood", "The school has understood the fee structure."],
          ["paymentGenuine", "Any payment information submitted is genuine."],
          ["authorised", "I am authorised by the school to submit this registration."],
          ["rules", "The school accepts the published registration rules and privacy terms."],
        ].map(([name, label]) => (
          <label key={name} className="flex gap-2 text-sm">
            <input type="checkbox" name={name} value="yes" required className="mt-0.5 h-4 w-4 accent-tejas-saffron" />
            <span>{label} *</span>
          </label>
        ))}
        {formErrors.map((error) => (
          <p key={error} className="text-sm text-red-700">{error}</p>
        ))}
        <button type="submit" disabled={busy !== null} className="rounded-xl bg-tejas-saffron px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-tejas-saffron-dark disabled:opacity-60">
          {busy === "submit" ? "Submitting…" : "Submit registration"}
        </button>
      </section>
    </form>
  );
}
