import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import Link from "next/link";
import { Lightbulb, Rocket, Award } from "lucide-react";

export const metadata = createMetadata({
  title: "Innovation",
  description: "An Innovation Olympiad has not been announced for TEJAS Olympiad 2026–27. The open technology stream is TEJAS Future Tech.",
  path: "/innovation",
});

const pillars = [
  {
    icon: Lightbulb,
    title: "Not announced",
    description: "An Innovation Olympiad is not one of the three streams open for TEJAS Olympiad 2026–27.",
  },
  {
    icon: Rocket,
    title: "TEJAS Future Tech",
    description: "The open technology stream is TEJAS Future Tech, examined on 11 December 2026 for Classes VI–X.",
  },
  {
    icon: Award,
    title: "No innovation award list",
    description: "The Hall of Fame does not yet list an innovation award. Names on that page are from the 1st DHE English Olympiad in 2025.",
  },
];

export default function InnovationPage() {
  return (
    <>
      <PageHero
        eyebrow="TEJAS Innovation"
        title="Innovation Ecosystem"
        subtitle="An Innovation Olympiad has not been announced. TEJAS Future Tech is the open technology stream."
        primaryCta={{ label: "TEJAS Future Tech", href: "/olympiads/technology" }}
        secondaryCta={{ label: "Hall of Fame", href: "/hall-of-fame" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="What this page can say" subtitle="No Innovation examination, syllabus, or award list has been published." />
          <div className="grid gap-8 md:grid-cols-3">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <FadeIn key={p.title} delay={i * 0.08}>
                  <article className="rounded-2xl border border-stone-200 p-6">
                    <Icon className="h-8 w-8 text-tejas-saffron" aria-hidden />
                    <h3 className="mt-4 font-bold text-tejas-ink">{p.title}</h3>
                    <p className="mt-2 text-sm text-tejas-muted leading-relaxed">{p.description}</p>
                  </article>
                </FadeIn>
              );
            })}
          </div>
          <FadeIn delay={0.2}>
            <div className="mt-16 rounded-2xl bg-gradient-to-br from-tejas-saffron to-tejas-saffron-dark p-8 text-white">
              <h2 className="text-xl font-bold">TEJAS Future Tech</h2>
              <p className="mt-3 text-white/90 leading-relaxed">
                TEJAS Future Tech is one of the three streams in TEJAS Olympiad 2026–27, examined on 11 December 2026.
                An Innovation Olympiad has not been announced.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link href="/olympiads/technology" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-tejas-saffron">
                  TEJAS Future Tech
                </Link>
                <Link href="/olympiads/innovation" className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                  Innovation (Coming Soon)
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
