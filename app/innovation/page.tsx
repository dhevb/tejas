import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import Link from "next/link";
import { Lightbulb, Rocket, Award } from "lucide-react";

export const metadata = createMetadata({
  title: "Innovation",
  description: "TEJAS Innovation — student projects, design thinking, and innovation awards under Olympiad Cell, DHE.",
  path: "/innovation",
});

const pillars = [
  {
    icon: Lightbulb,
    title: "Design Thinking",
    description: "Problem identification, empathy mapping, and prototype development for school and community challenges.",
  },
  {
    icon: Rocket,
    title: "Student Projects",
    description: "Shiksha Mahakumbh Project Expo framework — Himachal-centric innovation with district pre-events and state finale.",
  },
  {
    icon: Award,
    title: "Innovation Awards",
    description: "TEJAS Hall of Fame Innovation category — recognising young innovators and deployable prototypes.",
  },
];

export default function InnovationPage() {
  return (
    <>
      <PageHero
        eyebrow="TEJAS Innovation"
        title="Innovation Ecosystem"
        subtitle="From classroom ideas to national recognition — TEJAS nurtures Bharat's young innovators."
        primaryCta={{ label: "Innovation Olympiad", href: "/olympiads/innovation" }}
        secondaryCta={{ label: "Hall of Fame", href: "/hall-of-fame" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Innovation Pillars" subtitle="Aligned with Viksit Bharat 2047 and DHE Innovation Cell." />
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
