import Link from "next/link";
import { Building2, Users, Award, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

const benefits = [
  { icon: Building2, label: "School registration", desc: "Opens 3 November 2026 and closes 20 November 2026" },
  { icon: Users, label: "Student sheet", desc: "The school uploads one sheet and chooses each stream" },
  { icon: Award, label: "School share", desc: "Retain ₹30 of ₹150, and ₹34 of each ₹170 book" },
  { icon: BarChart3, label: "No public ranking", desc: "A 2026–27 school list has not been published" },
];

export function ForSchoolsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <SectionHeader
              eyebrow="For Schools"
              title="Register the school"
              subtitle="Register the school for TEJAS Olympiad 2026–27. A participating-school count for this cycle has not been published."
              align="left"
              className="mb-0"
            />
            <Link href="/schools" className="mt-8 inline-block">
              <Button size="lg">For schools</Button>
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((b) => (
                <div
                  key={b.label}
                  className="rounded-2xl border border-stone-200 bg-white p-6 shadow-tejas"
                >
                  <b.icon className="h-8 w-8 text-tejas-saffron" aria-hidden />
                  <h3 className="mt-3 font-bold text-tejas-ink">{b.label}</h3>
                  <p className="mt-1 text-sm text-tejas-muted">{b.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
