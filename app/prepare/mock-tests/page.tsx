import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { OlympiadCard } from "@/components/shared/OlympiadCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { olympiads } from "@/data/olympiads";

export const metadata = createMetadata({
  title: "Mock Tests",
  description: "Practice information for TEJAS streams. The online examination is not confirmed and this page does not start a test.",
  path: "/prepare/mock-tests",
});

export default function MockTestsPage() {
  return (
    <>
      <PageHero
        eyebrow="Mock Tests"
        title="Mock tests are not open"
        subtitle="This page does not start a test, show scores, or run an online examination. The published examination dates stay 9, 10, and 11 December 2026."
        primaryCta={{ label: "Prepare Hub", href: "/prepare" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader
              title="Choose Your Subject"
              subtitle="Subject pages describe the streams. A question bank, timer, and result calculation are not published, and the online examination stays off until it is approved."
            />
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {olympiads.map((o, i) => (
              <FadeIn key={o.slug} delay={i * 0.04}>
                <OlympiadCard {...o} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
