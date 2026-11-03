import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata = createMetadata({
  title: "Research",
  description: "TEJAS Olympiad 2026–27 has not published a research journal or submission process on this website.",
  path: "/research",
});

export default function ResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Research"
        title="Research"
        subtitle="No research paper, student journal, or submission guide for TEJAS Olympiad 2026–27 is published on this website."
        primaryCta={{ label: "Current Olympiad", href: "/olympiads" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-tejas-muted leading-relaxed">
              Details will be announced officially if a research activity is approved. This page does not accept submissions and does not state class ranges, deadlines, or a partner journal for the current Olympiad.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
