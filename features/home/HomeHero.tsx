"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EditionCard } from "@/components/shared/EditionCard";
import { HeroIllustration } from "@/components/shared/HeroIllustration";
import { BackgroundPattern } from "@/components/shared/BackgroundPattern";
import { MetricCard } from "@/components/shared/MetricCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { getCurrentEdition } from "@/data/editions";
import { impactMetrics } from "@/data/metrics";
import { brand } from "@/design-system/tokens";
import { brandContent } from "@/content/brand";
import { useI18n } from "@/lib/i18n/context";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function HomeHero() {
  const edition = getCurrentEdition();
  const { t } = useI18n();
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative min-h-[90vh] overflow-hidden flex items-center">
      <BackgroundPattern variant="copper" />
      <BackgroundPattern variant="mandala" className="opacity-40" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
        <FadeIn>
          <p className="inline-flex items-center gap-2 rounded-full border border-tejas-saffron/20 bg-tejas-saffron-soft/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-tejas-saffron">
            {t(brandContent.ecosystem)}
          </p>

          <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight text-tejas-blue md:text-6xl lg:text-7xl">
            {brand.name}
          </h1>

          <p className="mt-3 text-xl font-semibold text-tejas-ink md:text-2xl">{brand.fullName}</p>
          <p className="mt-1 font-hindi text-lg text-tejas-muted">{brand.fullNameHi}</p>
          <p className="mt-2 text-sm font-medium text-tejas-saffron">{t(brandContent.ecosystem)}</p>

          <p className="mt-6 max-w-xl text-lg text-tejas-muted leading-relaxed">
            {t(brandContent.taglineLong)}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/about">
              <Button size="lg" className="group shadow-tejas-lg">
                Explore TEJAS
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </Button>
            </Link>
            <Link href="/olympiads">
              <Button variant="outline" size="lg">
                Olympiads
              </Button>
            </Link>
          </div>

          <p className="mt-6 font-hindi text-sm text-tejas-muted">{brand.taglineHi}</p>
        </FadeIn>

        <FadeIn delay={0.15} className="relative">
          <HeroIllustration />
          <div className="relative z-10 mx-auto -mt-10 max-w-sm">
            <EditionCard
              year={edition.year}
              name={edition.name}
              subtitle={edition.subtitle}
              theme={edition.theme}
              status={edition.status}
              featured
              href="/editions"
              className="mx-auto max-w-sm shadow-tejas-lg"
            />
          </div>
        </FadeIn>
      </div>

      {/* Floating stats strip */}
      <div className="relative border-t border-stone-200/60 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-3 lg:grid-cols-5 lg:px-8">
          {impactMetrics.slice(0, 5).map((m, i) => (
            <FadeIn key={m.label} delay={i * 0.05}>
              <MetricCard {...m} className="border-0 shadow-none bg-transparent py-2" />
            </FadeIn>
          ))}
        </div>
      </div>

      {!reduced && (
        <motion.div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-1 text-tejas-muted"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown className="h-4 w-4" aria-hidden />
        </motion.div>
      )}
    </section>
  );
}
