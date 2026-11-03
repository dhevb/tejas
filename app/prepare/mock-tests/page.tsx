import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { OlympiadCard } from "@/components/shared/OlympiadCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { olympiads } from "@/data/olympiads";

export const metadata = createMetadata({
  title: "Mock Tests",
  description: "No mock test is published for TEJAS Olympiad 2026–27. The December examinations are offline at participating schools.",
  path: "/prepare/mock-tests",
});

export default function MockTestsPage() {
  return (
    <>
      <PageHero
        eyebrow="Mock Tests"
        title="Online mock tests are not open yet"
        subtitle="No mock test is published. This page does not start a test, show a score, or run an examination. The examinations on 9, 10, and 11 December 2026 are offline, at the participating schools."
        primaryCta={{ label: "Prepare Hub", href: "/prepare" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader
              title="Choose Your Subject"
              subtitle="Subject pages describe the streams. Online mock tests are being worked on and are not available here."
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
