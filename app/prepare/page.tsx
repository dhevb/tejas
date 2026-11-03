import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata = createMetadata({
  title: "Prepare",
  description: "Preparation material for TEJAS Olympiad 2026–27. Printed books and e-books are separate from Olympiad registration.",
  path: "/prepare",
});

export default function PreparePage() {
  return (
    <>
      <PageHero
        eyebrow="Prepare"
        title="Preparation material"
        subtitle="Mock tests are still being prepared. Printed books and e-books have their own forms. No syllabus or sample paper has been published."
        primaryCta={{ label: "Mock test status", href: "/prepare/mock-tests" }}
        secondaryCta={{ label: "School registration", href: "/schools/register" }}
      />
      <section className="tejas-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <ul className="space-y-4 text-tejas-muted leading-relaxed">
              <li>Printed books are a separate order at ₹170 per copy. The school may retain ₹34 and remits ₹136. <Link href="/books/order" className="font-semibold text-tejas-blue underline">Open the printed book order</Link>.</li>
              <li>A school may take part in the Olympiad without ordering books.</li>
              <li>E-book registration is separate at ₹49 per student. <Link href="/ebook/register" className="font-semibold text-tejas-blue underline">Register</Link> or <Link href="/ebook/login" className="font-semibold text-tejas-blue underline">sign in</Link>. No e-book file has been supplied, so reading cannot open a book yet.</li>
              <li>The invitation says the team is working towards online mock tests. This page does not start a test. The examinations are offline at the participating schools.</li>
              <li><Link href="/documents" className="font-semibold text-tejas-blue underline">Official brochure and invitation</Link></li>
            </ul>
            <p className="mt-8 text-sm">
              <Link href="/olympiads" className="font-semibold text-tejas-saffron hover:underline">View the three active streams</Link>
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
