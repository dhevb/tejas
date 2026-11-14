import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { PublicationStatus } from "@/components/portal/PublicationStatus";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "E-book access",
  description: "Future Tech e-books open from the student portal after payment is verified. English and Mathematics files have not been supplied.",
  path: "/prepare/ebook",
});

export default function EbookPage() {
  return (
    <>
      <PageHero
        eyebrow="E-book"
        title="Student e-book access"
        subtitle="E-books and their mock tests open from the student portal for the stream and class saved at registration. School registration does not charge the e-book fee."
        primaryCta={{ label: "Open the student portal", href: "/learn" }}
      />
      <section className="py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-sm leading-relaxed text-tejas-ink sm:px-6">
          <PublicationStatus />
          <p>English and Mathematics e-book files have not been supplied. Unpublished material is not offered as if it were ready.</p>
          <p>The server checks the account stream, class, publication status, and entitlement on every request.</p>
          <Link href="/schools/register" className="inline-flex font-semibold text-tejas-blue underline">School registration</Link>
        </div>
      </section>
    </>
  );
}
