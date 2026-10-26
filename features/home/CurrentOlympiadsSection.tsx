import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OlympiadCard } from "@/components/shared/OlympiadCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import { getActiveOlympiads, olympiads } from "@/data/olympiads";

export function CurrentOlympiadsSection() {
  const active = getActiveOlympiads();
  const comingSoonCount = olympiads.filter((o) => o.status === "coming-soon").length;

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            eyebrow="TEJAS Olympiad 2026–27"
            title="Active Olympiad Streams"
            subtitle="TEJAS English, TEJAS Mathematics, and TEJAS Future Tech for Classes III–X. Registration 1–20 November 2026."
          />
        </FadeIn>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((o, i) => (
            <FadeIn key={o.slug} delay={i * 0.04}>
              <OlympiadCard {...o} status="active" registrationOpen={false} />
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/olympiads"
              className="inline-flex items-center gap-2 font-semibold text-tejas-saffron hover:underline"
            >
              View all {olympiads.length} olympiad streams ({comingSoonCount} coming soon)
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/editions/tejas-2026-27"
              className="inline-flex items-center gap-2 text-sm font-medium text-tejas-muted hover:text-tejas-saffron"
            >
              TEJAS Olympiad 2026–27
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
