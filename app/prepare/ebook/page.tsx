import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { PublicationStatus } from "@/components/portal/PublicationStatus";
import { EBOOK_FEE } from "@/lib/registration/fee";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "E-book and mock tests",
  description:
    "Buy the TEJAS e-book and five mock tests for ₹49 per selected stream from the student portal after payment verification.",
  path: "/prepare/ebook",
});

export default function EbookPage() {
  return (
    <>
      <PageHero
        eyebrow="E-book & mock tests"
        title="₹49 per stream includes the e-book and five mock tests"
        subtitle="Access opens from the student portal for the streams you purchase. Printed-book orders are not offered in this release."
        primaryCta={{ label: "Open the student portal", href: "/learn" }}
      />
      <section className="py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-sm leading-relaxed text-tejas-ink sm:px-6">
          <PublicationStatus />
          <p>
            The approved price is ₹{EBOOK_FEE} for each selected eligible stream. One stream = one e-book + five mock tests.
            Two streams = ₹98. Three streams = ₹147. The server calculates the fee from the selected streams; the browser amount is not trusted.
          </p>
          <p>
            English and Mathematics class e-books are staged from the owner-supplied pack. Future Tech Books 1 and 2 remain available for their class groups.
            Mathematics Class 10 mock tests were not included in the supplied pack, so that class stays closed until the five mocks arrive.
          </p>
          <p>School Olympiad registration is separate and does not charge this e-book fee.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/learn/register" className="inline-flex font-semibold text-tejas-blue underline">
              Student portal registration
            </Link>
            <Link href="/schools/register" className="inline-flex font-semibold text-tejas-blue underline">
              School registration
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
