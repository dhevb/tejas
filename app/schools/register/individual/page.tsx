import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { IndividualRegistrationForm } from "@/app/schools/register/individual/individual-form";
import { officialPublicPayment } from "@/lib/registration/official-bank";
import { paymentProofsAccepted } from "@/lib/registration/durable";
import Link from "next/link";

export const metadata = createMetadata({
  title: "Individual registration",
  description: "Register one student for TEJAS Olympiad 2026–27 at ₹150 per selected stream, payable in full to TEJAS.",
  path: "/schools/register/individual",
});

export default function IndividualRegistrationPage() {
  const payment = officialPublicPayment(paymentProofsAccepted());
  return (
    <>
      <PageHero
        eyebrow="Individual registration"
        title="Register one student"
        subtitle="₹150 per selected stream. There is no school share. The full amount is payable to TEJAS. Printed books are not offered in this release."
        primaryCta={{ label: "School registration", href: "/schools/register" }}
      />
      <section className="py-12">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
          <p className="text-sm leading-relaxed text-tejas-muted">
            Prefer school upload for many students? Use the{" "}
            <Link className="font-semibold text-tejas-blue underline" href="/schools/register">
              school registration form
            </Link>
            . E-book and mock-test access is a separate ₹49-per-stream purchase in the student portal.
          </p>
          <IndividualRegistrationForm payment={payment} />
        </div>
      </section>
    </>
  );
}
