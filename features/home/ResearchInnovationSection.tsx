"use client";

import Link from "next/link";
import { ArrowRight, FlaskConical, Lightbulb, BookOpen } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { BentoGrid, BentoItem } from "@/components/shared/BentoGrid";

const items = [
  {
    icon: FlaskConical,
    title: "Research",
    description: "No research journal or paper from TEJAS Olympiad 2026–27 is published on this website.",
    href: "/resources",
    color: "#047857",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "No innovation award has been announced for TEJAS Olympiad 2026–27.",
    href: "/innovation",
    color: "#8A5A10",
  },
  {
    icon: BookOpen,
    title: "Publications",
    description: "No teacher toolkit or knowledge compendium has been published for this edition.",
    href: "/research",
    color: "#1A2B5D",
  },
];

export function ResearchInnovationSection() {
  return (
    <div className="tejas-section bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Beyond Olympiads"
          title="Research & Innovation"
          subtitle="This website does not publish a research journal, an innovation award, or a toolkit for 2026–27."
        />
        <BentoGrid>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <BentoItem key={item.title} href={item.href}>
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: item.color }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-tejas-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-tejas-muted leading-relaxed">{item.description}</p>
              </BentoItem>
            );
          })}
        </BentoGrid>
        <div className="mt-10 text-center">
          <Link href="/resources" className="inline-flex items-center gap-2 font-semibold text-tejas-saffron hover:underline">
            Explore the knowledge hub
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
