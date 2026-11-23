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
              Awards include cash prizes, medals and e-certificates. For each class in each stream the cash prizes are ₹3,100, ₹2,100, ₹1,500 and ten consolation prizes of ₹500. Outstanding students receive gold, silver and bronze medals. Every participant receives an e-certificate. Schools with the highest participation are recognised, and the principal receives a Certificate of Appreciation. No separate scholarship, grant, or fellowship amount is stated beyond these awards.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
