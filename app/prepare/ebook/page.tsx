import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import Link from "next/link";

export const metadata = createMetadata({
  title: "E-book access",
  description: "E-book access for TEJAS Olympiad 2026–27 is not active.",
  path: "/prepare/ebook",
});

export default function EbookPage() {
  return (
    <>
      <PageHero
        eyebrow="E-book"
        title="E-book access is not active"
        subtitle="The login fee is ₹49 per student and is kept separate from the registration fee. A login is not created, and preparation files are not published, until payment is verified and access is approved."
      />
      <section className="py-12">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-sm text-tejas-ink sm:px-6">
          <p>Schools choose yes or no on the registration form. Choosing yes records the fee. It does not open an account.</p>
          <p>There is no public download link on this page.</p>
          <Link href="/schools/register" className="inline-flex font-semibold text-tejas-blue underline">School registration</Link>
        </div>
      </section>
    </>
  );
}
