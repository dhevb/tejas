import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import { prepareCategories } from "@/data/resources";
import { cn } from "@/lib/utils";

export function PrepareZoneSection() {
  return (
    <section className="bg-tejas-blue py-16 text-white md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            eyebrow="Prepare"
            title="Your Preparation Hub"
            subtitle="Mock tests, practice sets, video learning, and more — everything you need to excel."
            className="[&_h2]:text-white [&_p]:text-white/70"
          />
        </FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prepareCategories.map((cat, i) => (
            <FadeIn key={cat.id} delay={i * 0.06}>
              <Link
                href={cat.href}
                className="group block rounded-2xl bg-gradient-to-br p-6 transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ backgroundImage: undefined }}
              >
                <div className={cn("rounded-2xl bg-gradient-to-br p-6", cat.gradient)}>
                  <h3 className="text-xl font-bold">{cat.title}</h3>
                  <p className="mt-2 text-sm text-white/80">{cat.description}</p>
                  <p className="mt-4 text-2xl font-bold">{cat.count}+</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium opacity-0 transition group-hover:opacity-100">
                    Explore <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}>
          <div className="mt-10 text-center">
            <Link
              href="/prepare"
              className="inline-flex items-center gap-2 font-semibold text-tejas-gold hover:underline"
            >
              Enter Prepare Hub
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
