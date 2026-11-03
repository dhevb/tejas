import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata = createMetadata({
  title: "Rankings",
  description: "No ranking has been published for TEJAS Olympiad 2026–27.",
  path: "/rankings",
});

export default function RankingsPage() {
  return (
    <>
      <PageHero
        eyebrow="Rankings"
        title="Rankings"
        subtitle="No ranking has been published for TEJAS Olympiad 2026–27. A publication date has not been announced."
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-tejas-muted leading-relaxed">
              The examinations are on 9, 10, and 11 December 2026. This page does not show names, schools, or scores.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
