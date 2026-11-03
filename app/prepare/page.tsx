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
        subtitle="A syllabus, sample paper, mock test, and e-book have not been published for TEJAS Olympiad 2026–27."
        primaryCta={{ label: "Mock test status", href: "/prepare/mock-tests" }}
        secondaryCta={{ label: "School registration", href: "/schools/register" }}
      />
      <section className="tejas-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <ul className="space-y-4 text-tejas-muted leading-relaxed">
              <li>Printed preparation books are optional at ₹170 per copy. The school retains ₹34 and remits ₹136 to TEJAS.</li>
              <li>A school may participate without ordering books.</li>
              <li>The invitation mentions an e-book at ₹49. E-book sales are closed, and no login is available. This website does not charge ₹49.</li>
              <li>The examinations are offline at the participating schools. This page does not start a test.</li>
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
