import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata = createMetadata({
  title: "Innovation",
  description: "TEJAS Olympiad 2026–27 does not include a separate innovation Olympiad. Future Tech is Classes VI–X and is examined offline.",
  path: "/innovation",
});

export default function InnovationPage() {
  return (
    <>
      <PageHero
        eyebrow="Innovation"
        title="Innovation"
        subtitle="No separate innovation Olympiad, award, or project expo has been announced for TEJAS Olympiad 2026–27."
        primaryCta={{ label: "TEJAS Future Tech", href: "/olympiads/technology" }}
        secondaryCta={{ label: "2025 Hall of Fame", href: "/hall-of-fame" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-tejas-muted leading-relaxed">
              TEJAS Future Tech is the technology stream. It is for Classes VI–X and is examined offline with OMR sheets on 11 December 2026. It is not a computer-based examination. A syllabus has not been published.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
