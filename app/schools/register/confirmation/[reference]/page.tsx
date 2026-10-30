import Link from "next/link";
import { notFound } from "next/navigation";
import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { referenceIsValid } from "@/lib/registration/reference";
import { readRegistration, toPublicSummary } from "@/lib/registration/store";

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
    <>
      <PageHero eyebrow="Registration received" title={summary.reference} subtitle={summary.schoolName} />
      <section className="py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-sm text-tejas-ink sm:px-6">
          <p>{summary.studentCount} students. {summary.studentStreamRegistrations} student-stream registrations.</p>
          <p>Registration amount: {inr.format(summary.totalStudentFees)}. Printed books: {inr.format(summary.printedBookAmount)}. E-book access: {inr.format(summary.ebookAmount)}. Amount due: {inr.format(summary.amountDue)}.</p>
          <p>A school share has not been approved and is not deducted.</p>
          <p className="font-semibold">{summary.paymentLabel}</p>
          <p>{summary.nextStep}</p>
          <Link href="/schools/register" className="inline-flex font-semibold text-tejas-blue underline">Back to the form</Link>
        </div>
      </section>
    </>
  );
}
