import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import { FeatureGrid } from "@/components/shared/FeatureGrid";
import { QuoteCard } from "@/components/shared/QuoteCard";
import { TejasEmblem } from "@/components/brand/TejasEmblem";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { siteConfig } from "@/config/seo";
import { brand } from "@/design-system/tokens";
import { programme } from "@/content/current-cycle";
import { BookOpen, CalendarDays, Shield, Award, Users, Mail } from "lucide-react";

export const metadata = createMetadata({
  title: "About TEJAS",
  description: "TEJAS — Talent Exploration for Junior Aspiring Scholars. TEJAS Olympiad 2026–27 by the Department of Holistic Education.",
  path: "/about",
});

const pillars = [
  {
    icon: BookOpen,
    title: "Three streams",
    description: "English and Mathematics are for Classes III–X. Future Tech is for Classes VI–X.",
  },
  {
    icon: CalendarDays,
    title: "Examination dates",
    description: "Mathematics 9 December 2026, English 10 December 2026, and Future Tech 11 December 2026.",
  },
  {
    icon: Shield,
    title: "Offline OMR examinations",
    description: "The 2026–27 examinations are held at participating schools with question papers and OMR sheets. They are not online examinations.",
  },
  {
    icon: Award,
    title: "Announced prizes",
    description: programme.awards,
  },
  {
    icon: Users,
    title: "Registration through schools",
    description: "Schools register their students from 3 November 2026 to 20 November 2026. The school collects ₹150, retains ₹30, and remits ₹120.",
  },
  {
    icon: Mail,
    title: "Contact",
    description: "Write to tejas@dhe.org.in, or call +91 99886 90588 or +91 79034 31900.",
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
        subtitle={`${brand.fullName}. TEJAS Olympiad 2026–27 is organised by the ${brand.parentOrg}, Vidya Bharti Institute of Training & Research Trust (VBITR), Kurukshetra.`}
        primaryCta={{ label: "Explore Olympiads", href: "/olympiads" }}
        secondaryCta={{ label: "School registration", href: "/schools/register" }}
      />

      <section className="tejas-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex items-start gap-6">
              <TejasEmblem size="lg" />
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-tejas-ink">The programme</h2>
                <p className="mt-4 text-lg text-tejas-muted leading-relaxed">
                  TEJAS means {brand.fullName}. The current programme is TEJAS Olympiad 2026–27, organised by the {brand.parentOrg}, Vidya Bharti Institute of Training & Research Trust (VBITR), Kurukshetra.
                </p>
                <p className="mt-4 text-lg text-tejas-muted leading-relaxed">
                  The 1st DHE English Olympiad was a separate examination on 13–16 October 2025 under Shiksha Mahakumbh 5th Edition. The 2025 report records 10,040 students from 25 schools. Those figures are not the 2026–27 figures.
                </p>
                <p className="mt-4 text-lg text-tejas-muted leading-relaxed">
                  The brochure says TEJAS is a long-term platform for identifying and nurturing young learners, administered by the Department of Holistic Education under the guidance and support of Vidya Bharti – North Zone. {programme.posterLaunch}
                </p>
                <p className="mt-4 text-lg text-tejas-muted leading-relaxed">
                  The 2025 report says the Department was founded in 2021 under Vidya Bharti Punjab and scaled nationally in 2023 under VBITR, and that the Olympiad Cell is one of 25 working cells. The brochure names Shiksha Mahakumbh Abhiyan among the Department’s flagship initiatives and refers to the National Education Policy 2020.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="tejas-section bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader title="What this edition states" subtitle="Only the approved programme details are stated here." />
          </FadeIn>
          <FeatureGrid items={pillars} columns={3} />
        </div>
      </section>

      <section className="tejas-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeader title="Examinations" subtitle="Offline, at the participating schools." />
            <ul className="mt-6 space-y-3 text-tejas-muted">
              <li>Mathematics: 9 December 2026, Classes III–X.</li>
              <li>English: 10 December 2026, Classes III–X.</li>
              <li>Future Tech: 11 December 2026, Classes VI–X.</li>
              <li>{programme.results}</li>
              <li>{programme.posterLaunch}</li>
              <li>{programme.guidance}</li>
            </ul>
          </FadeIn>
        </div>
      </section>

      <section className="tejas-section bg-tejas-blue text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <QuoteCard
              quote={programme.tagline}
              author={programme.name}
              role={`${programme.organiser} · ${programme.affiliation}`}
              className="max-w-4xl mx-auto border-white/10 bg-white/5 [&_p]:text-white/90 [&_span]:text-tejas-gold"
            />
          </FadeIn>
        </div>
      </section>

      <section className="tejas-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <FadeIn>
              <h2 className="text-2xl font-bold text-tejas-ink">Announced prizes</h2>
              <p className="mt-4 text-tejas-muted leading-relaxed">{programme.awards}</p>
              <p className="mt-3 text-tejas-muted leading-relaxed">{programme.brochureAwards}</p>
              <p className="mt-3 text-tejas-muted leading-relaxed">{programme.awardNote}</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-2xl font-bold text-tejas-ink">For schools</h2>
              <ul className="mt-4 space-y-3 text-tejas-muted">
                <li>Registration opens on 3 November 2026 and closes on 20 November 2026.</li>
                <li>The school collects ₹150 per student per stream, retains ₹30, and remits ₹120 to TEJAS.</li>
                <li>Printed books are optional at ₹170. The school retains ₹34 and remits ₹136.</li>
                <li>The invitation says e-books will be made available at ₹49 per student login. Access is not open yet, and the form does not charge ₹49.</li>
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
