import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import Link from "next/link";

export const metadata = createMetadata({
  title: "E-book access",
  description: "The invitation sets an e-book student login fee of ₹49. No e-book file or login is open yet.",
  path: "/prepare/ebook",
});

export default function EbookPage() {
  return (
    <>
      <PageHero
        eyebrow="E-book"
        title="E-book access is not open yet"
        subtitle="The invitation says e-books will be made available on this website through individual student logins, at ₹49 per student. No file or login is open, and the registration form does not charge ₹49."
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
