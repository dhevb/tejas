import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { OlympiadCard } from "@/components/shared/OlympiadCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { olympiads, getActiveOlympiads } from "@/data/olympiads";

export const metadata = createMetadata({
  title: "Olympiads",
  description: "TEJAS English and TEJAS Mathematics for Classes III–X, and TEJAS Future Tech for Classes VI–X, in TEJAS Olympiad 2026–27.",
  path: "/olympiads",
});

export default function OlympiadsPage() {
  const active = getActiveOlympiads();
  const comingSoon = olympiads.filter((o) => o.status === "coming-soon");

  return (
    <>
      <PageHero
        eyebrow="Olympiads"
        title="TEJAS Olympiad 2026–27"
        subtitle="TEJAS English and Mathematics for Classes III–X. TEJAS Future Tech for Classes VI–X. Registration 3–20 November 2026."
        primaryCta={{ label: "School registration", href: "/schools/register" }}
        secondaryCta={{ label: "Prepare Hub", href: "/prepare" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader
              eyebrow="TEJAS Olympiad 2026–27"
              title="Active Olympiad Streams"
              subtitle="Mathematics 9 December, English 10 December, Future Tech 11 December 2026. Examinations are offline at the participating schools."
            />
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((o, i) => (
              <FadeIn key={o.slug} delay={i * 0.04}>
                <OlympiadCard {...o} status="active" registrationOpen={false} />
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.1}>
            <SectionHeader
              className="mt-20"
              eyebrow="Not this edition"
              title="Not part of 2026–27"
              subtitle="These subjects have not been announced for TEJAS Olympiad 2026–27. They are not open for registration."
            />
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {comingSoon.map((o, i) => (
              <FadeIn key={o.slug} delay={i * 0.04}>
                <OlympiadCard {...o} status="coming-soon" registrationOpen={false} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
