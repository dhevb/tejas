import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { createMetadata } from "@/config/seo";
import { currentCycle } from "@/content/current-cycle";
import { SchoolRegistrationForm } from "./school-registration-form";

export const metadata = createMetadata({
  title: "School registration",
  description: "Register a school for TEJAS Olympiad 2026–27. Registration opens on 3 November 2026 and closes on 20 November 2026.",
  path: "/schools/register",
});

const steps = [
  ["1", "School details", "Name, address, principal, and coordinator"],
  ["2", "Student sheet", "Excel or CSV, with a stream for each student"],
  ["3", "Fee summary", "Server-calculated stream fees and printed books"],
  ["4", "Submit", "Receive a registration reference"],
] as const;

export default function SchoolRegisterPage() {
  return (
    <div className="bg-tejas-ivory">
      <section className="bg-tejas-blue text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tejas-gold">TEJAS Olympiad 2026–27</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">School Registration</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            Schools register their students. The school collects ₹150 per student per stream, retains ₹30, and remits ₹120 to TEJAS.
          </p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <dt className="text-xs font-semibold uppercase tracking-widest text-tejas-gold">Registration opens</dt>
              <dd className="mt-1 text-2xl font-bold">3 November 2026</dd>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <dt className="text-xs font-semibold uppercase tracking-widest text-tejas-gold">Registration closes</dt>
              <dd className="mt-1 text-2xl font-bold">20 November 2026</dd>
            </div>
          </dl>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/75">{currentCycle.examDates.en} The examinations are offline, at the participating schools.</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75">{currentCycle.administeredBy.en}. {currentCycle.officeAddress}.</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75">The invitation says the ₹30 retained by the school is for the conduct of the examination, including the supervisor’s remuneration. Printed books are not compulsory. The invitation says the school’s ₹34 share of a printed book is at the school’s discretion.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" aria-label="Registration steps">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, title, text]) => (
            <li key={n} className="rounded-2xl border border-tejas-border bg-white p-4 shadow-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-tejas-blue text-sm font-bold text-white">{n}</span>
              <p className="mt-3 font-semibold text-tejas-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-tejas-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-2 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-tejas-border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-tejas-blue">Examination arrangements</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-tejas-muted sm:grid-cols-2">
            <li>Examinations are offline, at the participating school, on the allotted date.</li>
            <li>Question papers and OMR sheets are sent in advance.</li>
            <li>Completed OMR sheets are couriered to the designated evaluation centre on the same day.</li>
            <li>The evaluation-centre address is shared with the examination instructions.</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <SchoolRegistrationForm />
        <aside className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-tejas-border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-tejas-blue">Registration support</h2>
            <p className="mt-2 text-sm leading-relaxed text-tejas-muted">
              Use these published contact details if the school needs help with the form or the student sheet.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-tejas-ink">
              {currentCycle.phones.map((phone) => (
                <li key={phone.tel} className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-tejas-saffron" aria-hidden />
                  <a className="font-semibold text-tejas-blue underline" href={`tel:${phone.tel}`}>{phone.display}</a>
                </li>
              ))}
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-tejas-saffron" aria-hidden />
                <a className="break-all font-semibold text-tejas-blue underline" href={`mailto:${currentCycle.olympiadEmail}`}>{currentCycle.olympiadEmail}</a>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-tejas-border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-tejas-blue">After you submit</h2>
            <p className="mt-2 text-sm leading-relaxed text-tejas-muted">
              The confirmation page shows the registration reference and the net amount payable to TEJAS. The school retains its share. Payment proof, when that step is open, is uploaded against that net amount. Submitting this form does not by itself mark a payment as verified.
            </p>
            <p className="mt-4 text-sm">
              <Link href="/schools/register/review" className="font-semibold text-tejas-blue underline">Staff review</Link>
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
