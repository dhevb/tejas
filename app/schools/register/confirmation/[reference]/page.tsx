import Link from "next/link";
import { notFound } from "next/navigation";
import { createMetadata } from "@/config/seo";
import { paymentProofsAccepted } from "@/lib/registration/durable";
import { referenceIsValid } from "@/lib/registration/reference";
import { readRegistration, toPublicSummary } from "@/lib/registration/store";
import { PaymentProofForm } from "../payment-proof-form";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Registration received",
  description: "School registration reference for TEJAS Olympiad 2026–27.",
  path: "/schools/register/confirmation",
  noIndex: true,
});

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default async function ConfirmationPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  if (!referenceIsValid(reference)) notFound();
  const record = await readRegistration(reference);
  if (!record) notFound();
  const summary = toPublicSummary(record);

  return (
    <section className="bg-tejas-ivory py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="space-y-4 rounded-3xl border border-tejas-border bg-white px-5 py-6 text-sm text-tejas-ink shadow-sm sm:px-8 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-tejas-saffron">Registration received</p>
          <h1 className="break-all text-2xl font-bold text-tejas-blue sm:text-3xl">{summary.reference}</h1>
          <p className="text-base leading-relaxed">The school registration for {summary.schoolName} has been received. Keep this reference for payment and any later enquiry.</p>
          <p>{summary.studentCount} students. {summary.studentStreamRegistrations} student-stream registrations.</p>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div><dt className="text-tejas-muted">Registration fee collected</dt><dd className="font-semibold">{inr.format(summary.totalStudentFees)}</dd></div>
            <div><dt className="text-tejas-muted">School registration share</dt><dd className="font-semibold">{inr.format(summary.registrationSchoolShare)}</dd></div>
            <div><dt className="text-tejas-muted">Registration payable to TEJAS</dt><dd className="font-semibold">{inr.format(summary.registrationPayable)}</dd></div>
            <div><dt className="text-tejas-muted">Printed books collected</dt><dd className="font-semibold">{inr.format(summary.printedBookAmount)}</dd></div>
            <div><dt className="text-tejas-muted">School book share</dt><dd className="font-semibold">{inr.format(summary.bookSchoolShare)}</dd></div>
            <div><dt className="text-tejas-muted">Books payable to TEJAS</dt><dd className="font-semibold">{inr.format(summary.bookPayable)}</dd></div>
            <div><dt className="text-tejas-muted">Combined gross amount</dt><dd className="font-semibold">{inr.format(summary.grossTotal)}</dd></div>
            <div><dt className="text-tejas-muted">Combined school share</dt><dd className="font-semibold">{inr.format(summary.schoolShare)}</dd></div>
          </dl>
          <p className="rounded-xl bg-tejas-blue px-4 py-3 text-base font-semibold text-white">Net amount payable to TEJAS: {inr.format(summary.amountDue)}</p>
          <p>The school retains the school share and transfers the net amount to the official account. The book amount is separate from the registration fee. This page does not mark books as dispatched or delivered.</p>
          <p>E-book access is not for sale, so no e-book fee is included.</p>
          {summary.schoolShareApproved ? null : <p>These amounts are the figures saved with this registration. They have not been recalculated.</p>}
          <p className="font-semibold">{summary.paymentLabel}</p>
          <p>{summary.nextStep}</p>
          {paymentProofsAccepted() && ["pending_instructions", "awaiting_payment", "rejected"].includes(summary.paymentStatus) ? (
            <PaymentProofForm reference={summary.reference} amountDue={summary.amountDue} />
          ) : null}
          <Link href="/schools/register" className="inline-flex font-semibold text-tejas-blue underline">Back to the form</Link>
        </div>
      </div>
    </section>
  );
}
