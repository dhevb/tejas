import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata = createMetadata({
  title: "Prepare",
  description: "Preparation material for TEJAS Olympiad 2026–27 has not been published. Mock tests and the e-book are not available.",
  path: "/prepare",
});

export default function PreparePage() {
  return (
    <>
      <PageHero
        eyebrow="Prepare"
        title="Preparation material"
        subtitle="The invitation says mock tests and e-books are being prepared. Neither is open on this website. No syllabus or sample paper has been published."
        primaryCta={{ label: "Mock test status", href: "/prepare/mock-tests" }}
        secondaryCta={{ label: "School registration", href: "/schools/register" }}
      />
      <section className="tejas-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <ul className="space-y-4 text-tejas-muted leading-relaxed">
              <li>Printed preparation books are optional at ₹170 per copy. The school retains ₹34 and remits ₹136 to TEJAS.</li>
              <li>A school may participate without ordering books.</li>
              <li>The invitation says e-books will be made available through student logins at ₹49 per student. No file or login is open yet, and this website does not charge ₹49.</li>
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
