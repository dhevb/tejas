import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { EditionHero } from "@/components/shared/EditionHero";
import { FadeIn } from "@/components/shared/FadeIn";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { editions } from "@/data/editions";
import { getCurrentEdition } from "@/data/editions";

export const metadata = createMetadata({
  title: "Current Editions",
  description: "TEJAS Olympiad 2026–27 and the record of the 1st DHE English Olympiad.",
  path: "/editions",
});

export default function EditionsPage() {
  const current = getCurrentEdition();

  return (
    <>
      <EditionHero
        year={current.year}
        name={current.name}
        subtitle={current.subtitle}
        theme={current.theme}
        bio={current.bio}
        accent={current.imageAccent}
        status={current.status}
        quote="Find your spark..."
      />
      <section className="tejas-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mb-8 rounded-2xl border border-tejas-saffron/30 bg-tejas-saffron/5 p-6">
              <p className="text-sm font-semibold text-tejas-saffron">TEJAS Olympiad 2026–27 · 6th Edition of Shiksha Mahakumbh</p>
              <p className="mt-2 text-tejas-muted">
                TEJAS English, TEJAS Mathematics, and TEJAS Future Tech for Classes III–X.
                Registration 1–20 November 2026. Fee ₹150 per student per stream.
              </p>
              <Link href={`/editions/${current.slug}`} className="mt-4 inline-block text-sm font-semibold text-tejas-saffron hover:underline">
                Explore {current.name} →
              </Link>
            </div>
          </FadeIn>
          <FadeIn>
            <SectionHeader
              title="On record"
              subtitle="The current Olympiad and the 2025 English Olympiad. Later named editions have not been announced."
            />
          </FadeIn>
          <div className="grid gap-8 md:grid-cols-2">
            {editions.filter((e) => e.slug !== current.slug).map((edition, i) => (
              <FadeIn key={edition.slug} delay={i * 0.08}>
                <Link href={`/editions/${edition.slug}`} className="block">
                  <article
                    className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-tejas-lg transition hover:-translate-y-1"
                    style={{ borderTopColor: edition.imageAccent, borderTopWidth: 4 }}
                  >
                    <div className="p-8">
                      <p className="text-4xl font-bold" style={{ color: edition.imageAccent }}>{edition.year}</p>
                      <h2 className="mt-2 text-xl font-bold text-tejas-ink">{edition.name}</h2>
                      <p className="text-sm font-medium text-tejas-saffron">{edition.subtitle}</p>
                      {edition.theme && (
                        <p className="mt-3 text-sm italic text-tejas-blue">&ldquo;{edition.theme}&rdquo;</p>
                      )}
                      <p className="mt-4 text-tejas-muted leading-relaxed">{edition.bio}</p>
                      <span className="mt-4 inline-block text-sm font-semibold text-tejas-saffron">View edition →</span>
                    </div>
                  </article>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
