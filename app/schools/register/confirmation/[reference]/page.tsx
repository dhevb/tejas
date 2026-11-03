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
          <p>Registration amount: {inr.format(summary.totalStudentFees)}. Printed books: {inr.format(summary.printedBookAmount)}. Amount due: {inr.format(summary.amountDue)}.</p>
          <p>The book amount is separate from the registration fee. Both are paid to the official account. This page does not mark books as dispatched or delivered.</p>
          <p>E-book access is not for sale, so no e-book fee is included.</p>
          <p>The amount due is the full registration amount plus any printed books. This registration does not deduct a separate school share from the amount paid to the official account.</p>
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
