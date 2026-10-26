import { createMetadata } from "@/config/seo";
import { PageHero } from "@/components/shared/PageHero";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata = createMetadata({
  title: "Scholarships",
  description: "Scholarship amounts for TEJAS Olympiad 2026–27 have not been announced.",
  path: "/scholarships",
});

export default function ScholarshipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Scholarships"
        title="Scholarships & Grants"
        subtitle="Scholarship amounts for TEJAS Olympiad 2026–27 have not been announced. The published cash prizes are on the Olympiad pages."
      />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-tejas-muted leading-relaxed">
              Overall toppers in each class, in every stream, are listed for ₹3,100, ₹2,100, ₹1,500, and five consolation prizes of ₹500. No separate scholarship, grant, or fellowship amount has been issued.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
