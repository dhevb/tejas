"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundPattern } from "@/components/shared/BackgroundPattern";
import { currentCycle } from "@/content/current-cycle";
import { AnalyticsEvents } from "@/lib/analytics/events";

export function RegisterCTASection() {
  return (
    <section id="register" className="relative scroll-mt-24 overflow-hidden py-20 md:py-28">
      <BackgroundPattern variant="mandala" className="opacity-20" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-tejas-saffron">
          Ready to Participate?
        </p>
        <h2 className="mt-4 text-3xl font-bold text-tejas-ink md:text-4xl">
          Join the {currentCycle.editionName.en}
        </h2>
        <p className="mt-4 text-lg text-tejas-muted leading-relaxed">
          Schools register on this website. TEJAS English, TEJAS Mathematics, and TEJAS Future Tech
          for Classes III–X. {currentCycle.registrationStatus.en} {currentCycle.fee.en}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/schools/register" onClick={() => AnalyticsEvents.registerClick("homepage_cta")}>
            <Button size="lg">Register Now</Button>
          </Link>
          <Link href="/schools">
            <Button variant="outline" size="lg">
              For Schools
            </Button>
          </Link>
        </div>
        <a
          href={`mailto:${currentCycle.olympiadEmail}`}
          className="mt-6 inline-flex items-center gap-2 text-sm text-tejas-muted hover:text-tejas-saffron"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {currentCycle.olympiadEmail}
        </a>
        <Link
          href="/contact"
          className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-tejas-blue hover:underline"
        >
          Contact Olympiad Cell
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
