import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { EditionCard } from "@/components/shared/EditionCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { previousEditions } from "@/data/editions";

export const metadata = createMetadata({
  title: "Previous Editions",
  description: "Archive of past TEJAS and DHE Olympiad editions — including the 1st DHE English Olympiad (2025).",
  path: "/editions/previous",
});

export default function PreviousEditionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Archive"
        title="Previous Editions"
        subtitle="From the maiden DHE English Olympiad (10,040 students, 25 schools) to the foundations of TEJAS."
        primaryCta={{ label: "Current Editions", href: "/editions" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {previousEditions.map((edition, i) => (
              <FadeIn key={edition.slug} delay={i * 0.1}>
                <article className="rounded-2xl border border-stone-200 bg-white p-8 shadow-tejas">
                  <EditionCard
                    year={edition.year}
                    name={edition.name}
                    subtitle={edition.subtitle}
                    theme={edition.theme}
                    status="past"
                    href={`/editions/${edition.slug}`}
                  />
                  <p className="mt-6 text-tejas-muted">{edition.bio}</p>
                  <Link href={`/editions/${edition.slug}`} className="mt-4 inline-block text-sm font-semibold text-tejas-saffron">View edition</Link>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
