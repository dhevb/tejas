import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import { FeatureGrid } from "@/components/shared/FeatureGrid";
import { QuoteCard } from "@/components/shared/QuoteCard";
import { PhaseRoadmap } from "@/components/shared/PhaseRoadmap";
import { TejasEmblem } from "@/components/brand/TejasEmblem";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { siteConfig } from "@/config/seo";
import { brand } from "@/design-system/tokens";
import { brandContent } from "@/content/brand";
import { BookOpen, Brain, Shield, Lightbulb, Users, FlaskConical } from "lucide-react";
import Link from "next/link";

export const metadata = createMetadata({
  title: "About TEJAS",
  description: "TEJAS — Talent Exploration for Junior Aspiring Scholars. TEJAS Olympiad 2026–27 by the Department of Holistic Education.",
  path: "/about",
});

const pillars = [
  {
    icon: BookOpen,
    title: "Bharatiya Knowledge + Modern Education",
    description: "Integrating contemporary education with rich knowledge traditions, ethical values, and life skills.",
  },
  {
    icon: Brain,
    title: "Concept-Based Assessment",
    description: "Logical reasoning, analytical thinking, creativity, and real-world application — not rote memorization.",
  },
  {
    icon: Shield,
    title: "Secure Technology-Enabled Exams",
    description: "OMR and digital modes with transparent, fair, and credible examination standards.",
  },
  {
    icon: Lightbulb,
    title: "Innovation & Entrepreneurship",
    description: "Inspiring job creators — nurturing future innovators and entrepreneurs.",
  },
  {
    icon: Users,
    title: "Opportunities for Schools",
    description: "National platforms for innovation, mentorship, and collaboration with premier institutions.",
  },
  {
    icon: FlaskConical,
    title: "Bal Shodh Patrika",
    description: "Children's research journal for Classes 9–12 — nurturing curiosity and scientific inquiry.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", url: siteConfig.url },
            { name: "About TEJAS", url: `${siteConfig.url}/about` },
          ]),
        ]}
      />
      <PageHero
        eyebrow="About TEJAS"
        title={brand.name}
        subtitle={`${brand.fullName} — an independent initiative by the Olympiad Cell, ${brand.parentOrg}. Standalone. Long-term. National.`}
        primaryCta={{ label: "Explore Olympiads", href: "/olympiads" }}
        secondaryCta={{ label: "Register Interest", href: "/#register" }}
      />

      <section className="tejas-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex items-start gap-6">
              <TejasEmblem size="lg" />
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-tejas-ink">The Movement</h2>
                <p className="mt-4 text-lg text-tejas-muted leading-relaxed">{brandContent.movement.en}</p>
                <p className="mt-4 font-hindi text-tejas-muted">{brandContent.movement.hi}</p>
                <p className="mt-6 text-lg text-tejas-muted leading-relaxed">
                  While some activities were previously organized under the Shiksha Mahakumbh Abhiyan,
                  TEJAS is a <strong className="text-tejas-ink">standalone, long-term national initiative</strong> with
                  its own identity, vision, and mission — the flagship talent development platform of DHE.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="tejas-section bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader title="What Makes TEJAS Different?" subtitle="Beyond rankings and certificates — a comprehensive ecosystem." />
          </FadeIn>
          <FeatureGrid items={pillars} columns={3} />
        </div>
      </section>

      <section className="tejas-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader title="Product Roadmap" subtitle="Staged evolution from polished website to full national platform." />
          </FadeIn>
          <PhaseRoadmap />
          <FadeIn delay={0.1}>
            <p className="mt-6 text-sm text-tejas-muted">
              Backend architecture planning:{" "}
              <Link href="https://github.com/dheWeb/tejas/blob/main/docs/BACKEND_ARCHITECTURE.md" className="text-tejas-saffron hover:underline">
                docs/BACKEND_ARCHITECTURE.md
              </Link>
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="tejas-section bg-tejas-blue text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <QuoteCard
              quote={brandContent.vision.en}
              quoteHi={brandContent.vision.hi}
              author="Our Vision"
              role={`${brand.parentOrg} · Olympiad Cell`}
              className="max-w-4xl mx-auto border-white/10 bg-white/5 [&_p]:text-white/90 [&_span]:text-tejas-gold"
            />
          </FadeIn>
        </div>
      </section>

      <section className="tejas-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <FadeIn>
              <h2 className="text-2xl font-bold text-tejas-ink">For Outstanding Students</h2>
              <ul className="mt-4 space-y-3 text-tejas-muted">
                <li>National & international recognition through prestigious platforms</li>
                <li>Talent conclaves with scientists, innovators, and policymakers</li>
                <li>Entrepreneurship and innovation orientation pathways</li>
                <li>Scholarships and advanced learning opportunities</li>
              </ul>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-2xl font-bold text-tejas-ink">For Schools</h2>
              <ul className="mt-4 space-y-3 text-tejas-muted">
                <li>National platform for school innovation and excellence</li>
                <li>Project showcase and exhibition opportunities</li>
                <li>Collaboration with IITs, NITs, and research institutions</li>
                <li>Expert mentorship for educators and students</li>
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
