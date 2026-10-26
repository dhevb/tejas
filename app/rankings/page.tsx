import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata = createMetadata({
  title: "Rankings",
  description: "National rankings for TEJAS Olympiad 2026–27 have not been published.",
  path: "/rankings",
});

export default function RankingsPage() {
  return (
    <>
      <PageHero
        eyebrow="Rankings"
        title="National Rankings"
        subtitle="Rankings for TEJAS Olympiad 2026–27 will be published after the examinations and evaluation. No rank list is available yet."
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-tejas-muted leading-relaxed">
              The examinations are on 9, 10, and 11 December 2026. This page will not show names, schools, or scores until TEJAS Olympiad publishes them.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
