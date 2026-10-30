import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { currentCycle } from "@/content/current-cycle";
import { SchoolRegistrationForm } from "./school-registration-form";

export const metadata = createMetadata({
  title: "School registration",
  description: "Register a school for TEJAS Olympiad 2026–27 and upload the student sheet.",
  path: "/schools/register",
});

export default function SchoolRegisterPage() {
  return (
    <>
      <PageHero
        eyebrow="TEJAS Olympiad 2026–27"
        title="School registration"
        subtitle={`${currentCycle.registrationStatus.en} ${currentCycle.examDates.en}`}
      />
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-sm text-tejas-muted">
            {currentCycle.convener.name}, {currentCycle.convener.titles.join(" and ")}. {currentCycle.convener.phoneDisplay}. {currentCycle.olympiadEmail}.
          </p>
          <SchoolRegistrationForm />
          <p className="mt-8 text-sm text-tejas-muted">
            <Link href="/schools/register/review" className="font-semibold text-tejas-blue underline">Staff review</Link>
          </p>
        </div>
      </section>
    </>
  );
}
