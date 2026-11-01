import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { BentoGrid, BentoItem } from "@/components/shared/BentoGrid";
import { FadeIn } from "@/components/shared/FadeIn";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { prepareCategories } from "@/data/resources";
import { cn } from "@/lib/utils";

export const metadata = createMetadata({
  title: "Prepare Hub",
  description: "Netflix-style preparation hub — mock tests, practice sets, videos, and question banks.",
  path: "/prepare",
});

const trending = ["Mathematics Mock", "Science Practice", "English Comprehension"];
const recommended = ["Grade 10 Full Test", "Innovation Track", "Coding Logic Set"];

export default function PreparePage() {
  return (
    <>
      <PageHero
        eyebrow="Prepare"
        title="Netflix for Learning"
        subtitle="Mock tests, practice sets, videos, and more — curated for every learner."
        primaryCta={{ label: "Start Mock Test", href: "/prepare/mock-tests" }}
        secondaryCta={{ label: "Resources", href: "/resources" }}
      />

      <section className="tejas-section bg-tejas-blue text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-widest text-tejas-gold">Continue Learning</p>
            <h2 className="mt-2 text-2xl font-bold">Pick up where you left off</h2>
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
              {trending.map((t) => (
                <div key={t} className="shrink-0 rounded-xl bg-white/10 px-6 py-4 backdrop-blur-sm border border-white/10">
                  <p className="font-semibold">{t}</p>
                  <p className="text-xs text-white/60 mt-1">65% complete</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="tejas-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader title="Browse Categories" subtitle="Everything you need to excel." />
          </FadeIn>
          <BentoGrid>
            {prepareCategories.map((cat, i) => (
              <FadeIn key={cat.id} delay={i * 0.05}>
                <BentoItem href={cat.href} span={i === 0 ? "wide" : undefined}>
                  <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br rounded-2xl", cat.gradient)} aria-hidden />
                  <div className="relative">
                    <h3 className="text-xl font-bold text-tejas-ink">{cat.title}</h3>
                    <p className="mt-2 text-sm text-tejas-muted">{cat.description}</p>
                    <p className="mt-4 text-3xl font-bold text-tejas-saffron">{cat.count}+</p>
                  </div>
                </BentoItem>
              </FadeIn>
            ))}
          </BentoGrid>
        </div>
      </section>

      <section className="tejas-section bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <FadeIn>
              <h2 className="text-2xl font-bold text-tejas-ink">Trending Now</h2>
              <ul className="mt-4 space-y-3">
                {trending.map((t, i) => (
                  <li key={t} className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4">
                    <span className="text-2xl font-bold text-tejas-saffron/40">{i + 1}</span>
                    <span className="font-medium">{t}</span>
                    <Badge variant="success" className="ml-auto">Hot</Badge>
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-2xl font-bold text-tejas-ink">Recommended for You</h2>
              <ul className="mt-4 space-y-3">
                {recommended.map((r) => (
                  <li key={r} className="rounded-xl border border-stone-200 bg-white p-4 font-medium text-tejas-ink">
                    {r}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
