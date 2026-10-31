import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import Link from "next/link";

export const metadata = createMetadata({
  title: "E-book access",
  description: "E-book files and student logins are not available for TEJAS Olympiad 2026–27.",
  path: "/prepare/ebook",
});

export default function EbookPage() {
  return (
    <>
      <PageHero
        eyebrow="E-book"
        title="E-book access is not available"
        subtitle="No e-book file is published, and no student login is created. The registration form does not charge the ₹49 e-book fee."
      />
      <section className="py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-sm text-tejas-ink sm:px-6">
          <p>There is no download on this page, and there is no password to create.</p>
          <Link href="/schools/register" className="inline-flex font-semibold text-tejas-blue underline">School registration</Link>
        </div>
      </section>
    </>
  );
}
