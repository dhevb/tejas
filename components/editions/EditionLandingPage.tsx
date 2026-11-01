"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { EditionFullContent } from "@/content/types";
import { StickySubNav } from "@/components/shared/StickySubNav";
import { FAQAccordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/FadeIn";
import { QuoteCard } from "@/components/shared/QuoteCard";
import type { FAQItem } from "@/types";

interface Props {
  edition: EditionFullContent;
}

const editionNav = [
  { id: "about", label: "About" },
  { id: "vision", label: "Vision" },
  { id: "timeline", label: "Timeline" },
  { id: "contributions", label: "Contributions" },
  { id: "olympiads", label: "Olympiads" },
  { id: "gallery", label: "Gallery" },
  { id: "downloads", label: "Downloads" },
  { id: "faq", label: "FAQ" },
];

export function EditionLandingPage({ edition }: Props) {
  const { t } = useI18n();
  const faqItems: FAQItem[] = edition.faqs.map((f) => ({
    question: t(f.question),
    answer: t(f.answer),
  }));

  return (
    <>
      <section
        className="py-20 text-white md:py-28"
        style={{ background: `linear-gradient(135deg, ${edition.imageAccent} 0%, #1A2B5D 100%)` }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge className="bg-white/20 text-white">
            {edition.status === "current" ? "Current Edition" : edition.status === "past" ? "Past Edition" : "Upcoming"}
          </Badge>
          {edition.smkEdition && (
            <p className="mt-3 text-sm text-white/70">Shiksha Mahakumbh {edition.smkEdition}.0</p>
          )}
          <p className="mt-2 text-5xl font-bold">{edition.year}</p>
          <h1 className="mt-4 text-3xl font-bold md:text-5xl">{t(edition.name)}</h1>
          <p className="mt-2 text-xl text-white/80">{t(edition.subtitle)}</p>
          {edition.theme && (
            <p className="mt-4 text-lg italic text-white/70">&ldquo;{t(edition.theme)}&rdquo;</p>
          )}
          <p className="mt-6 max-w-3xl text-white/80 leading-relaxed">{t(edition.bio)}</p>
          {edition.status === "current" && (
            <div className="mt-8">
              <Link href="/olympiads">
                <Button className="bg-white text-tejas-ink hover:bg-white/90">Explore Olympiads</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {edition.stats && edition.stats.length > 0 && (
        <section className="border-b border-stone-200 bg-tejas-ivory py-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
            {edition.stats.map((stat) => (
              <div key={stat.label.en} className="text-center">
                <p className="text-3xl font-bold text-tejas-saffron">{stat.value}</p>
                <p className="text-sm text-tejas-muted">{t(stat.label)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <StickySubNav items={editionNav} />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section id="about" className="scroll-mt-32 pb-16">
          <FadeIn>
            <h2 className="text-2xl font-bold text-tejas-ink">Why This Edition?</h2>
            <p className="mt-4 max-w-3xl text-tejas-muted leading-relaxed">{t(edition.whyThisEdition)}</p>
            {edition.learningValues.length > 0 && (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {edition.learningValues.map((v) => (
                  <li key={v.en} className="rounded-xl border border-stone-200 p-4 text-sm text-tejas-muted">
                    {t(v)}
                  </li>
                ))}
              </ul>
            )}
          </FadeIn>
        </section>

        <section id="vision" className="scroll-mt-32 border-t border-stone-200 py-16">
          <h2 className="text-2xl font-bold text-tejas-ink">Vision</h2>
          <p className="mt-4 max-w-3xl text-tejas-muted leading-relaxed">{t(edition.vision)}</p>
          {edition.quotes.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {edition.quotes.map((q) => (
                <QuoteCard key={q.text.en} quote={t(q.text)} author={t(q.attribution)} role="" />
              ))}
            </div>
          )}
        </section>

        {edition.timeline.length > 0 && (
          <section id="timeline" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Timeline</h2>
            <div className="mt-8 space-y-6 border-l-2 border-tejas-saffron pl-8">
              {edition.timeline.map((event) => (
                <div key={`${event.year}-${event.title.en}`} className="relative">
                  <span className="absolute -left-[41px] flex h-5 w-5 items-center justify-center rounded-full bg-tejas-saffron text-[10px] font-bold text-white">
                    {String(event.year).slice(-2)}
                  </span>
                  <p className="font-bold text-tejas-ink">{t(event.title)}</p>
                  <p className="text-sm text-tejas-muted">{t(event.description)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {edition.majorContributions.length > 0 && (
          <section id="contributions" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Major Contributions</h2>
            <ul className="mt-6 space-y-3">
              {edition.majorContributions.map((c) => (
                <li key={c.en} className="flex items-start gap-3 text-tejas-muted">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tejas-saffron" aria-hidden />
                  {t(c)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {edition.olympiadStreams.length > 0 && (
          <section id="olympiads" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Olympiad Streams</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {edition.olympiadStreams.map((stream) => (
                <Badge key={stream.en} className="px-4 py-2 text-sm">{t(stream)}</Badge>
              ))}
            </div>
            {edition.felicitation && (
              <p className="mt-6 text-tejas-muted">{t(edition.felicitation)}</p>
            )}
          </section>
        )}

        {edition.galleryCaptions.length > 0 && (
          <section id="gallery" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Edition Gallery</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {edition.galleryCaptions.map((caption) => (
                <div key={caption.en} className="flex aspect-video items-end rounded-xl bg-gradient-to-br from-stone-200 to-stone-300 p-4">
                  <p className="text-sm font-medium text-tejas-ink">{t(caption)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {edition.downloads.length > 0 && (
          <section id="downloads" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="text-2xl font-bold text-tejas-ink">Downloads</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {edition.downloads.map((dl) => (
                <div key={dl.title.en} className="rounded-xl border border-stone-200 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-tejas-ink">{t(dl.title)}</p>
                    <Badge variant="outline">{dl.type}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-tejas-muted">{t(dl.description)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {faqItems.length > 0 && (
          <section id="faq" className="scroll-mt-32 border-t border-stone-200 py-16">
            <h2 className="mb-6 text-2xl font-bold text-tejas-ink">FAQs</h2>
            <FAQAccordion items={faqItems} />
          </section>
        )}
      </div>
    </>
  );
}
