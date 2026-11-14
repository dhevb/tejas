"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, FileSpreadsheet, Layers, Receipt, Send, UserRound, Users } from "lucide-react";
import { REGISTRATION_BANK } from "@/lib/registration/official-bank";
import { STUDENT_COLUMNS } from "@/lib/registration/schema";
import { interpretRegistrationReply, readRegistrationReply, registrationTransportMessage, REGISTRATION_REQUEST_MS } from "@/lib/registration/submit-client";

type Fee = {
  studentStreamRegistrations: number;
  totalStudentFees: number;
  payableToTejas: number;
  schoolShare: number;
  registrationSchoolShare?: number;
  registrationPayable?: number;
  printedBooks?: number;
  printedBookAmount?: number;
  bookSchoolShare?: number;
  bookPayable?: number;
  ebookAccess?: number;
  ebookAmount?: number;
  grossTotal?: number;
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
  "mt-1.5 w-full rounded-xl border border-tejas-border bg-white px-3 py-2.5 text-base text-tejas-ink shadow-sm focus-visible:border-tejas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tejas-blue/30";

function Field({
  label,
  name,
  type = "text",
  required = true,
  error,
  hint,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="font-medium text-tejas-ink">
        {label}
        {required ? <span className="text-tejas-saffron"> *</span> : null}
      </span>
      {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-tejas-muted">{hint}</span> : null}
      <input name={name} type={type} required={required} className={controlClass} />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function Section({
  step,
  title,
  icon: Icon,
  hint,
  children,
}: {
  step: string;
  title: string;
  icon: typeof Building2;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-tejas-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4F6FB] text-tejas-blue">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-tejas-saffron">{step}</p>
          <h2 className="text-xl font-bold text-tejas-blue">{title}</h2>
          {hint ? <p className="mt-1 text-sm leading-relaxed text-tejas-muted">{hint}</p> : null}
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function SchoolRegistrationForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const idempotencyKey = useRef<string | null>(null);
  const [previous, setPrevious] = useState("no");
  const [sheetName, setSheetName] = useState("");
  const [feeStale, setFeeStale] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<"preview" | "submit" | null>(null);
  const [payment, setPayment] = useState<PublicPayment | null>(null);
  const [copied, setCopied] = useState("");
  const [confirmed, setConfirmed] = useState("");

  function submissionKey(): string {
    if (idempotencyKey.current) return idempotencyKey.current;
    const fresh = () => {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    };
    let key = "";
    try {
      const saved = sessionStorage.getItem("tejas-school-registration-idempotency");
      if (saved && /^[a-f0-9]{32}$/.test(saved)) key = saved;
      else {
        key = fresh();
        sessionStorage.setItem("tejas-school-registration-idempotency", key);
      }
    } catch {
      key = fresh();
    }
    idempotencyKey.current = key;
    return key;
  }

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
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy("preview");
    setFormErrors([]);
    setFieldErrors({});
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REGISTRATION_REQUEST_MS);
    try {
      const response = await fetch("/api/register/preview", { method: "POST", body: data, signal: controller.signal });
      const body = await readRegistrationReply(response) as Preview | null;
      if (!body) {
        setFormErrors([registrationTransportMessage("unreachable")]);
        return;
      }
      setPreview(body);
      setFormErrors(body.formErrors ?? []);
      setFeeStale(false);
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setFormErrors([registrationTransportMessage(timedOut ? "timeout" : "unreachable")]);
    } finally {
      clearTimeout(timer);
      setBusy(null);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (confirmed) {
      router.push(`/schools/register/confirmation/${confirmed}`);
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy("submit");
    setFormErrors([]);
    setFieldErrors({});
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REGISTRATION_REQUEST_MS);
    try {
      const response = await fetch("/api/register/submit", {
        method: "POST",
        body: data,
        headers: { "x-idempotency-key": submissionKey() },
        signal: controller.signal,
      });
      const outcome = interpretRegistrationReply(await readRegistrationReply(response));
      if (outcome.state === "confirmed") {
        setConfirmed(outcome.reference);
        router.push(`/schools/register/confirmation/${outcome.reference}`);
        return;
      }
      setFormErrors(outcome.formErrors);
      setFieldErrors(outcome.fieldErrors);
      if (outcome.rowErrors.length) setPreview((current) => ({ ...(current ?? { ok: false }), rowErrors: outcome.rowErrors }));
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setFormErrors([registrationTransportMessage(timedOut ? "timeout" : "unreachable")]);
    } finally {
      clearTimeout(timer);
      setBusy(null);
    }
  }

  const fee = feeStale ? undefined : preview?.fee;
  const sheetReady = Boolean(preview?.students?.length) && !preview?.rowErrors?.length && !preview?.formErrors?.length;

  if (confirmed) {
    return (
      <section className="rounded-3xl border border-tejas-border bg-white px-5 py-6 shadow-sm sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-tejas-saffron">Registration received</p>
        <h2 className="mt-2 break-all text-2xl font-bold text-tejas-blue">{confirmed}</h2>
        <p className="mt-3 text-sm leading-relaxed text-tejas-ink">The server saved this school registration. Keep the reference. Opening the confirmation again does not create a second registration.</p>
        <Link href={`/schools/register/confirmation/${confirmed}`} className="mt-5 inline-flex min-h-11 items-center font-semibold text-tejas-blue underline">
          Open the confirmation
        </Link>
      </section>
    );
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <p className="rounded-2xl border border-tejas-border bg-white px-4 py-3 text-sm text-tejas-muted shadow-sm">
        Fields marked <span className="font-semibold text-tejas-saffron">*</span> are required. The amount due is calculated on the server after the student sheet is checked.
      </p>

      <Section step="01 · School information" title="School information" icon={Building2} hint="Use the school's registered name and the address used for official correspondence.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field className="md:col-span-2" label="Full registered school name" name="schoolName" error={fieldErrors.schoolName} />
          <Field className="md:col-span-2" label="Complete school address" name="schoolAddress" hint="Include the area, city, and PIN in this address." error={fieldErrors.schoolAddress} />
          <Field label="School PAN" name="pan" hint="The school's PAN, in the standard 10-character format." error={fieldErrors.pan} />
          <label className="block text-sm">
            <span className="font-medium text-tejas-ink">School category <span className="text-tejas-saffron">*</span></span>
            <select name="schoolCategory" required className={controlClass}>
              <option value="">Select</option>
              <option>Government</option>
              <option>Government-aided</option>
              <option>Private</option>
              <option>Other recognised school</option>
            </select>
            {fieldErrors.schoolCategory ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.schoolCategory}</span> : null}
          </label>
        </div>
        <div className="rounded-xl border border-tejas-border bg-tejas-ivory p-4">
          <label className="block text-sm">
            <span className="font-medium text-tejas-ink">Did the school take part in the 1st DHE English Olympiad (13–16 October 2025)? <span className="text-tejas-saffron">*</span></span>
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
            <div className="mt-4">
              <Field label="Previous registration reference, if you have one" name="previousReference" required={false} error={fieldErrors.previousReference} />
            </div>
          ) : (
            <input type="hidden" name="previousReference" value="" />
          )}
          {fieldErrors.previousParticipation ? <p className="mt-2 text-sm text-red-700">{fieldErrors.previousParticipation}</p> : null}
        </div>
      </Section>

      <Section step="02 · Principal and school contact" title="Principal and school contact details" icon={UserRound}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Principal's full name" name="principalName" error={fieldErrors.principalName} />
          <Field label="Principal's mobile" name="principalMobile" type="tel" hint="10-digit Indian mobile number." error={fieldErrors.principalMobile} />
          <Field label="Principal's official email" name="principalEmail" type="email" error={fieldErrors.principalEmail} />
          <Field label="School email" name="schoolEmail" type="email" error={fieldErrors.schoolEmail} />
          <Field label="School contact mobile" name="schoolMobile" type="tel" hint="10-digit school contact number." error={fieldErrors.schoolMobile} />
        </div>
      </Section>

      <Section step="03 · Coordinator" title="Coordinator information" icon={Users} hint="The coordinator is the person the programme can reach about this registration.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Coordinator's full name" name="coordinatorName" error={fieldErrors.coordinatorName} />
          <Field label="Coordinator's mobile" name="coordinatorMobile" type="tel" error={fieldErrors.coordinatorMobile} />
          <Field label="Coordinator's email" name="coordinatorEmail" type="email" error={fieldErrors.coordinatorEmail} />
          <Field label="Coordinator's designation" name="coordinatorDesignation" error={fieldErrors.coordinatorDesignation} />
        </div>
      </Section>

      <Section
        step="04 · Students"
        title="Student information and Excel/CSV upload"
        icon={FileSpreadsheet}
        hint="Upload one sheet for this school. The existing column headings and row rules are unchanged."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-tejas-ivory p-4 text-sm">
            <p className="font-semibold text-tejas-ink">Accepted formats</p>
            <p className="mt-1 text-tejas-muted">.xlsx, .xls, or .csv</p>
          </div>
          <div className="rounded-xl bg-tejas-ivory p-4 text-sm">
            <p className="font-semibold text-tejas-ink">Maximum file size</p>
            <p className="mt-1 text-tejas-muted">10 MB</p>
          </div>
          <div className="rounded-xl bg-tejas-ivory p-4 text-sm">
            <p className="font-semibold text-tejas-ink">Classes</p>
            <p className="mt-1 text-tejas-muted">English and Mathematics: III–X. Future Tech: VI–X.</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-tejas-ink">Required columns</p>
          <ul className="mt-2 grid gap-1 text-sm text-tejas-muted sm:grid-cols-2">
            {STUDENT_COLUMNS.map((column) => (
              <li key={column.key}>{column.header}</li>
            ))}
          </ul>
        </div>
        <Link href="/api/register/template" className="inline-flex text-sm font-semibold text-tejas-blue underline">
          Download the Excel template
        </Link>
        <div className="rounded-xl border border-dashed border-tejas-border bg-tejas-ivory p-4">
          <label className="block text-sm">
            <span className="font-medium text-tejas-ink">Student sheet <span className="text-tejas-saffron">*</span></span>
            <input
              ref={fileRef}
              name="file"
              type="file"
              accept=".xlsx,.xls,.csv,text/csv"
              required
              className="mt-2 block w-full text-sm text-tejas-ink file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-tejas-blue"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setSheetName(file?.name ?? "");
                setPreview(null);
                setFeeStale(false);
                setFormErrors([]);
              }}
            />
          </label>
          <p className="mt-3 text-sm text-tejas-ink" role="status">
            {sheetName ? <>Selected file: <span className="font-semibold">{sheetName}</span></> : "No file selected."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-tejas-border bg-white px-3 py-2 text-sm font-semibold text-tejas-ink"
              onClick={() => fileRef.current?.click()}
            >
              {sheetName ? "Replace file" : "Choose file"}
            </button>
            <button
              type="button"
              className="rounded-lg border-2 border-tejas-blue px-4 py-2 text-sm font-semibold text-tejas-blue hover:bg-tejas-blue/5 disabled:opacity-60"
              disabled={busy !== null}
              onClick={(event) => {
                const form = event.currentTarget.form;
                if (form) void checkSheet({ preventDefault() {}, currentTarget: form } as React.FormEvent<HTMLFormElement>);
              }}
            >
              {busy === "preview" ? "Checking sheet…" : "Check the sheet"}
            </button>
          </div>
        </div>
        {formErrors.length ? (
          <ul className="space-y-1 text-sm text-red-700">
            {formErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
        {preview?.rowErrors?.length ? (
          <ul className="space-y-1 text-sm text-red-700">
            {preview.rowErrors.map((row) => (
              <li key={row.row}>Row {row.row}: {row.messages.join(" ")}</li>
            ))}
          </ul>
        ) : null}
        {sheetReady ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
            {preview?.students?.length} student {preview?.students?.length === 1 ? "row is" : "rows are"} ready.
          </p>
        ) : sheetName && !busy && !preview ? (
          <p className="text-sm text-tejas-muted">Check the sheet before you rely on the fee summary.</p>
        ) : null}
      </Section>

      <Section
        step="05 · Streams"
        title="Olympiad stream selection"
        icon={Layers}
        hint="Streams are chosen in the student sheet, in the column Selected TEJAS Stream(s). There is no separate stream control on this form."
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            ["TEJAS Mathematics", "9 December 2026", "Classes III–X"],
            ["TEJAS English", "10 December 2026", "Classes III–X"],
            ["TEJAS Future Tech", "11 December 2026", "Classes VI–X"],
          ].map(([name, date, classes]) => (
            <li key={name} className="rounded-xl border border-tejas-border bg-tejas-ivory p-4">
              <p className="font-semibold text-tejas-blue">{name}</p>
              <p className="mt-1 text-sm text-tejas-muted">{date}</p>
              <p className="mt-1 text-sm text-tejas-muted">{classes}</p>
              <p className="mt-2 text-sm text-tejas-ink">₹150 collected · ₹120 to TEJAS</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section step="06 · Fee" title="Registration fee summary" icon={Receipt} hint="The school collects ₹150 for each student-stream, retains ₹30, and transfers ₹120 to TEJAS. The server calculates that amount. This form does not order printed books or charge the ₹49 e-book.">
        <div className="overflow-x-auto rounded-xl border border-tejas-border">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">Published fee shares</caption>
            <thead className="bg-tejas-ivory text-tejas-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Particulars</th>
                <th className="px-4 py-3 font-semibold">Gross amount</th>
                <th className="px-4 py-3 font-semibold">School share</th>
                <th className="px-4 py-3 font-semibold">Payable to TEJAS</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-tejas-border">
                <th className="px-4 py-3 font-medium text-tejas-ink">Registration fee</th>
                <td className="px-4 py-3">₹150 per student per stream</td>
                <td className="px-4 py-3">₹30</td>
                <td className="px-4 py-3 font-semibold">₹120</td>
              </tr>
            </tbody>
          </table>
        </div>
        {fee ? (
          <dl className="divide-y divide-tejas-border rounded-xl border border-tejas-border">
            {[
              ["Student-stream registrations", String(fee.studentStreamRegistrations)],
              ["Total registration fee collected", inr.format(fee.totalStudentFees)],
              ["School's registration share", inr.format(fee.registrationSchoolShare ?? 0)],
              ["Registration amount payable to TEJAS", inr.format(fee.registrationPayable ?? fee.payableToTejas)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt>{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 bg-tejas-blue px-4 py-3 text-white">
              <dt className="font-semibold">Final net amount payable to TEJAS</dt>
              <dd className="text-lg font-bold">{inr.format(fee.amountDue ?? fee.payableToTejas)}</dd>
            </div>
          </dl>
        ) : (
          <p className="rounded-xl border border-dashed border-tejas-border px-4 py-3 text-sm text-tejas-muted">
            {"Check the student sheet to see this school's registration fee calculated on the server."}
          </p>
        )}
        <p className="text-sm text-tejas-muted">The school collects ₹150 for each student-stream, retains ₹30, and transfers ₹120 to the school-registration account. The school share stays with the school. It is not an additional payment. This form does not charge the ₹49 e-book and does not order printed books. <Link href="/prepare/ebook" className="font-semibold text-tejas-blue underline">E-book publication status</Link>.</p>
        <div className="rounded-xl border border-tejas-warning/30 bg-tejas-warning/10 p-4">
          <h3 className="text-base font-bold text-tejas-blue">{payment?.heading ?? "Official payment account"}</h3>
          <p className="mt-2 text-sm text-tejas-muted">{payment?.message ?? "These are the official account details. Payment-proof submission will open once the secure payment system is operational."}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {([
              ["Account holder's name", REGISTRATION_BANK.accountHolder, false],
              ["Account number", REGISTRATION_BANK.accountNumber, true],
              ["Bank", REGISTRATION_BANK.bankName, false],
              ["Branch", REGISTRATION_BANK.branch, false],
              ["IFSC code", REGISTRATION_BANK.ifsc, true],
            ] as const).map(([label, value, canCopy]) => (
              <div key={label} className="rounded-xl bg-white p-3">
                <dt className="text-xs text-tejas-muted">{label}</dt>
                <dd className="mt-1 break-all text-base font-semibold text-tejas-ink">{value}</dd>
                {canCopy ? (
                  <button type="button" className="mt-2 min-h-11 text-sm font-semibold text-tejas-blue underline" onClick={() => copyValue(label, value)}>
                    {copied === label ? "Copied" : "Copy"}
                  </button>
                ) : null}
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-tejas-muted">
            {payment?.proofsAccepted
              ? "Submit the registration first. The confirmation page then accepts a JPG, PNG, or PDF proof for this reference. Uploading the proof does not verify the payment."
              : "Do not attach a receipt on this form."}
          </p>
        </div>
      </Section>

      <Section step="07 · Submit" title="Final submission" icon={Send} hint="Submit once. If the request times out, stay on this page and try again. A repeat uses the same submission and does not create a second registration.">
        {formErrors.map((error) => (
          <p key={error} className="text-sm text-red-700">{error}</p>
        ))}
        <button
          type="submit"
          disabled={busy !== null}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-tejas-saffron px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-tejas-saffron-dark disabled:opacity-60 sm:w-auto"
        >
          {busy === "submit" ? "Submitting…" : "Submit registration"}
        </button>
      </Section>
    </form>
  );
}
