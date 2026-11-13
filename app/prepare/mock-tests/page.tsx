import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { OlympiadCard } from "@/components/shared/OlympiadCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { olympiads } from "@/data/olympiads";

export const metadata = createMetadata({
  title: "Mock Tests",
  description: "Mock tests included with an e-book open from the student portal after payment is verified and the test is published.",
  path: "/prepare/mock-tests",
});

export default function MockTestsPage() {
  return (
    <>
      <PageHero
        eyebrow="Mock Tests"
        title="Mock tests follow the e-book"
        subtitle="Mock tests included with an e-book open from the student portal, for the registered stream and class, after payment is verified and the test is published. This page does not start a test. The Olympiad examinations on 9, 10 and 11 December 2026 remain offline at the participating schools."
        primaryCta={{ label: "Student portal", href: "/learn" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader
              title="Choose Your Subject"
              subtitle="Subject pages describe the Olympiad streams. E-book mock tests are opened from the student portal for the registered stream and class."
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
