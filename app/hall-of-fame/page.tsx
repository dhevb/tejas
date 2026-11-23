import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { HallOfFameCard } from "@/components/shared/HallOfFameCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ComingSoonCard } from "@/components/shared/ComingSoonCard";
import { hallOfFameCategories, getHallOfFameByCategory } from "@/data/hall-of-fame";

export const metadata = createMetadata({
  title: "Hall of Fame",
  description: "Recorded results of the 1st DHE English Olympiad, 2025. TEJAS Olympiad 2026–27 results have not been published.",
  path: "/hall-of-fame",
});

export default function HallOfFamePage() {
  const populated = hallOfFameCategories.filter((c) => getHallOfFameByCategory(c.id).length > 0);
  const upcoming = hallOfFameCategories.filter((c) => getHallOfFameByCategory(c.id).length === 0);

  return (
    <>
      <PageHero
        eyebrow="Legacy Archive"
        title="Hall of Fame"
        subtitle="These overall level results are from the 2025 report of the 1st DHE English Olympiad, examined on 13–16 October 2025. School-wise lists are in that report. They are not TEJAS Olympiad 2026–27 results."
        primaryCta={{ label: "2025 report", href: "/documents/dhe-english-olympiad-2025-brief-report.pdf" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {populated.map((cat, catIndex) => {
            const entries = getHallOfFameByCategory(cat.id);
            return (
              <div key={cat.id} className={catIndex === 0 ? "mt-20" : "mt-16"}>
                <FadeIn delay={0.05}>
                  <SectionHeader eyebrow="2025" title={cat.label.en} subtitle={cat.label.hi} />
                </FadeIn>
                <div className={`grid gap-6 ${cat.id === "national" ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"}`}>
                  {entries.map((entry, i) => (
                    <FadeIn key={entry.id} delay={i * 0.03}>
                      <HallOfFameCard entry={{
                        id: entry.id,
                        name: entry.name,
                        rank: entry.rank,
                        category: entry.category,
                        olympiad: entry.olympiad.en,
                        state: entry.state,
                        school: entry.school,
                        year: entry.year,
                        achievement: entry.achievement.en,
                      }} />
                    </FadeIn>
                  ))}
                </div>
              </div>
            );
          })}

          {upcoming.length > 0 && (
            <>
              <FadeIn delay={0.1}>
                <SectionHeader
                  className="mt-20"
                  eyebrow="2026–27"
                  title="No winners published"
                  subtitle="No 2026–27 winners are listed. These categories have not been awarded."
                />
              </FadeIn>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((cat) => (
                  <ComingSoonCard
                    key={cat.id}
                    title={cat.label.en}
                    titleHi={cat.label.hi}
                    description="Nothing has been announced for this category in TEJAS Olympiad 2026–27."
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
