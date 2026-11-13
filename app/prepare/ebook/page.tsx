import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import Link from "next/link";

export const metadata = createMetadata({
  title: "E-book access",
  description: "Student e-book access is a separate portal. School registration does not charge the e-book fee.",
  path: "/prepare/ebook",
});

export default function EbookPage() {
  return (
    <>
      <PageHero
        eyebrow="E-book"
        title="Student e-book access"
        subtitle="The e-book and its mock tests are opened from the student portal for the stream and class saved at registration. School registration does not charge the ₹49 fee."
        primaryCta={{ label: "Open the student portal", href: "/learn" }}
      />
      <section className="py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-sm leading-relaxed text-tejas-ink sm:px-6">
          <p>Future Tech Book 1 and Book 2 are loaded and awaiting organisational approval. English and Mathematics files have not been supplied. Unpublished material is not offered as if it were ready.</p>
          <p>Reading and mock tests stay locked until payment is verified and the item is published. The server checks the account stream, class and entitlement on every request.</p>
          <Link href="/schools/register" className="inline-flex font-semibold text-tejas-blue underline">School registration</Link>
        </div>
      </section>
    </>
  );
}
