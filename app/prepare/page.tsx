import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { BentoGrid, BentoItem } from "@/components/shared/BentoGrid";
import { FadeIn } from "@/components/shared/FadeIn";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { prepareCategories } from "@/data/resources";
import { cn } from "@/lib/utils";

export const metadata = createMetadata({
  title: "Prepare Hub",
  description: "Where TEJAS preparation actually opens: the student portal for published Future Tech material, and the 2025 English archive.",
  path: "/prepare",
});

export default function PreparePage() {
  return (
    <>
      <PageHero
        eyebrow="Prepare"
        title="Preparation"
        subtitle="This page does not show a learner's progress. Published Future Tech e-books and mock tests open from the student portal after payment is verified. English and Mathematics files have not been supplied."
        primaryCta={{ label: "Student portal", href: "/learn" }}
        secondaryCta={{ label: "E-book status", href: "/prepare/ebook" }}
      />

      <section className="tejas-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader
              title="What is available"
              subtitle="Counts are omitted where this website does not have a published file or a live record."
            />
          </FadeIn>
          <BentoGrid>
            {prepareCategories.map((cat, i) => (
              <FadeIn key={cat.id} delay={i * 0.05}>
                <BentoItem href={cat.href} span={i === 0 ? "wide" : undefined}>
                  <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br rounded-2xl", cat.gradient)} aria-hidden />
                  <div className="relative">
                    <h3 className="text-xl font-bold text-tejas-ink">{cat.title}</h3>
                    <p className="mt-2 text-sm text-tejas-muted">{cat.description}</p>
                  </div>
                </BentoItem>
              </FadeIn>
            ))}
          </BentoGrid>
        </div>
      </section>
    </>
  );
}
