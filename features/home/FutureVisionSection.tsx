import { QuoteCard } from "@/components/shared/QuoteCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import { brandContent } from "@/content/brand";

export function FutureVisionSection() {
  return (
    <section className="tejas-section bg-tejas-blue text-white relative overflow-hidden">
      <div className="absolute inset-0 tejas-mandala opacity-20 pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            eyebrow="Vision"
            title="Building Bharat's Talent Future"
            subtitle="A national movement for talent, research, innovation, and nation building."
            className="[&_h2]:text-white [&_p]:text-white/70"
          />
        </FadeIn>
        <FadeIn delay={0.1}>
          <QuoteCard
            quote={brandContent.vision.en}
            quoteHi={brandContent.vision.hi}
            author="TEJAS Vision"
            role="Department of Holistic Education · Olympiad Cell"
            className="max-w-4xl mx-auto border-white/10 bg-white/5 text-white [&_p]:text-white/90 [&_span]:text-tejas-gold"
          />
        </FadeIn>
      </div>
    </section>
  );
}
