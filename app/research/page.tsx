import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ResourceCard } from "@/components/shared/ResourceCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { getResourcesByCategory } from "@/content/resources";
import Link from "next/link";

export const metadata = createMetadata({
  title: "Research",
  description: "TEJAS Research — Bal Shodh Patrika, student research papers, and academic inquiry under Olympiad Cell, DHE.",
  path: "/research",
});

export default function ResearchPage() {
  const research = getResourcesByCategory("research");
  const balShodh = getResourcesByCategory("bal-shodh");

  return (
    <>
      <PageHero
        eyebrow="TEJAS Research"
        title="Research & Inquiry"
        subtitle="Bal Shodh Patrika and student research pathways — nurturing young investigators from Classes 9–12."
        primaryCta={{ label: "Shiksha Mahakumbh", href: "https://www.shikshamahakumbh.com" }}
        secondaryCta={{ label: "All Resources", href: "/resources" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-2xl border border-stone-200 bg-tejas-ivory p-8">
              <h2 className="text-xl font-bold text-tejas-ink">Bal Shodh Patrika</h2>
              <p className="mt-3 text-tejas-muted leading-relaxed">
                National student research journal by Department of Holistic Education. Section 1 (Classes 9–10):
                basic research and project documentation. Section 2 (Classes 11–12): advanced research and analytical
                studies. A submission file is not hosted on this website.
              </p>
              <Link href="/resources" className="mt-4 inline-block text-sm font-semibold text-tejas-saffron hover:underline">
                Shiksha Mahakumbh link →
              </Link>
            </div>
          </FadeIn>

          {balShodh.length > 0 && (
            <>
              <SectionHeader className="mt-16" title="Bal Shodh Resources" />
              <div className="grid gap-6 sm:grid-cols-2">
                {balShodh.map((r, i) => (
                  <FadeIn key={r.id} delay={i * 0.05}>
                    <ResourceCard resource={{ id: r.id, title: r.title.en, type: r.type, subject: "Research", description: r.description.en, href: r.href }} />
                  </FadeIn>
                ))}
              </div>
            </>
          )}

          {research.length > 0 && (
            <>
              <SectionHeader className="mt-16" title="Research Papers" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {research.map((r, i) => (
                  <FadeIn key={r.id} delay={i * 0.05}>
                    <ResourceCard resource={{ id: r.id, title: r.title.en, type: r.type, subject: "Research", description: r.description.en, href: r.href }} />
                  </FadeIn>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
