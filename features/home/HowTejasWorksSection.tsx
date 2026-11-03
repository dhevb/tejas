"use client";

import { Timeline } from "@/components/shared/Timeline";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

const steps = [
  {
    year: 1,
    title: "Discover",
    description: "A school registers its students. There is no individual online entry.",
  },
  {
    year: 2,
    title: "Prepare",
    description: "Sample papers and mock tests have not been published. Printed books are optional.",
  },
  {
    year: 3,
    title: "Assess",
    description: "Examinations are offline at the participating school, using question papers and OMR sheets.",
  },
  {
    year: 4,
    title: "Celebrate",
    description: "The invitation sets class-wise cash prizes. The brochure describes medals and an e-certificate, and the documents do not say whether the medals are additional. The brochure prints a tentative results date of 12 January 2027. The invitation says the declaration will be communicated separately.",
  },
];

export function HowTejasWorksSection() {
  return (
    <section className="tejas-section bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            eyebrow="How It Works"
            title="Your TEJAS Journey"
            subtitle="School registration, an offline examination, and announced class-wise prizes."
          />
        </FadeIn>
        <Timeline
          items={steps.map((s) => ({
            year: s.year,
            title: s.title,
            description: s.description,
            status: s.year === 1 ? "current" : "upcoming",
          }))}
        />
      </div>
    </section>
  );
}
