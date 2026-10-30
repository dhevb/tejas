"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

type PublicPayment =
  | { activated: false; heading: string; message: string }
  | {
      activated: true;
      heading: string;
      message: string;
      bankName: string;
      accountHolder: string;
      accountNumber: string;
      ifsc: string;
      upiId: string;
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
  const [books, setBooks] = useState("no");
  const [ebooks, setEbooks] = useState("no");
  const [affiliation, setAffiliation] = useState("yes");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<"preview" | "submit" | null>(null);
  const [payment, setPayment] = useState<PublicPayment | null>(null);
  const [paymentMode, setPaymentMode] = useState("UPI");
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
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-tejas-ink">School details</h2>
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
            <select name="schoolCategory" required className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
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
            <select name="affiliationHasNumber" value={affiliation} onChange={(event) => setAffiliation(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
              <option value="yes">The school has a number</option>
              <option value="no">Not applicable</option>
            </select>
          </label>
          {affiliation === "yes" ? <Field label="Affiliation or recognition number *" name="affiliationNumber" error={fieldErrors.affiliationNumber} /> : <input type="hidden" name="affiliationNumber" value="" />}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-tejas-ink">Principal</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Principal's full name *" name="principalName" error={fieldErrors.principalName} />
          <Field label="Principal's mobile *" name="principalMobile" type="tel" error={fieldErrors.principalMobile} />
          <Field label="Principal's official email *" name="principalEmail" type="email" error={fieldErrors.principalEmail} />
          <Field label="Principal's designation *" name="principalDesignation" error={fieldErrors.principalDesignation} />
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-tejas-ink">School coordinator</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Coordinator's full name *" name="coordinatorName" error={fieldErrors.coordinatorName} />
          <Field label="Coordinator's mobile *" name="coordinatorMobile" type="tel" error={fieldErrors.coordinatorMobile} />
          <Field label="Coordinator's email *" name="coordinatorEmail" type="email" error={fieldErrors.coordinatorEmail} />
          <Field label="Coordinator's designation *" name="coordinatorDesignation" error={fieldErrors.coordinatorDesignation} />
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
          Every column in the template is compulsory, including roll number, parent mobile, parent email, date of birth, and at least one stream. Classes III–X. Files up to 10 MB: .xlsx, .xls, or .csv.
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
        <p className="text-sm text-tejas-muted">The server calculates ₹150 for each student-stream. Printed books are ₹170 each and e-book access is ₹49 for each student, only when selected. A school share is not approved and is not deducted.</p>
        <label className="block text-sm">
          <span className="font-medium">Printed preparation books *</span>
          <select name="printedBooks" value={books} onChange={(event) => setBooks(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="no">No, I do not want printed books</option>
            <option value="yes">Yes, I want printed books</option>
          </select>
        </label>
        {books === "yes" ? <Field label="Number of printed books *" name="bookQuantity" type="number" error={fieldErrors.bookQuantity} /> : <input type="hidden" name="bookQuantity" value="0" />}
        <label className="block text-sm">
          <span className="font-medium">E-book access *</span>
          <select name="ebookAccess" value={ebooks} onChange={(event) => setEbooks(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="no">No, I do not want e-book access</option>
            <option value="yes">Yes, I want e-book access</option>
          </select>
        </label>
        {ebooks === "yes" ? <p className="text-sm text-tejas-muted">Access is ₹49 per registered student and stays off until TEJAS Olympiad verifies payment. No login is created by this form.</p> : null}
        {fee ? (
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4"><dt>Student-stream registrations</dt><dd>{fee.studentStreamRegistrations}</dd></div>
            <div className="flex justify-between gap-4"><dt>Registration amount</dt><dd>{inr.format(fee.totalStudentFees)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Printed books</dt><dd>{inr.format(fee.printedBookAmount ?? 0)}</dd></div>
            <div className="flex justify-between gap-4"><dt>E-book access</dt><dd>{inr.format(fee.ebookAmount ?? 0)}</dd></div>
            <div className="flex justify-between gap-4 font-semibold"><dt>Amount due</dt><dd>{inr.format(fee.amountDue ?? fee.payableToTejas)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-tejas-muted">Check the sheet to see the fee calculated on the server.</p>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-bold text-tejas-ink">Payment</h2>
        {payment?.activated ? (
          <>
            <p className="font-semibold">{payment.heading}</p>
            <p className="text-sm text-tejas-muted">{payment.message}</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Account name", payment.accountHolder],
                ["Account number", payment.accountNumber],
                ["Bank", payment.bankName],
                ["IFSC", payment.ifsc],
                ["UPI", payment.upiId],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white p-3">
                  <dt className="text-tejas-muted">{label}</dt>
                  <dd className="mt-1 break-all font-semibold">{value}</dd>
                  <button type="button" className="mt-2 text-sm font-semibold text-tejas-blue underline" onClick={() => copyValue(label, value)}>
                    {copied === label ? "Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </dl>
            <label className="block text-sm">
              <span className="font-medium">Payment mode *</span>
              <select name="paymentMode" required value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                {["UPI", "NEFT", "IMPS", "RTGS", "Bank Transfer", "Cheque", "Other"].map((mode) => (
                  <option key={mode}>{mode}</option>
                ))}
              </select>
            </label>
            <Field label="Payment date *" name="paymentDate" type="date" error={fieldErrors.paymentDate} />
            <Field label="Amount paid *" name="amountPaid" type="number" error={fieldErrors.transactionReference} />
            <Field label="Name of payer *" name="payerName" error={fieldErrors.payerName} />
            <Field
              label={paymentMode === "Cheque" ? "Cheque number *" : paymentMode === "UPI" ? "UPI transaction reference *" : "UTR or bank reference *"}
              name="transactionReference"
              error={fieldErrors.transactionReference}
            />
            <label className="block text-sm">
              <span className="font-medium">Payment proof (JPG, PNG, or PDF) *</span>
              <input name="receipt" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" required className="mt-1 block w-full text-sm" />
            </label>
            <p className="text-sm text-tejas-muted">Uploading proof does not confirm the payment. Registration stays pending until TEJAS Olympiad verifies it.</p>
          </>
        ) : (
          <>
            <p className="font-semibold">Payment Instructions: Awaiting Official Account Details</p>
            <p className="text-sm text-tejas-muted">
              Official payment instructions will be provided after the authorised account details are confirmed. Please do not transfer money to any unverified account. Sending this form does not mean a payment has been made.
            </p>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-tejas-ink">Declaration and submission</h2>
        <Field label="Authorised representative's name *" name="representativeName" error={fieldErrors.representativeName} />
        <Field label="Representative's designation *" name="representativeDesignation" error={fieldErrors.representativeDesignation} />
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
            <input type="checkbox" name={name} value="yes" required />
            <span>{label} *</span>
          </label>
        ))}
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
