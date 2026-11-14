import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import { newsItems } from "@/data/news";
import { formatDisplayDate } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";

export function NewsSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            eyebrow="Updates"
            title="News & Updates"
            subtitle="Stay informed about editions, registrations, and platform announcements."
          />
        </FadeIn>
        <div className="grid gap-6 md:grid-cols-2">
          {newsItems.map((item, i) => (
            <FadeIn key={item.id} delay={i * 0.06}>
              <article className="rounded-2xl border border-stone-200 p-6 shadow-tejas">
                <div className="flex items-center justify-between gap-4">
                  <Badge variant="outline">{item.category}</Badge>
                  <time dateTime={item.date} className="text-xs text-tejas-muted">
                    {formatDisplayDate(item.date)}
                  </time>
                </div>
                <h3 className="mt-4 text-lg font-bold text-tejas-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-tejas-muted">{item.excerpt}</p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
