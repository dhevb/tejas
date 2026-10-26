import Link from "next/link";
import { Building2, Users, Award, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

const benefits = [
  { icon: Building2, label: "School Dashboard", desc: "Track registrations and performance" },
  { icon: Users, label: "Bulk Registration", desc: "Enroll entire classes in minutes" },
  { icon: Award, label: "Recognition Tiers", desc: "Platinum, Gold, and Silver partners" },
  { icon: BarChart3, label: "Analytics", desc: "Insights on student progress" },
];

export function ForSchoolsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <SectionHeader
              eyebrow="For Schools"
              title="Partner with TEJAS"
              subtitle="Register the school for TEJAS Olympiad 2026–27. A participating-school count for this cycle has not been published."
              align="left"
              className="mb-0"
            />
            <Link href="/schools" className="mt-8 inline-block">
              <Button size="lg">Explore School Partnership</Button>
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
