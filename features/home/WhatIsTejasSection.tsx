"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { TejasEmblem } from "@/components/brand/TejasEmblem";
import { brand } from "@/design-system/tokens";
import { brandContent } from "@/content/brand";
import { useI18n } from "@/lib/i18n/context";

export function WhatIsTejasSection() {
  const { t } = useI18n();

  return (
    <div className="tejas-section bg-tejas-ivory">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <TejasEmblem size="lg" className="mb-6" />
            <SectionHeader
              eyebrow="The Platform"
              title="What is TEJAS?"
              subtitle={brand.fullName}
            />
            <p className="mt-4 text-lg text-tejas-muted leading-relaxed">
              {t(brandContent.ecosystem)} — administered by Olympiad Cell, {brand.parentOrg}.
              TEJAS is not just an Olympiad. It is Bharat&apos;s long-term national initiative for
              talent discovery, learning, research, innovation, and recognition.
            </p>
            <p className="mt-4 font-hindi text-tejas-muted">{brand.fullNameHi}</p>
            <ul className="mt-6 space-y-2 text-sm text-tejas-muted">
              <li>• Olympiads &amp; national assessments</li>
              <li>• Learning resources &amp; mock tests</li>
              <li>• Research &amp; Bal Shodh Patrika</li>
              <li>• Hall of Fame &amp; scholarships</li>
            </ul>
            <Link href="/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-tejas-saffron hover:underline">
              Learn the full story
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-tejas-blue to-tejas-blue-dark p-8 text-white shadow-tejas-lg">
            <Sparkles className="h-8 w-8 text-tejas-gold" aria-hidden />
            <p className="mt-4 text-2xl font-bold">{brand.name}</p>
            <p className="text-white/80">{brand.fullName}</p>
            <p className="mt-6 text-sm leading-relaxed text-white/70">
              {t(brandContent.vision)}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/20 pt-6 text-center text-sm">
              <div>
                <p className="text-2xl font-bold text-tejas-gold">3</p>
                <p className="text-white/70">Active Olympiads</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-tejas-gold">10+</p>
                <p className="text-white/70">Subject Ecosystem</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
