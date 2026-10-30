import Link from "next/link";
import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata = createMetadata({
  title: "For Schools",
  description: "Partner with TEJAS — school registration, dashboards, and recognition tiers.",
  path: "/schools",
});

export default function SchoolsPage() {
  return (
    <>
      <PageHero
        eyebrow="Schools"
        title="School Partnership Program"
        subtitle="Register the school for TEJAS Olympiad 2026–27 and upload the student sheet."
        primaryCta={{ label: "School registration", href: "/schools/register" }}
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-2xl bg-tejas-blue p-10 text-white text-center">
              <h2 className="text-2xl font-bold">Register Your School</h2>
              <p className="mt-3 text-white/70 max-w-xl mx-auto">
                Registration is open from 1 November 2026 to 20 November 2026. The fee is ₹150 per student per stream.
              </p>
              <Link href="/schools/register" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-tejas-blue">
                Open the registration form
              </Link>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-16 max-w-3xl text-center text-tejas-muted leading-relaxed">
              A participating-school list for 2026–27 has not been published. Medal counts from earlier drafts are not shown here.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
