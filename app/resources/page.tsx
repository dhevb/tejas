import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { ResourceCard } from "@/components/shared/ResourceCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { resources, resourceCategories, getResourcesByCategory } from "@/data/resources";

export const metadata = createMetadata({
  title: "Resources",
  description: "Published TEJAS Olympiad 2026–27 pages and the student-sheet template. Unpublished files are not listed.",
  path: "/resources",
});

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Learning Resources Hub"
        subtitle="Olympiad pages, the printed book order, and e-book registration are listed separately. No e-book file is available for download."
        primaryCta={{ label: "Prepare Hub", href: "/prepare" }}
        secondaryCta={{ label: "Olympiads", href: "/olympiads" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {resourceCategories.map((cat, catIndex) => {
            const items = getResourcesByCategory(cat.id);
            if (items.length === 0) return null;
            return (
              <div key={cat.id} className={catIndex > 0 ? "mt-20" : ""}>
                <FadeIn>
                  <SectionHeader title={cat.label.en} subtitle={cat.label.hi} />
                </FadeIn>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((r, i) => (
                    <FadeIn key={r.id} delay={i * 0.04}>
                      <ResourceCard resource={{
                        id: r.id,
                        title: r.title.en,
                        type: r.type,
                        subject: r.subject ?? "General",
                        description: r.description.en,
                        href: r.href,
                      }} />
                    </FadeIn>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
